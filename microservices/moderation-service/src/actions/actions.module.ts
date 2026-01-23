import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { Violation } from '../entities/violation.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Violation])],
    controllers: [ActionsController],
    providers: [ActionsService],
    exports: [ActionsService],
})
export class ActionsModule { }
