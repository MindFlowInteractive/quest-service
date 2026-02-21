import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PerformanceService } from './performance.service';

interface AlertThresholds {
  maxResponseTime: number; // milliseconds
  maxMemoryUsage: number;  // percentage
  maxCpuUsage: number;     // percentage
  maxSlowQueriesPerMinute: number;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private thresholds: AlertThresholds;
  private slowQueryCountSnapshot: number = 0;
  private alertsEnabled: boolean = true;

  constructor(
    private performanceService: PerformanceService,
  ) {
    // Set default thresholds
    this.thresholds = {
      maxResponseTime: 1000,        // 1 second
      maxMemoryUsage: 80,           // 80%
      maxCpuUsage: 85,              // 85%
      maxSlowQueriesPerMinute: 5,   // 5 slow queries per minute
    };
  }

  /**
   * Enable/disable alerts
   */
  setAlertsEnabled(enabled: boolean): void {
    this.alertsEnabled = enabled;
    this.logger.log(`Alerts ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set custom alert thresholds
   */
  setThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.logger.log('Updated alert thresholds:', this.thresholds);
  }

  /**
   * Check for performance degradations and send alerts
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkPerformanceDegradation(): Promise<void> {
    if (!this.alertsEnabled) {
      return;
    }

    try {
      await this.checkMemoryLeaks();
      await this.checkSlowDatabaseQueries();
    } catch (error) {
      this.logger.error('Error checking performance degradation:', error);
    }
  }

  /**
   * Check for memory leaks
   */
  private async checkMemoryLeaks(): Promise<void> {
    const memoryLeakDetected = this.performanceService.detectMemoryLeak();
    
    if (memoryLeakDetected) {
      const memoryUsage = process.memoryUsage();
      const heapUsagePercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      const alertMessage = `MEMORY LEAK DETECTED: Heap usage at ${(heapUsagePercentage).toFixed(2)}%`;
      this.sendAlert('memory_leak', alertMessage, 'HIGH');
    }
  }

  /**
   * Check for slow database queries
   */
  private async checkSlowDatabaseQueries(): Promise<void> {
    // Note: This is a simplified implementation
    // In a real scenario, we would need to track queries over time
    this.logger.debug('Checking for slow database queries...');
  }

  /**
   * Send alert via multiple channels
   */
  private sendAlert(type: string, message: string, severity: 'LOW' | 'MEDIUM' | 'HIGH'): void {
    this.logger.warn(`[${severity}] ALERT: ${type.toUpperCase()} - ${message}`);

    // In a real implementation, you would send alerts to:
    // - Email service
    // - Slack/Teams webhook
    // - PagerDuty
    // - Logging system
    this.sendLogAlert(type, message, severity);
  }

  /**
   * Send log alert for external monitoring systems
   */
  private sendLogAlert(type: string, message: string, severity: 'LOW' | 'MEDIUM' | 'HIGH'): void {
    // Log in a format that can be picked up by external monitoring systems
    const alertLog = {
      timestamp: new Date().toISOString(),
      type: 'PERFORMANCE_ALERT',
      subtype: type,
      severity,
      message,
      service: 'quest-service',
    };
    
    this.logger.error(JSON.stringify(alertLog));
  }

  /**
   * Manual trigger for immediate performance check
   */
  async manualCheck(): Promise<void> {
    this.logger.log('Manual performance check triggered');
    await this.checkPerformanceDegradation();
  }
}
