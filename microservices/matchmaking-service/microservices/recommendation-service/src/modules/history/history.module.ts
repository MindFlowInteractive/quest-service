import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { History } from './entities/history.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([History]),
    ],
    providers: [HistoryService],
    exports: [HistoryService],
})
export class HistoryModule { }
