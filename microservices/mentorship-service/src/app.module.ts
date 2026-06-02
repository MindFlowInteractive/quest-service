import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';

import { Mentorship } from './mentorships/entities/mentorship.entity';
import { MentorshipSession } from './sessions/entities/session.entity';
import { MentorshipMilestone } from './milestones/entities/milestone.entity';
import { MilestoneProgress } from './milestones/entities/progress.entity';
import { MentorProfile } from './profiles/entities/mentor-profile.entity';
import { StudentProfile } from './profiles/entities/student-profile.entity';
import { MentorRating } from './ratings/entities/rating.entity';
import { MentorReward } from './rewards/entities/reward.entity';
import { MentorshipCertificate } from './certificates/entities/certificate.entity';
import { MentorshipsModule } from './mentorships/mentorships.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'mentorship_service'),
        entities: [
          Mentorship,
          MentorshipSession,
          MentorshipMilestone,
          MilestoneProgress,
          MentorProfile,
          StudentProfile,
          MentorRating,
          MentorReward,
          MentorshipCertificate,
        ],
        synchronize: true, // Only for development
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    TerminusModule,
    MentorshipsModule,
  ],
})
export class AppModule {}
