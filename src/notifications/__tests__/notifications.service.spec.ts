import { NotificationsService } from '../services/notifications.service';

describe('NotificationsService', () => {
  it('can be instantiated', () => {
    const service = new NotificationsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    expect(service).toBeDefined();
  });
});
