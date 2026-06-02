import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentorshipsService } from './mentorships.service';
import { MentorshipsController } from './mentorships.controller';
import { Mentorship } from './entities/mentorship.entity';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mentorship]), ProfilesModule],
  controllers: [MentorshipsController],
  providers: [MentorshipsService],
  exports: [MentorshipsService],
})
export class MentorshipsModule {}
