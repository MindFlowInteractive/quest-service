import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  async create(
    userId: string,
    name: string,
    description?: string,
    color?: string,
  ): Promise<Tag> {
    const tag = this.tagRepository.create({
      userId,
      name,
      description,
      color,
    });

    return this.tagRepository.save(tag);
  }

  async findAll(userId: string): Promise<Tag[]> {
    return this.tagRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async findByName(userId: string, name: string): Promise<Tag | null> {
    return this.tagRepository.findOne({
      where: { userId, name },
    });
  }

  async update(id: string, updates: Partial<Tag>): Promise<Tag> {
    const tag = await this.findOne(id);
    Object.assign(tag, updates);
    return this.tagRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagRepository.remove(tag);
  }

  async getTagUsage(userId: string): Promise<{ tag: Tag; count: number }[]> {
    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .leftJoin('bookmark_tags', 'bt', 'bt."tagId" = tag.id')
      .leftJoin(
        'bookmarks',
        'b',
        'b.id = bt."bookmarkId" AND b."userId" = :userId',
        { userId },
      )
      .where('tag.userId = :userId', { userId })
      .select('tag.*')
      .addSelect('COUNT(b.id)', 'count')
      .groupBy('tag.id')
      .orderBy('count', 'DESC')
      .getRawAndEntities();

    return tags.entities.map((tag, index) => ({
      tag,
      count: parseInt(tags.raw[index].count) || 0,
    }));
  }
}
