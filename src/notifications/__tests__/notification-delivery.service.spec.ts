import { NotificationDeliveryService } from '../services/notification-delivery.service';

describe('NotificationDeliveryService', () => {
  it('can be instantiated', () => {
    const service = new NotificationDeliveryService(
      {} as any,
      {} as any,
    );

    expect(service).toBeDefined();
  });
});
