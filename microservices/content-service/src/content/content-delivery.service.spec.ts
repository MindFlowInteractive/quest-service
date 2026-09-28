import { BadRequestException } from '@nestjs/common';
import { ContentDeliveryService } from './content-delivery.service.js';
import { ContentStatus, ContentType } from '../entities/content.entity.js';
import { ContentDeliveryEventType } from '../entities/content-delivery-event.entity.js';

describe('ContentDeliveryService', () => {
  const content = {
    id: '8b4c1c98-b427-4ad2-97b0-6f27f3bba7ad',
    title: 'Sample',
    contentType: ContentType.ARTICLE,
    category: 'guides',
    tags: ['intro'],
    content: { body: 'new text' },
    metadata: { version: 2 },
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  let service: ContentDeliveryService;
  let contentQuery: any;
  let revisionRepository: any;
  let eventRepository: any;

  beforeEach(() => {
    contentQuery = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([content]),
      getOne: jest.fn().mockResolvedValue(content),
    };
    revisionRepository = { findOne: jest.fn(), create: jest.fn((value) => value) };
    eventRepository = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
    };
    service = new ContentDeliveryService(
      { createQueryBuilder: jest.fn(() => contentQuery) } as any,
      revisionRepository,
      eventRepository,
    );
  });

  it('returns a lightweight manifest with content hashes', async () => {
    const result = await service.getManifest();
    expect(result.items[0]).toEqual(expect.objectContaining({ id: content.id, version: 2 }));
    expect(result.items[0].etag).toMatch(/^[a-f0-9]{64}$/);
    expect(result.items[0]).not.toHaveProperty('content');
    expect(eventRepository.save).toHaveBeenCalledWith({ eventType: ContentDeliveryEventType.MANIFEST, contentId: null });
  });

  it('returns only a JSON patch when the requested base revision exists', async () => {
    revisionRepository.findOne
      .mockResolvedValueOnce({ snapshot: { content: { body: 'new text' } } })
      .mockResolvedValueOnce({ snapshot: { content: { body: 'old text' } } });

    const result = await service.getContent(content.id, 1);
    expect(result).toEqual(expect.objectContaining({
      mode: 'delta',
      delta: [{ op: 'replace', path: '/content/body', value: 'new text' }],
    }));
    expect(eventRepository.save).toHaveBeenCalledWith({ eventType: ContentDeliveryEventType.DELTA, contentId: content.id });
  });

  it('falls back to a full payload if a delta base is unavailable', async () => {
    revisionRepository.findOne.mockResolvedValueOnce({ contentId: content.id, version: 2 }).mockResolvedValueOnce(null);
    const result = await service.getContent(content.id, 1);
    expect(result).toEqual(expect.objectContaining({ mode: 'full', data: expect.objectContaining({ content: content.content }) }));
  });

  it('rejects invalid bundle IDs and versions', async () => {
    await expect(service.getBundle(['not-a-uuid'])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.getContent(content.id, 0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns requested bundle items in request order and tracks prefetch events', async () => {
    const result = await service.getBundle([content.id], true);
    expect(result.items[0].id).toBe(content.id);
    expect(eventRepository.save).toHaveBeenCalledWith({ eventType: ContentDeliveryEventType.PREFETCH, contentId: content.id });
  });
});