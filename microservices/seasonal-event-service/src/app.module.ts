import { Module } from '@nestjs/common';
import { SeasonalEventModule } from './seasonal-event/seasonal-event.module';

@Module({ imports: [SeasonalEventModule] })
export class AppModule {}
