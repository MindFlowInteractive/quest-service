import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeController } from './challenge/challenge.controller';
import { ChallengeService } from './challenge/challenge.service';
import { Challenge } from './challenge/challenge.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Challenge],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Challenge]),
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService],
})
export class AppModule {}