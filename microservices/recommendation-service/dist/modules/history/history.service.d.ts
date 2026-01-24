import { Repository } from 'typeorm';
import { History } from './entities/history.entity';
export declare class HistoryService {
    private historyRepository;
    constructor(historyRepository: Repository<History>);
    getPlayerHistory(playerId: string): Promise<History[]>;
    addHistoryEntry(data: Partial<History>): Promise<History>;
}
