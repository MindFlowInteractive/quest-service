import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { BadgeService } from './services/badge.service';
import { BannerThemeService, BannerThemeConfig } from './services/banner-theme.service';
import { PlayerProfileService } from './services/player-profile.service';
import { BadgeDto, BadgeCategory } from './dto/badge-management.dto';

@ApiTags('Profile Customization')
@Controller('profile/customization')
export class CustomizationController {
  constructor(
    private readonly badgeService: BadgeService,
    private readonly bannerThemeService: BannerThemeService,
    private readonly profileService: PlayerProfileService,
  ) {}

  @Get('badges')
  @ApiOperation({ summary: 'Get all available badges' })
  async getAllBadges(): Promise<BadgeDto[]> {
    return this.badgeService.getAllBadges();
  }

  @Get('badges/category/:category')
  @ApiOperation({ summary: 'Get badges by category' })
  async getBadgesByCategory(@Param('category') category: BadgeCategory): Promise<BadgeDto[]> {
    return this.badgeService.getBadgesByCategory(category);
  }

  @Get('badges/rarity/:rarity')
  @ApiOperation({ summary: 'Get badges by rarity' })
  async getBadgesByRarity(@Param('rarity') rarity: string): Promise<BadgeDto[]> {
    return this.badgeService.getBadgesByRarity(rarity);
  }

  @Get('themes')
  @ApiOperation({ summary: 'Get all banner themes' })
  async getAllThemes(): Promise<BannerThemeConfig[]> {
    return this.bannerThemeService.getAllThemes();
  }

  @Get('themes/available')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get themes available to current user' })
  async getAvailableThemes(@Req() req: RequestWithUser): Promise<BannerThemeConfig[]> {
    const userStats = await this.profileService.getProfileStatistics(req.user.id);
    return this.bannerThemeService.getUserUnlockedThemes(userStats);
  }

  @Get('themes/unlockable')
  @ApiOperation({ summary: 'Get unlockable themes and requirements' })
  async getUnlockableThemes(): Promise<BannerThemeConfig[]> {
    return this.bannerThemeService.getUnlockableThemes();
  }

  @Get('themes/:themeId')
  @ApiOperation({ summary: 'Get specific theme details' })
  async getTheme(@Param('themeId') themeId: string): Promise<BannerThemeConfig> {
    const theme = this.bannerThemeService.getThemeById(themeId);
    if (!theme) {
      throw new Error('Theme not found');
    }
    return theme;
  }

  @Get('themes/:themeId/unlocked')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if theme is unlocked for current user' })
  async isThemeUnlocked(
    @Param('themeId') themeId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ unlocked: boolean; requirement?: string }> {
    const userStats = await this.profileService.getProfileStatistics(req.user.id);
    const unlocked = this.bannerThemeService.isThemeUnlocked(themeId, userStats);
    const theme = this.bannerThemeService.getThemeById(themeId);
    
    return {
      unlocked,
      requirement: theme?.unlockRequirement
    };
  }
}