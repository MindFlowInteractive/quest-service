import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BattlePassService } from './battle-pass.service';
import {
  CreateBattlePassDto,
  CreateTierDto,
  EarnXpDto,
  ClaimRewardDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants';
import { ActiveUser } from '../auth/decorators/active-user.decorator';

@ApiTags('Battle Pass')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('battle-pass')
export class BattlePassController {
  constructor(private readonly service: BattlePassService) {}

  // ─── Season Management ─────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new battle pass season (admin only)' })
  async create(@Body() dto: CreateBattlePassDto) {
    return this.service.create(dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active battle pass seasons' })
  async getActive() {
    return this.service.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a battle pass by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get('season/:season')
  @ApiOperation({ summary: 'Get a battle pass by season identifier' })
  async findBySeason(@Param('season') season: string) {
    return this.service.findBySeason(season);
  }

  // ─── Tiers ─────────────────────────────────────────────────────────────────

  @Post(':id/tiers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a tier to a battle pass (admin only)' })
  async addTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTierDto,
  ) {
    return this.service.addTier(id, dto);
  }

  @Get(':id/tiers')
  @ApiOperation({ summary: 'Get all tiers for a battle pass' })
  async getTiers(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getTiers(id);
  }

  // ─── Player Progression ────────────────────────────────────────────────────

  @Get(':id/progress')
  @ApiOperation({ summary: "Get the authenticated user's battle pass progress" })
  async getProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: any,
  ) {
    return this.service.getOrCreatePlayerProgress(user.id ?? user.sub, id);
  }

  @Post(':id/xp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Award XP and advance tiers' })
  @ApiResponse({ status: 200, description: 'XP awarded and tier progression result returned' })
  async earnXp(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: any,
    @Body() dto: EarnXpDto,
  ) {
    return this.service.earnXp(user.id ?? user.sub, id, dto);
  }

  // ─── Premium Track ─────────────────────────────────────────────────────────

  @Post(':id/purchase-premium')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purchase the premium track with retroactive rewards' })
  @ApiResponse({ status: 200, description: 'Premium purchased; retroactive rewards granted' })
  async purchasePremium(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: any,
  ) {
    return this.service.purchasePremium(user.id ?? user.sub, id);
  }

  // ─── Reward Claiming ───────────────────────────────────────────────────────

  @Post(':id/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Claim a tier reward on the free or premium track' })
  @ApiResponse({ status: 200, description: 'Reward claimed' })
  async claimReward(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: any,
    @Body() dto: ClaimRewardDto,
  ) {
    return this.service.claimReward(user.id ?? user.sub, id, dto);
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  @Get(':id/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get battle pass engagement analytics (admin only)' })
  async getAnalytics(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAnalytics(id);
  }
}
