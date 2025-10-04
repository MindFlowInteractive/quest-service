import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any;

  constructor(private readonly config: any) {
    // Basic SMTP transporter using env vars
    const host = this.config.get('EMAIL_HOST') || 'localhost';
    const port = Number(this.config.get('EMAIL_PORT') || 1025);
    const user = this.config.get('EMAIL_USER') || '';
    const pass = this.config.get('EMAIL_PASS') || '';

    this.transporter = nodemailer.createTransport({ host, port, auth: user ? { user, pass } : undefined });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    const from = this.config.get('EMAIL_FROM') || 'no-reply@example.com';
    const info = await this.transporter.sendMail({ from, to, subject, text, html });
    this.logger.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  }
}
