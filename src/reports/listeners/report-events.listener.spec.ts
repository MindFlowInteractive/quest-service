import { ReportEventsListener } from './report-events.listener';

describe('ReportEventsListener', () => {
  let listener: ReportEventsListener;
  let notificationsService: { createNotification: jest.Mock };

  beforeEach(() => {
    notificationsService = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };
    listener = new ReportEventsListener(notificationsService);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  it('should send notification to reporter when report is resolved', async () => {
    const payload = {
      report: {
        id: 'report-123',
        reporterId: 'reporter-456',
        targetType: 'player',
        targetId: 'cheater-789',
      },
      resolution: 'Player banned for 7 days for cheating',
    };

    await listener.handleReportResolved(payload);

    expect(notificationsService.createNotification).toHaveBeenCalledWith({
      userId: 'reporter-456',
      type: 'report_resolved',
      title: 'Your Report Has Been Resolved',
      message:
        'The report you submitted regarding player has been reviewed and resolved. Outcome: Player banned for 7 days for cheating',
      data: {
        reportId: 'report-123',
        targetType: 'player',
        targetId: 'cheater-789',
        resolution: 'Player banned for 7 days for cheating',
        outcome: 'Player banned for 7 days for cheating',
      },
    });
  });

  it('should log escalation when report is escalated', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await listener.handleReportEscalated({
      targetType: 'player',
      targetId: 'cheater-789',
      reportCount: 5,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ESCALATION: 5 reports received for player:cheater-789'),
    );
    consoleSpy.mockRestore();
  });
});
