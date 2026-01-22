import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '@/config/orm-config';
import { FriendsModule } from '@/friends/friends.module';
import { LeaderboardsModule } from '@/leaderboards/leaderboards.module';
import { RoomsModule } from '@/rooms/rooms.module';
import { GatewayModule } from '@/common/gateways/gateway.module';
import { BookmarksModule } from '@/bookmarks/bookmarks.module';
import { ListsModule } from '@/lists/lists.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    FriendsModule,
    LeaderboardsModule,
    RoomsModule,
    GatewayModule,
    BookmarksModule,
    ListsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
