import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BoardTheme } from './entities/board-theme.entity';
import { PlayerBoardThemeSelection } from './entities/player-board-theme-selection.entity';
import { PlayerBoardThemeUnlock } from './entities/player-board-theme-unlock.entity';
import { BoardThemesController } from './board-themes.controller';
import { BoardThemesService } from './board-themes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoardTheme,
      PlayerBoardThemeUnlock,
      PlayerBoardThemeSelection,
    ]),
    AuthModule,
  ],
  controllers: [BoardThemesController],
  providers: [BoardThemesService],
  exports: [BoardThemesService],
})
export class BoardThemesModule {}
