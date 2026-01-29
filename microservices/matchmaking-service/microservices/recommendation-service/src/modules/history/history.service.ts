import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from './entities/history.entity';

@Injectable()
export class HistoryService {
    constructor(
        @InjectRepository(History)
        private historyRepository: Repository<History>,
    ) { }

    async getPlayerHistory(playerId: string): Promise<History[]> {
        return this.historyRepository.find({
            where: { playerId },
            order: { timestamp: 'DESC' },
        });
    }

    async addHistoryEntry(data: Partial<History>): Promise<History> {
        const entry = this.historyRepository.create(data);
        return this.historyRepository.save(entry);
    }
}
