import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppealsController } from './appeals.controller';
import { AppealsService } from './appeals.service';
import { Appeal } from '../entities/appeal.entity';
import { ActionsModule } from '../actions/actions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appeal]),
        ActionsModule,
    ],
    controllers: [AppealsController],
    providers: [AppealsService],
    exports: [AppealsService],
})
export class AppealsModule { }
