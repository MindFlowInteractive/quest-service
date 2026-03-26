import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PuzzleVersion } from '../entities/puzzle-version.entity';
import { Puzzle } from '../entities/puzzle.entity';

// Fields compared when building a diff between versions
const DIFFABLE_FIELDS = [
  'title',
  'description',
  'category',
  'difficulty',
  'difficultyRating',
  'basePoints',
  'timeLimit',
  'maxHints',
  'content',
  'hints',
  'tags',
  'prerequisites',
  'scoring',
  'isActive',
  'isFeatured',
] as const;

type DiffableField = (typeof DIFFABLE_FIELDS)[number];

export interface PuzzleVersionListItem {
  id: string;
  puzzleId: string;
  version: number;
  changedBy: string;
  changeNote?: string;
  diff: string[];
  createdAt: Date;
}

export interface PuzzleVersionDetail extends PuzzleVersionListItem {
  content: PuzzleVersion['content'];
}

@Injectable()
export class PuzzleVersionService {
  private readonly logger = new Logger(PuzzleVersionService.name);

  constructor(
    @InjectRepository(PuzzleVersion)
    private versionRepository: Repository<PuzzleVersion>,
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
    private dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Core: snapshot before every edit
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Captures the *current* puzzle state as a new immutable version row.
   * Must be called inside the same transaction as the UPDATE.
   *
   * @returns The saved PuzzleVersion row.
   */
  async snapshotBefore(
    puzzle: Puzzle,
    changedBy: string,
    changeNote?: string,
  ): Promise<PuzzleVersion> {
    // Determine next version number for this puzzle
    const lastVersion = await this.versionRepository.findOne({
      where: { puzzleId: puzzle.id },
      order: { version: 'DESC' },
    });

    const nextVersion = (lastVersion?.version ?? 0) + 1;

    // Build diff against previous snapshot (if any)
    const diff = await this.computeDiff(puzzle.id, puzzle, lastVersion ?? null);

    const snapshot = this.versionRepository.create({
      puzzleId: puzzle.id,
      version: nextVersion,
      changedBy,
      changeNote,
      diff,
      content: {
        title: puzzle.title,
        description: puzzle.description,
        category: puzzle.category,
        difficulty: puzzle.difficulty,
        difficultyRating: puzzle.difficultyRating,
        basePoints: puzzle.basePoints,
        timeLimit: puzzle.timeLimit,
        maxHints: puzzle.maxHints,
        content: puzzle.content,
        hints: puzzle.hints,
        tags: puzzle.tags,
        prerequisites: puzzle.prerequisites,
        scoring: puzzle.scoring,
        metadata: puzzle.metadata,
        isActive: puzzle.isActive,
        isFeatured: puzzle.isFeatured,
        publishedAt: puzzle.publishedAt ?? null,
      },
    });

    const saved = await this.versionRepository.save(snapshot);
    this.logger.log(
      `Snapshot v${nextVersion} created for puzzle ${puzzle.id} by ${changedBy}`,
    );
    return saved;
  }

  /**
   * Returns the most recent PuzzleVersion id for a given puzzle.
   * Used to lock a GameSession or completion record to the version that was
   * live when the interaction started.
   */
  async getCurrentVersionId(puzzleId: string): Promise<string | null> {
    const latest = await this.versionRepository.findOne({
      where: { puzzleId },
      order: { version: 'DESC' },
    });
    return latest?.id ?? null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Read endpoints
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List all versions for a puzzle, newest first.
   * Includes author and diff summary; omits the heavy content blob.
   */
  async listVersions(puzzleId: string): Promise<PuzzleVersionListItem[]> {
    await this.assertPuzzleExists(puzzleId);

    const versions = await this.versionRepository.find({
      where: { puzzleId },
      order: { version: 'DESC' },
      select: ['id', 'puzzleId', 'version', 'changedBy', 'changeNote', 'diff', 'createdAt'],
    });

    return versions;
  }

  /**
   * Retrieve the full snapshot for a specific version number.
   */
  async getVersion(puzzleId: string, version: number): Promise<PuzzleVersionDetail> {
    await this.assertPuzzleExists(puzzleId);

    const record = await this.versionRepository.findOne({
      where: { puzzleId, version },
    });

    if (!record) {
      throw new NotFoundException(
        `Version ${version} not found for puzzle ${puzzleId}`,
      );
    }

    return record as PuzzleVersionDetail;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Rollback (admin only)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Rolls back the puzzle to the exact state of a previous version.
   * A new snapshot is created FIRST (so the rollback itself is versioned),
   * then the live puzzle row is overwritten with the prior snapshot content.
   *
   * @param puzzleId  Target puzzle.
   * @param version   Version number to restore.
   * @param adminId   Must be an admin — verified by the controller.
   * @param changeNote  Optional note recorded in the rollback snapshot.
   */
  async rollbackTo(
    puzzleId: string,
    version: number,
    adminId: string,
    changeNote?: string,
  ): Promise<Puzzle> {
    const targetVersion = await this.getVersion(puzzleId, version);

    return await this.dataSource.transaction(async (manager) => {
      const puzzle = await manager.findOne(Puzzle, { where: { id: puzzleId } });
      if (!puzzle) throw new NotFoundException(`Puzzle ${puzzleId} not found`);

      // Snapshot current state before overwriting
      await manager.save(
        manager.create(PuzzleVersion, {
          puzzleId: puzzle.id,
          version: await this.nextVersionNumber(puzzleId),
          changedBy: adminId,
          changeNote: changeNote ?? `Rollback to v${version}`,
          diff: await this.computeDiff(puzzleId, puzzle, targetVersion as any),
          content: {
            title: puzzle.title,
            description: puzzle.description,
            category: puzzle.category,
            difficulty: puzzle.difficulty,
            difficultyRating: puzzle.difficultyRating,
            basePoints: puzzle.basePoints,
            timeLimit: puzzle.timeLimit,
            maxHints: puzzle.maxHints,
            content: puzzle.content,
            hints: puzzle.hints,
            tags: puzzle.tags,
            prerequisites: puzzle.prerequisites,
            scoring: puzzle.scoring,
            metadata: puzzle.metadata,
            isActive: puzzle.isActive,
            isFeatured: puzzle.isFeatured,
            publishedAt: puzzle.publishedAt ?? null,
          },
        }),
      );

      // Overwrite live puzzle with the restored snapshot
      const { content: snap } = targetVersion;
      Object.assign(puzzle, {
        title: snap.title,
        description: snap.description,
        category: snap.category,
        difficulty: snap.difficulty,
        difficultyRating: snap.difficultyRating,
        basePoints: snap.basePoints,
        timeLimit: snap.timeLimit,
        maxHints: snap.maxHints,
        content: snap.content,
        hints: snap.hints,
        tags: snap.tags,
        prerequisites: snap.prerequisites,
        scoring: snap.scoring,
        isActive: snap.isActive,
        isFeatured: snap.isFeatured,
        publishedAt: snap.publishedAt,
        metadata: {
          ...snap.metadata,
          lastModifiedBy: adminId,
          rollbackFromVersion: version,
        },
      });

      const restored = await manager.save(Puzzle, puzzle);
      this.logger.log(
        `Puzzle ${puzzleId} rolled back to v${version} by admin ${adminId}`,
      );
      return restored;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Compute which fields differ between the live puzzle and the previous snapshot.
   * Returns an array of field-name strings (or [] for the very first version).
   */
  private async computeDiff(
    puzzleId: string,
    currentPuzzle: Puzzle,
    previousVersion: PuzzleVersion | null,
  ): Promise<string[]> {
    if (!previousVersion) {
      return []; // first version — nothing to diff against
    }

    const prev = previousVersion.content;
    const changed: string[] = [];

    for (const field of DIFFABLE_FIELDS) {
      const a = (prev as any)[field];
      const b = (currentPuzzle as any)[field];
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        changed.push(field);
      }
    }

    return changed;
  }

  private async nextVersionNumber(puzzleId: string): Promise<number> {
    const last = await this.versionRepository.findOne({
      where: { puzzleId },
      order: { version: 'DESC' },
    });
    return (last?.version ?? 0) + 1;
  }

  private async assertPuzzleExists(puzzleId: string): Promise<void> {
    const exists = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
      select: ['id'],
    });
    if (!exists) {
      throw new NotFoundException(`Puzzle ${puzzleId} not found`);
    }
  }
}
