import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventModule } from './event.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { Tournament } from './tournament.entity';
import { Challenge } from './challenge.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [Event, Tournament, Challenge],
      synchronize: true,
    }),
    EventModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
