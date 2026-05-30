import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncState } from './sync.entity';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncState)
    private readonly syncRepo: Repository<SyncState>,
  ) {}

  async upsert(userId: string, deviceId: string, data: Record<string, unknown>): Promise<SyncState> {
    let state = await this.syncRepo.findOneBy({ userId, deviceId });
    if (!state) {
      state = this.syncRepo.create({ userId, deviceId, data });
    } else {
      // Last-write-wins conflict resolution
      state.data = { ...state.data, ...data };
    }
    return this.syncRepo.save(state);
  }

  getState(userId: string, deviceId: string): Promise<SyncState | null> {
    return this.syncRepo.findOneBy({ userId, deviceId });
  }

  getDevices(userId: string): Promise<SyncState[]> {
    return this.syncRepo.findBy({ userId });
  }
}