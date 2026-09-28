import { createHash } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Content, ContentStatus, ContentType } from '../entities/content.entity.js';
import {
  ContentDeliveryEvent,
  ContentDeliveryEventType,
} from '../entities/content-delivery-event.entity.js';
import { ContentRevision } from '../entities/content-revision.entity.js';

type JsonPatchOperation = {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: unknown;
};

@Injectable()
export class ContentDeliveryService {
  constructor(
    @InjectRepository(Content) private readonly contentRepository: Repository<Content>,
    @InjectRepository(ContentRevision) private readonly revisionRepository: Repository<ContentRevision>,
    @InjectRepository(ContentDeliveryEvent)
    private readonly eventRepository: Repository<ContentDeliveryEvent>,
  ) {}

  async getManifest(options: { updatedSince?: string; contentType?: ContentType } = {}) {
    const query = this.publishedQuery();
    if (options.updatedSince) {
      const timestamp = new Date(options.updatedSince);
      if (Number.isNaN(timestamp.getTime())) {
        throw new BadRequestException('updatedSince must be a valid date');
      }
      query.andWhere('content.updatedAt > :updatedSince', { updatedSince: timestamp });
    }
    if (options.contentType) {
      query.andWhere('content.contentType = :contentType', { contentType: options.contentType });
    }

    const contents = await query.orderBy('content.updatedAt', 'ASC').getMany();
    await this.track(ContentDeliveryEventType.MANIFEST);

    return {
      generatedAt: new Date().toISOString(),
      items: contents.map((content) => {
        const payload = this.toPayload(content);
        return {
          id: content.id,
          title: content.title,
          contentType: content.contentType,
          category: content.category,
          tags: content.tags,
          version: payload.version,
          updatedAt: content.updatedAt,
          etag: this.hash(payload),
        };
      }),
    };
  }

  async getContent(id: string, sinceVersion?: number) {
    if (sinceVersion !== undefined && (!Number.isInteger(sinceVersion) || sinceVersion < 1)) {
      throw new BadRequestException('sinceVersion must be a positive integer');
    }

    const content = await this.publishedQuery().andWhere('content.id = :id', { id }).getOne();
    if (!content) {
      throw new NotFoundException(`Public content with ID ${id} not found`);
    }

    const payload = this.toPayload(content);
    const latestRevision = await this.revisionRepository.findOne({
      where: { contentId: id, version: payload.version },
    });

    if (sinceVersion !== undefined && latestRevision && sinceVersion === payload.version) {
      await this.track(ContentDeliveryEventType.LOAD, id);
      return { id, version: payload.version, mode: 'not-modified' as const };
    }

    if (sinceVersion !== undefined && sinceVersion < payload.version && latestRevision) {
      const baseRevision = await this.revisionRepository.findOne({
        where: { contentId: id, version: sinceVersion },
      });
      if (baseRevision) {
        await this.track(ContentDeliveryEventType.DELTA, id);
        return {
          id,
          version: payload.version,
          updatedAt: content.updatedAt,
          mode: 'delta' as const,
          delta: this.diff(baseRevision.snapshot, latestRevision.snapshot),
        };
      }
    }

    await this.track(ContentDeliveryEventType.LOAD, id);
    return { id, version: payload.version, updatedAt: content.updatedAt, mode: 'full' as const, data: payload };
  }

  async getBundle(ids: string[], prefetch = false) {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0 || uniqueIds.length > 100 || uniqueIds.some((id) => !this.isUuid(id))) {
      throw new BadRequestException('Provide between 1 and 100 valid content IDs');
    }

    const contents = await this.publishedQuery().andWhere('content.id IN (:...ids)', { ids: uniqueIds }).getMany();
    const contentById = new Map(contents.map((content) => [content.id, content]));
    const items = uniqueIds.flatMap((id) => {
      const content = contentById.get(id);
      return content ? [{ id, version: this.toPayload(content).version, data: this.toPayload(content) }] : [];
    });

    await Promise.all(
      items.map(({ id }) => this.track(prefetch ? ContentDeliveryEventType.PREFETCH : ContentDeliveryEventType.BUNDLE, id)),
    );

    return { items, missingIds: uniqueIds.filter((id) => !contentById.has(id)) };
  }

  async getAnalytics(since?: string) {
    const query: SelectQueryBuilder<ContentDeliveryEvent> = this.eventRepository
      .createQueryBuilder('event')
      .select('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.eventType');

    if (since) {
      const timestamp = new Date(since);
      if (Number.isNaN(timestamp.getTime())) {
        throw new BadRequestException('since must be a valid date');
      }
      query.where('event.createdAt >= :since', { since: timestamp });
    }

    const rows = await query.getRawMany<{ eventType: string; count: string }>();
    return rows.map((row) => ({ eventType: row.eventType, count: Number(row.count) }));
  }

  private publishedQuery(): SelectQueryBuilder<Content> {
    return this.contentRepository
      .createQueryBuilder('content')
      .where('content.isPublic = :isPublic', { isPublic: true })
      .andWhere('content.status = :status', { status: ContentStatus.PUBLISHED });
  }

  private toPayload(content: Content) {
    const metadataVersion = content.metadata?.version;
    return {
      id: content.id,
      title: content.title,
      contentType: content.contentType,
      category: content.category,
      tags: content.tags,
      content: content.content,
      metadata: content.metadata,
      version: typeof metadataVersion === 'number' && Number.isInteger(metadataVersion) ? metadataVersion : 1,
      updatedAt: content.updatedAt,
    };
  }

  private async track(eventType: ContentDeliveryEventType, contentId: string | null = null): Promise<void> {
    await this.eventRepository.save(this.eventRepository.create({ eventType, contentId }));
  }

  private hash(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  private diff(previous: unknown, next: unknown, path = ''): JsonPatchOperation[] {
    if (this.isObject(previous) && this.isObject(next)) {
      const operations: JsonPatchOperation[] = [];
      for (const key of Object.keys(previous)) {
        const escapedKey = key.replace(/~/g, '~0').replace(/\//g, '~1');
        const childPath = `${path}/${escapedKey}`;
        if (!(key in next)) {
          operations.push({ op: 'remove', path: childPath });
        } else {
          operations.push(...this.diff(previous[key], next[key], childPath));
        }
      }
      for (const key of Object.keys(next)) {
        if (!(key in previous)) {
          const escapedKey = key.replace(/~/g, '~0').replace(/\//g, '~1');
          operations.push({ op: 'add', path: `${path}/${escapedKey}`, value: next[key] });
        }
      }
      return operations;
    }

    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      return [{ op: path ? 'replace' : 'replace', path, value: next }];
    }
    return [];
  }

  private isObject(value: unknown): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}