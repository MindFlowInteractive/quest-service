import { Request, Response } from 'express';
import { DatabaseService } from 'src/config/database-service';
import { PerformanceMonitoringService } from 'src/monitoring/performance.service';

export class HealthController {
  private databaseService = DatabaseService.getInstance();
  private performanceService: PerformanceMonitoringService;

  constructor() {
    this.performanceService = new PerformanceMonitoringService(
      this.databaseService.getDataSource(),
    );
  }

  public async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.databaseService.checkHealth();
      const status = health.status === 'healthy' ? 200 : 503;

      res.status(status).json({
        status: health.status,
        timestamp: health.timestamp,
        database: {
          connection: health.connection,
          latency: `${health.latency}ms`,
          activeConnections: health.activeConnections,
        },
        error: health.error,
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  public async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.performanceService.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to fetch metrics',
      });
    }
  }

  public async getConnectionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.databaseService.getConnectionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch connection stats',
      });
    }
  }
}
