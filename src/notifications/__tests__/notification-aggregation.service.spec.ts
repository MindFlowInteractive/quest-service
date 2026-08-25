import { NotificationAggregationService } from '../services/notification-aggregation.service';

describe('NotificationAggregationService', () => {
  it('can be instantiated', () => {
    const service = new NotificationAggregationService();

    expect(service).toBeDefined();
  });
});
