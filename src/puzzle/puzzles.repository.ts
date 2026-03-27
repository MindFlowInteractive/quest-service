import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleEntity } from './entities/puzzle.entity';

export interface PuzzleSearchParams {
  q?: string;
  type?: string;
  difficulty_min?: number | string;
  difficulty_max?: number | string;
  tags?: string;
  author?: string;
  status?: 'completed' | 'in-progress' | 'not-started';
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  page?: number | string;
  limit?: number | string;
}

@Injectable()
export class PuzzlesRepository {
  constructor(
    @InjectRepository(PuzzleEntity)
    private readonly repo: Repository<PuzzleEntity>,
  ) {}

  async search(params: PuzzleSearchParams, userId: string) {
    const qb = this.repo.createQueryBuilder('puzzle');

    /**
     * FULL TEXT SEARCH (Postgres)
     * NOTE: ensure GIN index exists on tsvector expression for performance
     */
    if (params.q?.trim()) {
      qb.andWhere(
        `to_tsvector('english', puzzle.title || ' ' || puzzle.description)
         @@ plainto_tsquery(:q)`,
        { q: params.q.trim() },
      );
    }

    // Type filter
    if (params.type) {
      qb.andWhere('puzzle.type = :type', { type: params.type });
    }

    // Difficulty range (safe numeric coercion)
    if (params.difficulty_min !== undefined) {
      qb.andWhere('puzzle.difficulty >= :min', {
        min: Number(params.difficulty_min),
      });
    }

    if (params.difficulty_max !== undefined) {
      qb.andWhere('puzzle.difficulty <= :max', {
        max: Number(params.difficulty_max),
      });
    }

    // Tags (AND logic)
    if (params.tags?.trim()) {
      const tags = params.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      tags.forEach((tag, idx) => {
        qb.andWhere(`:tag${idx} = ANY(puzzle.tags)`, {
          [`tag${idx}`]: tag,
        });
      });
    }

    // Author filter
    if (params.author) {
      qb.andWhere('puzzle.authorId = :author', {
        author: params.author,
      });
    }

    /**
     * USER PROGRESS JOIN (only when needed)
     */
    if (params.status) {
      qb.leftJoin(
        'puzzle.progress',
        'progress',
        'progress.userId = :userId',
        { userId },
      );

      if (params.status === 'completed') {
        qb.andWhere('progress.completed = true');
      }

      if (params.status === 'in-progress') {
        qb.andWhere('progress.started = true AND progress.completed = false');
      }

      if (params.status === 'not-started') {
        qb.andWhere('progress.id IS NULL');
      }
    }

    /**
     * SORTING (whitelist recommended to prevent SQL injection)
     */
    const allowedSortFields = new Set([
      'createdAt',
      'difficulty',
      'title',
    ]);

    const sortBy = allowedSortFields.has(params.sortBy ?? '')
      ? params.sortBy!
      : 'createdAt';

    const order =
      params.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`puzzle.${sortBy}`, order);

    /**
     * PAGINATION (safe defaults)
     */
    const page = Math.max(parseInt(String(params.page || '1'), 10), 1);
    const limit = Math.min(
      Math.max(parseInt(String(params.limit || '20'), 10), 1),
      100,
    );

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data,
    };
  }
}