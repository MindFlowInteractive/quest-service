import { Module } from '@nestjs/common';
import { RegistryController } from './controllers/registry.controller';
import { HealthController } from './controllers/health.controller';
import { LookupController } from './controllers/lookup.controller';
import { RegistryService } from './services/registry.service';
import { HealthService } from './services/health.service';

@Module({
  imports: [],
  controllers: [RegistryController, HealthController, LookupController],
  providers: [RegistryService, HealthService],
})
export class AppModule {}
