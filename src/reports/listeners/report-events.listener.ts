import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportEventsListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('report.resolved')
  async handleReportResolved(payload: { report: any; resolution: string }) {
    const { report, resolution } = payload;

    // Send notification to the original reporter
    await this.notificationsService.createNotification({
      userId: report.reporterId,
      type: 'report_resolved',
      title: 'Your Report Has Been Resolved',
      message: `The report you submitted regarding ${report.targetType} has been reviewed and resolved.`,
      data: {
        reportId: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        resolution,
      },
    });
  }

  @OnEvent('report.escalated')
  async handleReportEscalated(payload: { targetType: string; targetId: string; reportCount: number }) {
    const { targetType, targetId, reportCount } = payload;

    // Send notification to moderators about escalated content
    // This would typically be sent to all moderators/admins
    console.log(`ESCALATION: ${reportCount} reports received for ${targetType}:${targetId} - Priority escalated to CRITICAL`);
    
    // In a real implementation, you might send a webhook, email, or in-app notification
    // to all moderators about the escalation
  }
}
