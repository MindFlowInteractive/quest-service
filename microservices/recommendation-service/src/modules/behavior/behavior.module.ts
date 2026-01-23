import { Module } from '@nestjs/common';
import { BehaviorService } from './behavior.service';
import { HistoryModule } from '../history/history.module';

@Module({
    imports: [HistoryModule],
    providers: [BehaviorService],
    exports: [BehaviorService],
})
export class BehaviorModule { }
