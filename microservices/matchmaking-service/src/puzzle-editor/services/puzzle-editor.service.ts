/**
 * Puzzle Editor Service
 * Main service for managing puzzle editor instances
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, Between } from 'typeorm';
import {
  CreatePuzzleEditorDto,
  UpdatePuzzleEditorDto,
  SaveEditorStateDto,
  SearchPuzzleEditorsDto,
  PublishPuzzleEditorDto,
} from '../dto';
import { PuzzleEditor } from '../entities/puzzle-editor.entity';
import { PuzzleEditorVersion } from '../entities/puzzle-editor-version.entity';
import { PuzzleTemplate } from '../entities/puzzle-template.entity';
import { PuzzleEditorActivity } from '../entities/puzzle-editor-activity.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { User } from '../../users/entities/user.entity';
import { PuzzleValidationService } from './puzzle-validation.service';
import { EditorState, EditorComponent, ComponentConnection } from '../interfaces/editor.interfaces';

@Injectable()
export class PuzzleEditorService {
  private readonly logger = new Logger(PuzzleEditorService.name);

  constructor(
    @InjectRepository(PuzzleEditor)
    private editorRepository: Repository<PuzzleEditor>,
    @InjectRepository(PuzzleEditorVersion)
    private versionRepository: Repository<PuzzleEditorVersion>,
    @InjectRepository(PuzzleTemplate)
    private templateRepository: Repository<PuzzleTemplate>,
    @InjectRepository(PuzzleEditorActivity)
    private activityRepository: Repository<PuzzleEditorActivity>,
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private validationService: PuzzleValidationService,
  ) {}

  /**
   * Create new puzzle editor
   */
  async createEditor(dto: CreatePuzzleEditorDto, userId: string): Promise<PuzzleEditor> {
    try {
      // Check if template exists
      let template: PuzzleTemplate | null = null;
      if (dto.templateId) {
        template = await this.templateRepository.findOne({
          where: { id: dto.templateId },
        });
        if (!template) {
          throw new NotFoundException(`Template ${dto.templateId} not found`);
        }
      }

      // Create new editor
      const editor = this.editorRepository.create({
        title: dto.title,
        description: dto.description,
        createdBy: userId,
        lastModifiedBy: userId,
        status: 'DRAFT',
        templateId: dto.templateId,
        components: template?.baseState?.components || [],
        connections: template?.baseState?.connections || [],
        metadata: {
          version: '1.0',
          puzzleType: dto.metadata?.puzzleType || 'CUSTOM',
          difficulty: dto.metadata?.difficulty || 'MEDIUM',
          category: dto.metadata?.category || 'General',
          tags: dto.tags || [],
          isPublic: dto.isPublic || false,
          isCollaborative: dto.isCollaborative || false,
          collaborators: [],
          viewCount: 0,
          testCount: 0,
        },
      });

      const savedEditor = await this.editorRepository.save(editor);

      // Log activity
      await this.logActivity(userId, savedEditor.id, 'COMPONENT_CREATED', {
        editorId: savedEditor.id,
        templateId: dto.templateId,
      });

      // If using template, increment usage count
      if (template) {
        await this.templateRepository.increment({ id: dto.templateId }, 'usageCount', 1);
      }

      this.logger.log(`Created puzzle editor: ${savedEditor.id} by user: ${userId}`);
      return savedEditor;
    } catch (error) {
      this.logger.error(`Failed to create puzzle editor: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get puzzle editor by ID
   */
  async getEditor(editorId: string, userId?: string): Promise<PuzzleEditor> {
    const editor = await this.editorRepository.findOne({
      where: { id: editorId },
      relations: ['collaborators', 'versions', 'puzzle', 'template'],
    });

    if (!editor) {
      throw new NotFoundException(`Puzzle editor ${editorId} not found`);
    }

    // Check access permissions
    if (userId && editor.createdBy !== userId) {
      const isCollaborator = editor.collaborators?.some((c) => c.id === userId);
      if (!isCollaborator && !editor.metadata.isPublic) {
        throw new ForbiddenException('You do not have access to this puzzle editor');
      }
    }

    return editor;
  }

  /**
   * Update puzzle editor
   */
  async updateEditor(editorId: string, dto: UpdatePuzzleEditorDto, userId: string): Promise<PuzzleEditor> {
    const editor = await this.getEditor(editorId, userId);

    // Check permissions
    if (editor.createdBy !== userId) {
      throw new ForbiddenException('You can only edit your own puzzle editors');
    }

    // Update fields
    if (dto.title) editor.title = dto.title;
    if (dto.description !== undefined) editor.description = dto.description;
    if (dto.status) editor.status = dto.status;
    if (dto.components) editor.components = dto.components;
    if (dto.connections) editor.connections = dto.connections;
    if (dto.editorMetadata) editor.editorMetadata = dto.editorMetadata;
    if (dto.metadata) editor.metadata = { ...editor.metadata, ...dto.metadata };
    if (dto.tags) editor.metadata.tags = dto.tags;

    editor.lastModifiedBy = userId;
    editor.updatedAt = new Date();

    const updated = await this.editorRepository.save(editor);

    // Log activity
    await this.logActivity(userId, editorId, 'COMPONENT_MODIFIED', {
      changes: Object.keys(dto).filter((k) => k !== 'components' && k !== 'connections'),
    });

    this.logger.log(`Updated puzzle editor: ${editorId}`);
    return updated;
  }

  /**
   * Delete puzzle editor
   */
  async deleteEditor(editorId: string, userId: string): Promise<void> {
    const editor = await this.getEditor(editorId, userId);

    // Check permissions
    if (editor.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own puzzle editors');
    }

    // Soft delete
    editor.deletedAt = new Date();
    await this.editorRepository.save(editor);

    // Log activity
    await this.logActivity(userId, editorId, 'COMPONENT_DELETED', {
      editorId,
    });

    this.logger.log(`Deleted puzzle editor: ${editorId}`);
  }

  /**
   * Save editor state
   */
  async saveEditorState(editorId: string, dto: SaveEditorStateDto, userId: string): Promise<PuzzleEditor> {
    const editor = await this.getEditor(editorId, userId);

    // Check permissions
    if (editor.createdBy !== userId) {
      throw new ForbiddenException('You can only save your own puzzle editors');
    }

    // Validate state
    const validationResult = await this.validationService.validatePuzzle(
      dto.components,
      dto.connections,
    );

    // Update components and connections
    editor.components = dto.components;
    editor.connections = dto.connections;
    if (dto.editorMetadata) {
      editor.editorMetadata = dto.editorMetadata;
    }
    editor.lastModifiedBy = userId;
    editor.updatedAt = new Date();

    const saved = await this.editorRepository.save(editor);

    // Create version snapshot if description provided
    if (dto.description || dto.versionTag) {
      await this.createVersion(editorId, {
        description: dto.description || 'Auto-save',
        versionTag: dto.versionTag,
      }, userId);
    }

    // Log activity
    await this.logActivity(userId, editorId, 'COMPONENT_MODIFIED', {
      componentCount: dto.components.length,
      connectionCount: dto.connections.length,
      isValid: validationResult.isValid,
    });

    return saved;
  }

  /**
   * Search puzzle editors
   */
  async searchEditors(dto: SearchPuzzleEditorsDto, userId?: string): Promise<{
    editors: PuzzleEditor[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 20, 100);
    const skip = (page - 1) * limit;

    let query = this.editorRepository.createQueryBuilder('editor');

    // Filter by user access
    if (userId) {
      query = query.where(
        '(editor.createdBy = :userId OR editor.isPublic = true OR :userId IN (SELECT userId FROM puzzle_editor_collaborators WHERE puzzleEditorId = editor.id))',
        { userId },
      );
    } else {
      query = query.where('editor.metadata->>\'isPublic\' = :isPublic', { isPublic: 'true' });
    }

    // Apply filters
    if (dto.search) {
      query = query.andWhere(
        '(editor.title ILIKE :search OR editor.description ILIKE :search)',
        { search: `%${dto.search}%` },
      );
    }

    if (dto.status) {
      query = query.andWhere('editor.status = :status', { status: dto.status });
    }

    if (dto.tags && dto.tags.length > 0) {
      query = query.andWhere('editor.metadata->\'tags\' ?| :tags', { tags: dto.tags });
    }

    // Sort
    const sortBy = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    query = query.orderBy(`editor.${sortBy}`, sortOrder);

    // Pagination
    const [editors, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      editors,
      total,
      page,
      limit,
    };
  }

  /**
   * Create version snapshot
   */
  async createVersion(
    editorId: string,
    data: { description: string; versionTag?: string; metadata?: any },
    userId: string,
  ): Promise<PuzzleEditorVersion> {
    const editor = await this.getEditor(editorId, userId);

    // Get latest version number
    const latestVersion = await this.versionRepository.findOne({
      where: { puzzleEditorId: editorId },
      order: { versionNumber: 'DESC' },
    });

    const versionNumber = (latestVersion?.versionNumber || 0) + 1;

    const version = this.versionRepository.create({
      puzzleEditorId: editorId,
      versionNumber,
      versionTag: data.versionTag,
      state: {
        components: editor.components,
        connections: editor.connections,
        editorMetadata: editor.editorMetadata,
      } as any,
      createdBy: userId,
      description: data.description,
      isPublished: false,
      metadata: {
        changesSummary: data.description,
        affectedComponents: editor.components.map((c: any) => c.id),
        tags: [],
        ...data.metadata,
      },
    });

    const saved = await this.versionRepository.save(version);

    // Log activity
    await this.logActivity(userId, editorId, 'VERSION_CREATED', {
      versionNumber,
      versionTag: data.versionTag,
    });

    return saved;
  }

  /**
   * Get version history
   */
  async getVersionHistory(editorId: string, userId: string): Promise<PuzzleEditorVersion[]> {
    await this.getEditor(editorId, userId);

    return this.versionRepository.find({
      where: { puzzleEditorId: editorId },
      order: { versionNumber: 'DESC' },
    });
  }

  /**
   * Restore from version
   */
  async restoreVersion(
    editorId: string,
    versionId: string,
    userId: string,
  ): Promise<PuzzleEditor> {
    const editor = await this.getEditor(editorId, userId);

    // Check permissions
    if (editor.createdBy !== userId) {
      throw new ForbiddenException('You can only restore versions for your own puzzle editors');
    }

    const version = await this.versionRepository.findOne({
      where: { id: versionId, puzzleEditorId: editorId },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Restore state
    editor.components = version.state.components;
    editor.connections = version.state.connections;
    editor.editorMetadata = version.state.editorMetadata;
    editor.lastModifiedBy = userId;
    editor.updatedAt = new Date();

    const restored = await this.editorRepository.save(editor);

    // Create new version for this restoration
    await this.createVersion(editorId, {
      description: `Restored from version ${version.versionNumber}`,
      metadata: { restoredFromVersion: version.id },
    }, userId);

    // Log activity
    await this.logActivity(userId, editorId, 'VERSION_CREATED', {
      restoredFromVersion: version.id,
    });

    return restored;
  }

  /**
   * Publish puzzle from editor
   */
  async publishPuzzle(
    editorId: string,
    dto: PublishPuzzleEditorDto,
    userId: string,
  ): Promise<Puzzle> {
    const editor = await this.getEditor(editorId, userId);

    // Check permissions
    if (editor.createdBy !== userId) {
      throw new ForbiddenException('You can only publish your own puzzle editors');
    }

    // Validate puzzle
    const validationResult = await this.validationService.validatePuzzle(
      editor.components,
      editor.connections,
    );

    if (!validationResult.isValid) {
      throw new BadRequestException(
        `Cannot publish puzzle with validation errors: ${validationResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    // Update editor status
    editor.status = 'PUBLISHED';
    await this.editorRepository.save(editor);

    // Create puzzle entity
    let puzzle = editor.puzzle;
    if (!puzzle) {
      puzzle = this.puzzleRepository.create({
        title: dto.title,
        description: dto.description,
        category: dto.category,
        difficulty: dto.difficulty,
        difficultyRating: this.calculateDifficultyRating(dto.difficulty),
        content: {
          components: editor.components,
          connections: editor.connections,
        },
        basePoints: 100,
        timeLimit: 300,
        maxHints: 3,
        tags: dto.tags,
        scoring: dto.scoring || {},
        createdBy: userId,
      });
    } else {
      puzzle.title = dto.title;
      puzzle.description = dto.description;
      puzzle.category = dto.category;
      puzzle.difficulty = dto.difficulty;
      puzzle.tags = dto.tags;
      puzzle.content = {
        components: editor.components,
        connections: editor.connections,
      };
      if (dto.scoring) puzzle.scoring = dto.scoring;
    }

    const published = await this.puzzleRepository.save(puzzle);

    // Update editor with puzzle reference
    editor.puzzleId = published.id;
    await this.editorRepository.save(editor);

    // Create version for publication
    await this.createVersion(editorId, {
      description: 'Published puzzle',
      metadata: { publishedAs: published.id, isPublished: true },
    }, userId);

    // Log activity
    await this.logActivity(userId, editorId, 'PUZZLE_PUBLISHED', {
      puzzleId: published.id,
    });

    this.logger.log(`Published puzzle ${published.id} from editor ${editorId}`);

    return published;
  }

  /**
   * Add collaborator to editor
   */
  async addCollaborator(
    editorId: string,
    collaboratorId: string,
    userId: string,
  ): Promise<PuzzleEditor> {
    const editor = await this.getEditor(editorId, userId);

    // Check permissions
    if (editor.createdBy !== userId) {
      throw new ForbiddenException('Only the owner can add collaborators');
    }

    // Check if collaborator already exists
    if (editor.collaborators?.some((c) => c.id === collaboratorId)) {
      throw new ConflictException('User is already a collaborator');
    }

    // Add collaborator
    const collaborator = await this.userRepository.findOne({
      where: { id: collaboratorId },
    });

    if (!collaborator) {
      throw new NotFoundException(`User ${collaboratorId} not found`);
    }

    if (!editor.collaborators) {
      editor.collaborators = [];
    }

    editor.collaborators.push(collaborator);
    editor.metadata.collaborators = editor.collaborators.map((c) => c.id);

    const updated = await this.editorRepository.save(editor);

    // Log activity
    await this.logActivity(userId, editorId, 'COLLABORATION_JOINED', {
      collaboratorId,
    });

    return updated;
  }

  /**
   * Remove collaborator from editor
   */
  async removeCollaborator(
    editorId: string,
    collaboratorId: string,
    userId: string,
  ): Promise<PuzzleEditor> {
    const editor = await this.getEditor(editorId, userId);

    // Check permissions
    if (editor.createdBy !== userId) {
      throw new ForbiddenException('Only the owner can remove collaborators');
    }

    if (editor.collaborators) {
      editor.collaborators = editor.collaborators.filter((c) => c.id !== collaboratorId);
      editor.metadata.collaborators = editor.collaborators.map((c) => c.id);
    }

    const updated = await this.editorRepository.save(editor);

    // Log activity
    await this.logActivity(userId, editorId, 'COLLABORATION_LEFT', {
      collaboratorId,
    });

    return updated;
  }

  /**
   * Log editor activity
   */
  private async logActivity(
    userId: string,
    editorId: string,
    activityType: string,
    details: Record<string, any>,
  ): Promise<void> {
    try {
      const activity = this.activityRepository.create({
        userId,
        puzzleEditorId: editorId,
        activityType,
        details,
        metadata: {
          sessionId: Date.now().toString(),
        },
      });

      await this.activityRepository.save(activity);
    } catch (error) {
      this.logger.warn(`Failed to log activity: ${error.message}`);
    }
  }

  /**
   * Calculate difficulty rating from difficulty string
   */
  private calculateDifficultyRating(difficulty: string): number {
    const ratings: Record<string, number> = {
      EASY: 1,
      MEDIUM: 2,
      HARD: 3,
      EXPERT: 4,
    };
    return ratings[difficulty] || 2;
  }
}
