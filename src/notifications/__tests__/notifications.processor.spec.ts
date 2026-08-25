import { NotificationsProcessor } from '../processors/notifications.processor';

describe('NotificationsProcessor', () => {
  it('can be instantiated', () => {
    const processor = new NotificationsProcessor(
      {} as any,
      {} as any,
      {} as any,
    );

    expect(processor).toBeDefined();
  });
});
