import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';


const mockRepo = () => ({ query: jest.fn() });


describe('AnalyticsService', () => {
let service: AnalyticsService;
let repo;


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


it('should return players overview series', async () => {
repo.query.mockResolvedValue([{ day: '2025-09-25', dau: '10' }]);
const res = await service.getPlayersOverview({ from: '2025-09-20', to: '2025-09-26' });
expect(res).toHaveProperty('series');
expect(repo.query).toHaveBeenCalled();
});
});