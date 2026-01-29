import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TagService {
  constructor(@InjectRepository(Tag) private tagRepo: Repository<Tag>) { }

  async findOrCreateByNames(names: string[]) {
    if (!names || names.length === 0) return [];
    names = names.map((n) => n.trim().toLowerCase());
    const existing = await this.tagRepo.find({ where: names.map((name) => ({ name })) });
    const existingNames = new Set(existing.map((t) => t.name));
    const toCreate = names.filter((n) => !existingNames.has(n));
    const created = this.tagRepo.create(toCreate.map((name) => ({ name })));
    await this.tagRepo.save(created);
    return [...existing, ...created];
  }

  async list(limit = 50) {
    return this.tagRepo.find({ take: limit });
  }
}
