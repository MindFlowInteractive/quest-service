import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { UserRole } from '../auth/constants';
import { BoardThemesService } from './board-themes.service';
import {
  CreateBoardThemeDto,
  GrantBoardThemeDto,
  SelectBoardThemeDto,
  UpdateBoardThemeDto,
} from './dto/board-themes.dto';

type AuthUser = { userId?: string; id?: string };

const userIdOf = (user: AuthUser): string => user?.userId ?? user?.id ?? '';

@Controller('board-themes')
export class BoardThemesController {
  constructor(private readonly boardThemesService: BoardThemesService) {}

  // ─── Public catalog ───────────────────────────────────────────────────────

  /** GET /board-themes — all active themes with their metadata. */
  @Get()
  listThemes() {
    return this.boardThemesService.listThemes();
  }

  // ─── Player endpoints (authenticated) ─────────────────────────────────────

  /** GET /board-themes/me — catalog with owned / locked / selected flags. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  listMyThemes(@ActiveUser() user: AuthUser) {
    return this.boardThemesService.listThemesForPlayer(userIdOf(user));
  }

  /** GET /board-themes/me/selection — the player's current theme. */
  @Get('me/selection')
  @UseGuards(JwtAuthGuard)
  getMySelection(@ActiveUser() user: AuthUser) {
    return this.boardThemesService.getSelectedTheme(userIdOf(user));
  }

  /** PUT /board-themes/me/selection — choose a free or owned theme. */
  @Put('me/selection')
  @UseGuards(JwtAuthGuard)
  selectTheme(@ActiveUser() user: AuthUser, @Body() dto: SelectBoardThemeDto) {
    return this.boardThemesService.selectTheme(userIdOf(user), dto.themeId);
  }

  /** GET /board-themes/:themeId — a single active theme. */
  @Get(':themeId')
  getTheme(@Param('themeId', ParseUUIDPipe) themeId: string) {
    return this.boardThemesService.getTheme(themeId);
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────

  /** POST /board-themes — add a theme to the catalog. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createTheme(@Body() dto: CreateBoardThemeDto) {
    return this.boardThemesService.createTheme(dto);
  }

  /** PATCH /board-themes/:themeId — edit a theme; new assets bump its version. */
  @Patch(':themeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateTheme(
    @Param('themeId', ParseUUIDPipe) themeId: string,
    @Body() dto: UpdateBoardThemeDto,
  ) {
    return this.boardThemesService.updateTheme(themeId, dto);
  }

  /** POST /board-themes/:themeId/grant — give a locked theme to a player. */
  @Post(':themeId/grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  grantTheme(
    @Param('themeId', ParseUUIDPipe) themeId: string,
    @Body() dto: GrantBoardThemeDto,
  ) {
    return this.boardThemesService.grantTheme(dto.userId, themeId, dto.source);
  }
}
