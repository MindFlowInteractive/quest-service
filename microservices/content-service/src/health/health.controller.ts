import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../entities/content.entity.js';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: Date;
  service: string;
  version: string;
  checks: {
    database: boolean;
    [key: string]: boolean;
  };
}

@Controller()
export class HealthController {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  @Get()
  root() {
    return {
      service: 'content-service',
      version: '0.0.1',
      description: 'Content management microservice for user-generated content, moderation, and featured content',
      endpoints: {
        health: 'GET /health',
        content: 'GET|POST /content',
        submissions: 'GET|POST /submissions',
        moderation: 'GET /moderation/queue',
        featured: 'GET /featured',
      },
    };
  }

  @Get('health')
  async check(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
    };

    const allHealthy = Object.values(checks).every((check) => check);

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date(),
      service: 'content-service',
      version: process.env.npm_package_version || '0.0.1',
      checks,
    };
  }

  @Get('health/live')
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('health/ready')
  async readiness(): Promise<{ status: string; ready: boolean }> {
    const dbReady = await this.checkDatabase();
    return {
      status: dbReady ? 'ok' : 'not_ready',
      ready: dbReady,
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.contentRepository.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
