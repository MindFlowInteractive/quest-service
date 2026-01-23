import { HistoryService } from '../history/history.service';
export declare class BehaviorService {
    private readonly historyService;
    constructor(historyService: HistoryService);
    analyzeSkillLevel(playerId: string): Promise<number>;
    getRecentInterests(playerId: string): Promise<string[]>;
}
