import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';


const mockRepo = () => ({ query: jest.fn() });


describe('AnalyticsService', () => {
    let service: AnalyticsService;
    let repo: any;


    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                { provide: getRepositoryToken(AnalyticsEvent), useFactory: mockRepo },
            ],
        }).compile();


        service = module.get<AnalyticsService>(AnalyticsService);
        repo = module.get(getRepositoryToken(AnalyticsEvent));
    });


    it('should return players overview', async () => {
        const mockQb = {
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ count: '10' }),
        };
        repo.createQueryBuilder = jest.fn().mockReturnValue(mockQb);

        const res = await service.getPlayersOverview({ from: '2025-09-20', to: '2025-09-26' });
        expect(res).toHaveProperty('totalPlayers');
        expect(res.totalPlayers).toBe(10);
        expect(repo.createQueryBuilder).toHaveBeenCalled();
    });
});