import { Injectable } from '@nestjs/common';
import { HistoryService } from '../history/history.service';
import * as ss from 'simple-statistics';

@Injectable()
export class BehaviorService {
    constructor(private readonly historyService: HistoryService) { }

    async analyzeSkillLevel(playerId: string): Promise<number> {
        const history = await this.historyService.getPlayerHistory(playerId);
        const completions = history.filter(h => h.action === 'complete');

        if (completions.length === 0) return 0.1; // Baseline

        // Calculate completion rate or time performance
        const times = completions.map(c => c.timeSpent).filter(t => t !== null) as number[];
        if (times.length === 0) return 0.5;

        // Relative skill based on time spent (hypothetically)
        // In a real app, you'd compare this to puzzle difficulty/average time
        const meanTime = ss.mean(times);

        // Return a normalized skill level [0, 1]
        // Lower time = higher skill (simplified)
        return Math.min(1, 100 / meanTime);
    }

    async getRecentInterests(playerId: string): Promise<string[]> {
        const history = await this.historyService.getPlayerHistory(playerId);
        const recent = history.slice(0, 20);
        // Extract categories from metadata if present
        const categories = recent
            .map(h => h.metadata?.category)
            .filter(Boolean);

        return [...new Set(categories)];
    }
}
