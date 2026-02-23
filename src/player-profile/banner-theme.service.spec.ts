import { Test, TestingModule } from '@nestjs/testing';
import { BannerThemeService } from './services/banner-theme.service';
import { BannerTheme } from './dto/banner-theme.dto';

describe('BannerThemeService', () => {
  let service: BannerThemeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BannerThemeService],
    }).compile();

    service = module.get<BannerThemeService>(BannerThemeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllThemes', () => {
    it('should return all default themes', () => {
      const themes = service.getAllThemes();
      
      expect(themes.length).toBeGreaterThan(0);
      expect(themes.some(theme => theme.id === BannerTheme.COSMIC)).toBe(true);
      expect(themes.some(theme => theme.id === BannerTheme.FOREST)).toBe(true);
    });
  });

  describe('getAvailableThemes', () => {
    it('should return only non-unlockable themes', () => {
      const themes = service.getAvailableThemes();
      
      expect(themes.every(theme => !theme.isUnlockable)).toBe(true);
      expect(themes.some(theme => theme.id === BannerTheme.COSMIC)).toBe(true);
      expect(themes.some(theme => theme.id === BannerTheme.MINIMAL)).toBe(true);
    });
  });

  describe('getUnlockableThemes', () => {
    it('should return only unlockable themes', () => {
      const themes = service.getUnlockableThemes();
      
      expect(themes.every(theme => theme.isUnlockable)).toBe(true);
      expect(themes.some(theme => theme.id === BannerTheme.SUNSET)).toBe(true);
      expect(themes.some(theme => theme.id === BannerTheme.NEON)).toBe(true);
    });
  });

  describe('getThemeById', () => {
    it('should return theme by ID', () => {
      const theme = service.getThemeById(BannerTheme.COSMIC);
      
      expect(theme).toBeDefined();
      expect(theme!.id).toBe(BannerTheme.COSMIC);
      expect(theme!.name).toBe('Cosmic');
    });

    it('should return undefined for invalid ID', () => {
      const theme = service.getThemeById('non-existent');
      
      expect(theme).toBeUndefined();
    });
  });

  describe('isThemeUnlocked', () => {
    it('should return true for non-unlockable themes', () => {
      const userStats = {};
      const isUnlocked = service.isThemeUnlocked(BannerTheme.COSMIC, userStats);
      
      expect(isUnlocked).toBe(true);
    });

    it('should check unlock requirements for sunset theme', () => {
      const userStatsUnlocked = { totalPuzzlesSolved: 60 };
      const userStatsLocked = { totalPuzzlesSolved: 30 };
      
      expect(service.isThemeUnlocked(BannerTheme.SUNSET, userStatsUnlocked)).toBe(true);
      expect(service.isThemeUnlocked(BannerTheme.SUNSET, userStatsLocked)).toBe(false);
    });

    it('should check unlock requirements for neon theme', () => {
      const userStatsUnlocked = { tournamentsWon: 1 };
      const userStatsLocked = { tournamentsWon: 0 };
      
      expect(service.isThemeUnlocked(BannerTheme.NEON, userStatsUnlocked)).toBe(true);
      expect(service.isThemeUnlocked(BannerTheme.NEON, userStatsLocked)).toBe(false);
    });

    it('should check unlock requirements for gradient theme', () => {
      const userStatsUnlocked = { perfectScores: 15 };
      const userStatsLocked = { perfectScores: 5 };
      
      expect(service.isThemeUnlocked(BannerTheme.GRADIENT, userStatsUnlocked)).toBe(true);
      expect(service.isThemeUnlocked(BannerTheme.GRADIENT, userStatsLocked)).toBe(false);
    });

    it('should return false for unknown unlockable theme', () => {
      const userStats = {};
      const isUnlocked = service.isThemeUnlocked('unknown-unlockable', userStats);
      
      expect(isUnlocked).toBe(false);
    });
  });

  describe('getUserUnlockedThemes', () => {
    it('should return all themes for user with all achievements', () => {
      const userStats = {
        totalPuzzlesSolved: 100,
        tournamentsWon: 5,
        perfectScores: 20
      };
      
      const unlockedThemes = service.getUserUnlockedThemes(userStats);
      const allThemes = service.getAllThemes();
      
      expect(unlockedThemes.length).toBe(allThemes.length);
    });

    it('should return only available themes for new user', () => {
      const userStats = {
        totalPuzzlesSolved: 0,
        tournamentsWon: 0,
        perfectScores: 0
      };
      
      const unlockedThemes = service.getUserUnlockedThemes(userStats);
      const availableThemes = service.getAvailableThemes();
      
      expect(unlockedThemes.length).toBe(availableThemes.length);
      expect(unlockedThemes.every(theme => !theme.isUnlockable)).toBe(true);
    });

    it('should return partial unlocked themes for intermediate user', () => {
      const userStats = {
        totalPuzzlesSolved: 60, // Unlocks sunset
        tournamentsWon: 0,      // Doesn't unlock neon
        perfectScores: 5        // Doesn't unlock gradient
      };
      
      const unlockedThemes = service.getUserUnlockedThemes(userStats);
      const availableThemes = service.getAvailableThemes();
      
      expect(unlockedThemes.length).toBe(availableThemes.length + 1); // +1 for sunset
      expect(unlockedThemes.some(theme => theme.id === BannerTheme.SUNSET)).toBe(true);
      expect(unlockedThemes.some(theme => theme.id === BannerTheme.NEON)).toBe(false);
    });
  });
});