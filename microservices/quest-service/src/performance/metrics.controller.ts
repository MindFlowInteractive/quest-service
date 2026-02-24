import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PerformanceService } from './performance.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  async getMetrics(@Res() res: Response) {
    try {
      const metrics = await this.performanceService.getMetrics();
      res.header('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Failed to retrieve metrics');
    }
  }

  @Get('dashboard')
  async getPerformanceDashboard(@Res() res: Response) {
    try {
      const summary = await this.performanceService.getPerformanceSummary();
      
      res.header('Content-Type', 'application/json');
      res.send(summary);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: 'Failed to retrieve performance dashboard' });
    }
  }

  @Get('health')
  async getHealthStatus(@Res() res: Response) {
    try {
      const memoryLeakDetected = this.performanceService.detectMemoryLeak();
      const slowQueryCount = this.performanceService.getSlowQueryCount();
      
      const status = {
        status: memoryLeakDetected ? 'degraded' : 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          memory_leak: !memoryLeakDetected,
          slow_queries_count: slowQueryCount,
          timestamp: new Date().toISOString(),
        },
      };
      
      res.header('Content-Type', 'application/json');
      res.status(memoryLeakDetected ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK);
      res.send(status);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: 'Failed to retrieve health status' });
    }
  }
}