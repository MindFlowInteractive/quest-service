import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { MentorProfile } from './entities/mentor-profile.entity';
import { StudentProfile } from './entities/student-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MentorProfile, StudentProfile])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
