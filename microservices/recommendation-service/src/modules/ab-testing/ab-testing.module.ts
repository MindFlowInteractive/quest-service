import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ABTestingService } from './ab-testing.service';
import { ABTestAssignment } from './entities/ab-test-assignment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ABTestAssignment]),
    ],
    providers: [ABTestingService],
    exports: [ABTestingService],
})
export class ABTestingModule { }
