import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }

    this.logger.log(
      `Database connection established (${this.dataSource.options.type})`,
    );
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();

      this.logger.log('Database connection closed.');
    }
  }

  async health() {
    return {
      connected: this.dataSource.isInitialized,
      database: this.dataSource.options.database,
      type: this.dataSource.options.type,
    };
  }

  async execute<T>(
    callback: (dataSource: DataSource) => Promise<T>,
  ): Promise<T> {
    return callback(this.dataSource);
  }

  get connection(): DataSource {
    return this.dataSource;
  }
}