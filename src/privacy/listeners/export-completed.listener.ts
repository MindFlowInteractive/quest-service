import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../notifications/email.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ExportCompletedListener {
  private readonly logger = new Logger(ExportCompletedListener.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Fires when data-export processing finishes.
   * Sends the user an email with the download link.
   */
  @OnEvent('privacy.data_export_completed')
  async handle(payload: {
    userId: string;
    exportId: string;
    downloadUrl: string;
    expiresAt: Date;
  }): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });

      if (!user?.email) {
        this.logger.warn(
          `Cannot send export email — user ${payload.userId} not found`,
        );
        return;
      }

      const appUrl =
        this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
      const downloadLink = `${appUrl}${payload.downloadUrl}`;
      const expiresFormatted = payload.expiresAt.toUTCString();

      await this.emailService.sendEmail(
        user.email,
        'Your data export is ready',
        `Your personal data export is ready for download.\n\nDownload link: ${downloadLink}\n\nThis link expires on ${expiresFormatted}.\n\nIf you did not request this export, please contact support.`,
        `<p>Your personal data export is ready.</p>
<p><a href="${downloadLink}">Download your data</a></p>
<p>This link expires on <strong>${expiresFormatted}</strong>.</p>
<p>If you did not request this export, please contact support immediately.</p>`,
      );

      this.logger.log(
        `Export-ready email sent to ${user.email} for export ${payload.exportId}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send export-ready email for ${payload.exportId}:`,
        err,
      );
    }
  }
}
