import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { UserRole } from '../auth/constants';
import { CosmeticsService } from './cosmetics.service';
import { CosmeticType } from './cosmetics.types';
import {
  CreateCosmeticDto,
  EquipCosmeticDto,
  EvaluateUnlocksDto,
  GrantCosmeticDto,
  ListCosmeticsQueryDto,
  UpdateCosmeticDto,
} from './dto/cosmetics.dto';

type AuthUser = { userId?: string; id?: string };

const userIdOf = (user: AuthUser): string => user?.userId ?? user?.id ?? '';

@Controller('cosmetics')
export class CosmeticsController {
  constructor(private readonly cosmeticsService: CosmeticsService) {}

  // ─── Public ───────────────────────────────────────────────────────────────

  /** GET /cosmetics?type=title — the active catalog, optionally by type. */
  @Get()
  listCatalog(@Query() query: ListCosmeticsQueryDto) {
    return this.cosmeticsService.listCatalog(query.type);
  }

  /** GET /cosmetics/profile/:userId — equipped title and items for a profile. */
  @Get('profile/:userId')
  getProfileDisplay(@Param('userId') userId: string) {
    return this.cosmeticsService.getProfileDisplay(userId);
  }

  // ─── Player endpoints (authenticated) ─────────────────────────────────────

  /** GET /cosmetics/me — items the player owns, with equipped flags. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  listOwned(@ActiveUser() user: AuthUser) {
    return this.cosmeticsService.listOwned(userIdOf(user));
  }

  /** POST /cosmetics/me/equip — equip an owned title or item. */
  @Post('me/equip')
  @UseGuards(JwtAuthGuard)
  equip(@ActiveUser() user: AuthUser, @Body() dto: EquipCosmeticDto) {
    return this.cosmeticsService.equip(userIdOf(user), dto.cosmeticId);
  }

  /** DELETE /cosmetics/me/equip/:slot — clear a slot, e.g. "title". */
  @Delete('me/equip/:slot')
  @UseGuards(JwtAuthGuard)
  unequip(
    @ActiveUser() user: AuthUser,
    @Param('slot', new ParseEnumPipe(CosmeticType)) slot: CosmeticType,
  ) {
    return this.cosmeticsService.unequip(userIdOf(user), slot);
  }

  // ─── Admin / service endpoints ────────────────────────────────────────────

  /** POST /cosmetics — add a title or item to the catalog. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createCosmetic(@Body() dto: CreateCosmeticDto) {
    return this.cosmeticsService.createCosmetic(dto);
  }

  /** POST /cosmetics/evaluate — unlock items for a player's new milestones. */
  @Post('evaluate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  evaluateUnlocks(@Body() dto: EvaluateUnlocksDto) {
    return this.cosmeticsService.evaluateUnlocks(dto.userId, dto.stats);
  }

  /** PATCH /cosmetics/:cosmeticId — edit a catalog entry. */
  @Patch(':cosmeticId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateCosmetic(
    @Param('cosmeticId', ParseUUIDPipe) cosmeticId: string,
    @Body() dto: UpdateCosmeticDto,
  ) {
    return this.cosmeticsService.updateCosmetic(cosmeticId, dto);
  }

  /** POST /cosmetics/:cosmeticId/grant — give an item to a player. */
  @Post(':cosmeticId/grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  grantCosmetic(
    @Param('cosmeticId', ParseUUIDPipe) cosmeticId: string,
    @Body() dto: GrantCosmeticDto,
  ) {
    return this.cosmeticsService.grantCosmetic(
      dto.userId,
      cosmeticId,
      dto.source,
    );
  }
}
