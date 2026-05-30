import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './asset.entity';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private readonly repo: Repository<Asset>,
  ) {}

  findByOwner(ownerId: string): Promise<Asset[]> {
    return this.repo.find({ where: { ownerId, status: 'active' } });
  }

  findById(id: string): Promise<Asset | null> {
    return this.repo.findOne({ where: { id } });
  }

  register(ownerId: string, filename: string, mimeType: string, sizeBytes: number): Promise<Asset> {
    const asset = this.repo.create({ ownerId, filename, mimeType, sizeBytes });
    return this.repo.save(asset);
  }

  async delete(id: string): Promise<void> {
    await this.repo.update(id, { status: 'deleted' });
  }
}