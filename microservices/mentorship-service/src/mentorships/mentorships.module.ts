import { Module } from '@nestjs/common';
import { MentorshipsService } from './mentorships.service';

@Module({
  providers: [MentorshipsService]
})
export class MentorshipsModule {}
