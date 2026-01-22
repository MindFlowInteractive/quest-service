import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Bookmark } from './bookmark.entity';
import { Tag } from '../tags/tag.entity';
import { CreateBookmarkDto, UpdateBookmarkDto } from './dto';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  async create(userId: string, dto: CreateBookmarkDto): Promise<Bookmark> {
    const { puzzleId, notes, isFavorite, tagNames } = dto;

    // Check if bookmark already exists
    const existing = await this.bookmarkRepository.findOne({
      where: { userId, puzzleId },
    });

    if (existing) {
      throw new Error('Bookmark already exists for this puzzle');
    }

    const bookmark = this.bookmarkRepository.create({
      userId,
      puzzleId,
      notes,
      isFavorite: isFavorite || false,
    });

    const savedBookmark = await this.bookmarkRepository.save(bookmark);

    // Handle tags if provided
    if (tagNames && tagNames.length > 0) {
      const tags = await this.ensureTagsExist(userId, tagNames);
      savedBookmark.tags = tags;
      await this.bookmarkRepository.save(savedBookmark);
    }

    return this.findOne(savedBookmark.id);
  }

  async findAll(userId: string): Promise<Bookmark[]> {
    return this.bookmarkRepository.find({
      where: { userId },
      relations: ['tags'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Bookmark> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { id },
      relations: ['tags'],
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return bookmark;
  }

  async findByPuzzle(
    userId: string,
    puzzleId: string,
  ): Promise<Bookmark | null> {
    return this.bookmarkRepository.findOne({
      where: { userId, puzzleId },
      relations: ['tags'],
    });
  }

  async update(id: string, dto: UpdateBookmarkDto): Promise<Bookmark> {
    const bookmark = await this.findOne(id);

    if (dto.notes !== undefined) bookmark.notes = dto.notes;
    if (dto.isFavorite !== undefined) bookmark.isFavorite = dto.isFavorite;

    // Handle tags update
    if (dto.tagNames !== undefined) {
      const tags = await this.ensureTagsExist(bookmark.userId, dto.tagNames);
      bookmark.tags = tags;
    }

    await this.bookmarkRepository.save(bookmark);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const bookmark = await this.findOne(id);
    await this.bookmarkRepository.remove(bookmark);
  }

  async toggleFavorite(id: string): Promise<Bookmark> {
    const bookmark = await this.findOne(id);
    bookmark.isFavorite = !bookmark.isFavorite;
    await this.bookmarkRepository.save(bookmark);
    return this.findOne(id);
  }

  async search(userId: string, query: string): Promise<Bookmark[]> {
    // This would need integration with puzzle service for full-text search
    // For now, search in notes and tags
    const bookmarks = await this.bookmarkRepository
      .createQueryBuilder('bookmark')
      .leftJoinAndSelect('bookmark.tags', 'tag')
      .where('bookmark.userId = :userId', { userId })
      .andWhere('(bookmark.notes ILIKE :query OR tag.name ILIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy('bookmark.createdAt', 'DESC')
      .getMany();

    return bookmarks;
  }

  private async ensureTagsExist(
    userId: string,
    tagNames: string[],
  ): Promise<Tag[]> {
    const existingTags = await this.tagRepository.find({
      where: { userId, name: In(tagNames) },
    });

    const existingTagNames = existingTags.map((tag) => tag.name);
    const newTagNames = tagNames.filter(
      (name) => !existingTagNames.includes(name),
    );

    const newTags = newTagNames.map((name) =>
      this.tagRepository.create({ userId, name }),
    );

    const savedNewTags = await this.tagRepository.save(newTags);

    return [...existingTags, ...savedNewTags];
  }
}
