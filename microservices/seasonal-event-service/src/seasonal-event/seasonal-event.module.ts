import { Module } from '@nestjs/common';
import { SeasonalEventController } from './seasonal-event.controller';
import { SeasonalEventService } from './seasonal-event.service';

@Module({ controllers: [SeasonalEventController], providers: [SeasonalEventService] })
export class SeasonalEventModule {}
