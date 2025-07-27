import { Injectable, Logger } from "@nestjs/common"
import type { ConfigType } from "@nestjs/config"
import * as nodemailer from "nodemailer"
import type { loggingConfig } from "../config/logging.config"

export type AlertSeverity = "low" | "medium" | "high" | "critical"

export interface Alert {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  timestamp: Date
  resolved: boolean
  metadata?: Record<string, any>
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name)
  private readonly emailTransporter?: nodemailer.Transporter
  private readonly activeAlerts: Map<string, Alert> = new Map()
  private readonly config: ConfigType<typeof loggingConfig>

  constructor(config: ConfigType<typeof loggingConfig>) {
    this.config = config
    if (this.config.alerting.channels.email.enabled) {
      this.emailTransporter = nodemailer.createTransport(this.config.alerting.channels.email.smtp)
    }
  }

  async sendAlert(
    title: string,
    message: string,
    severity: AlertSeverity,
    metadata?: Record<string, any>,
  ): Promise<void> {
    if (!this.config.alerting.enabled) return

    const alert: Alert = {
      id: this.generateAlertId(),
      title,
      message,
      severity,
      timestamp: new Date(),
      resolved: false,
      metadata,
    }

    this.activeAlerts.set(alert.id, alert)

    this.logger.warn(`Alert triggered: ${title}`, {
      alertId: alert.id,
      severity,
      message,
      metadata,
    })

    // Send to configured channels
    await Promise.allSettled([this.sendEmailAlert(alert), this.sendSlackAlert(alert), this.sendWebhookAlert(alert)])
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.resolved = true
      this.logger.log(`Alert resolved: ${alert.title}`, { alertId })
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter((alert) => !alert.resolved)
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    if (!this.config.alerting.channels.email.enabled || !this.emailTransporter) return

    try {
      const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`
      const html = this.generateEmailTemplate(alert)

      await this.emailTransporter.sendMail({
        from: this.config.alerting.channels.email.from,
        to: this.config.alerting.channels.email.to,
        subject,
        html,
      })

      this.logger.debug(`Email alert sent: ${alert.id}`)
    } catch (error) {
      this.logger.error(`Failed to send email alert: ${alert.id}`, error)
    }
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    if (!this.config.alerting.channels.slack.enabled) return

    try {
      const payload = {
        channel: this.config.alerting.channels.slack.channel,
        username: "AlertBot",
        icon_emoji: this.getSeverityEmoji(alert.severity),
        attachments: [
          {
            color: this.getSeverityColor(alert.severity),
            title: alert.title,
            text: alert.message,
            fields: [
              {
                title: "Severity",
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: "Timestamp",
                value: alert.timestamp.toISOString(),
                short: true,
              },
            ],
            footer: "Application Monitoring",
            ts: Math.floor(alert.timestamp.getTime() / 1000),
          },
        ],
      }

      const response = await fetch(this.config.alerting.channels.slack.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`)
      }

      this.logger.debug(`Slack alert sent: ${alert.id}`)
    } catch (error) {
      this.logger.error(`Failed to send Slack alert: ${alert.id}`, error)
    }
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    if (!this.config.alerting.channels.webhook.enabled) return

    try {
      const response = await fetch(this.config.alerting.channels.webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config.alerting.channels.webhook.headers,
        },
        body: JSON.stringify(alert),
      })

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`)
      }

      this.logger.debug(`Webhook alert sent: ${alert.id}`)
    } catch (error) {
      this.logger.error(`Failed to send webhook alert: ${alert.id}`, error)
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEmailTemplate(alert: Alert): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">${alert.title}</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Severity: ${alert.severity.toUpperCase()}</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px;">
              <h2 style="margin-top: 0;">Alert Details</h2>
              <p><strong>Message:</strong> ${alert.message}</p>
              <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
              <p><strong>Alert ID:</strong> ${alert.id}</p>
              ${alert.metadata ? `<p><strong>Metadata:</strong> <pre>${JSON.stringify(alert.metadata, null, 2)}</pre></p>` : ""}
            </div>
          </div>
        </body>
      </html>
    `
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case "low":
        return "#36a2eb"
      case "medium":
        return "#ffce56"
      case "high":
        return "#ff6384"
      case "critical":
        return "#ff0000"
      default:
        return "#36a2eb"
    }
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case "low":
        return ":information_source:"
      case "medium":
        return ":warning:"
      case "high":
        return ":exclamation:"
      case "critical":
        return ":rotating_light:"
      default:
        return ":information_source:"
    }
  }
}
