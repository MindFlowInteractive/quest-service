import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Puzzle } from './entities/puzzle.entity';
import { CreateTagDto, ListTagsDto, TagSortBy, TagSortOrder } from './dto/tag.dto';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new tag. Name is normalised (lowercase, trimmed) before persisting.
   */
  async createTag(dto: CreateTagDto): Promise<Tag> {
    const name = dto.name.trim().toLowerCase();

    const existing = await this.tagRepository.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException(`Tag "${name}" already exists`);
    }

    const tag = this.tagRepository.create({ name });
    const saved = await this.tagRepository.save(tag);
    this.logger.log(`Created tag: ${saved.name} (${saved.id})`);
    return saved;
  }

  /**
   * List all tags, sortable by name or usageCount.
   */
  async listTags(dto: ListTagsDto): Promise<Tag[]> {
    const sortBy = dto.sortBy ?? TagSortBy.NAME;
    const sortOrder = dto.sortOrder ?? TagSortOrder.ASC;

    return this.tagRepository
      .createQueryBuilder('tag')
      .orderBy(`tag.${sortBy}`, sortOrder)
      .getMany();
  }

  /**
   * Find a tag by id or throw NotFoundException.
   */
  async findById(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with id "${id}" not found`);
    }
    return tag;
  }

  /**
   * Attach an array of tag names to a puzzle.
   * Tags that do not yet exist are created automatically.
   * usageCount is incremented for each newly attached tag.
   */
  async attachTags(puzzleId: string, tagNames: string[]): Promise<Puzzle> {
    const normalised = tagNames.map((t) => t.trim().toLowerCase());

    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
      relations: ['tagEntities'],
    });
    if (!puzzle) {
      throw new NotFoundException(`Puzzle with id "${puzzleId}" not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const resolvedTags: Tag[] = [];

      for (const name of normalised) {
        let tag = await queryRunner.manager.findOne(Tag, { where: { name } });
        if (!tag) {
          tag = queryRunner.manager.create(Tag, { name });
          tag = await queryRunner.manager.save(Tag, tag);
          this.logger.log(`Auto-created tag: ${name}`);
        }
        resolvedTags.push(tag);
      }

      // Determine which tags are truly new for this puzzle
      const currentIds = new Set((puzzle.tagEntities ?? []).map((t) => t.id));
      const newTags = resolvedTags.filter((t) => !currentIds.has(t.id));

      // Attach new tags to the puzzle
      puzzle.tagEntities = [...(puzzle.tagEntities ?? []), ...newTags];
      await queryRunner.manager.save(Puzzle, puzzle);

      // Increment usageCount for newly attached tags
      for (const tag of newTags) {
        await queryRunner.manager.increment(Tag, { id: tag.id }, 'usageCount', 1);
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `Attached ${newTags.length} tag(s) to puzzle ${puzzleId}`,
      );

      return this.puzzleRepository.findOne({
        where: { id: puzzleId },
        relations: ['tagEntities'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to attach tags to puzzle ${puzzleId}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Detach a single tag from a puzzle and decrement its usageCount.
   */
  async detachTag(puzzleId: string, tagId: string): Promise<Puzzle> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
      relations: ['tagEntities'],
    });
    if (!puzzle) {
      throw new NotFoundException(`Puzzle with id "${puzzleId}" not found`);
    }

    const tag = await this.findById(tagId);

    const before = (puzzle.tagEntities ?? []).length;
    puzzle.tagEntities = (puzzle.tagEntities ?? []).filter(
      (t) => t.id !== tagId,
    );

    if (puzzle.tagEntities.length === before) {
      throw new NotFoundException(
        `Tag "${tag.name}" is not attached to puzzle "${puzzleId}"`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(Puzzle, puzzle);
      await queryRunner.manager.decrement(
        Tag,
        { id: tagId },
        'usageCount',
        1,
      );
      await queryRunner.commitTransaction();
      this.logger.log(`Detached tag ${tagId} from puzzle ${puzzleId}`);

      return this.puzzleRepository.findOne({
        where: { id: puzzleId },
        relations: ['tagEntities'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to detach tag ${tagId} from puzzle ${puzzleId}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
