import { Injectable } from '@nestjs/common';
import { BannerTheme } from '../dto/banner-theme.dto';

export interface BannerThemeConfig {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  gradient?: {
    from: string;
    to: string;
    direction?: string;
  };
  backgroundImage?: string;
  isUnlockable: boolean;
  unlockRequirement?: string;
}

@Injectable()
export class BannerThemeService {
  private readonly themes: Map<string, BannerThemeConfig> = new Map();

  constructor() {
    this.initializeDefaultThemes();
  }

  private initializeDefaultThemes() {
    const defaultThemes: BannerThemeConfig[] = [
      {
        id: BannerTheme.COSMIC,
        name: 'Cosmic',
        description: 'A stellar cosmic theme with nebula colors',
        previewUrl: '/themes/cosmic-preview.jpg',
        colors: {
          primary: '#1a0b3d',
          secondary: '#4c1d95',
          accent: '#8b5cf6'
        },
        gradient: {
          from: '#1a0b3d',
          to: '#4c1d95',
          direction: 'to right'
        },
        backgroundImage: '/themes/cosmic-bg.jpg',
        isUnlockable: false
      },
      {
        id: BannerTheme.FOREST,
        name: 'Forest',
        description: 'Natural forest theme with earth tones',
        previewUrl: '/themes/forest-preview.jpg',
        colors: {
          primary: '#064e3b',
          secondary: '#059669',
          accent: '#10b981'
        },
        gradient: {
          from: '#064e3b',
          to: '#059669'
        },
        backgroundImage: '/themes/forest-bg.jpg',
        isUnlockable: false
      },
      {
        id: BannerTheme.OCEAN,
        name: 'Ocean',
        description: 'Deep ocean theme with blue gradients',
        previewUrl: '/themes/ocean-preview.jpg',
        colors: {
          primary: '#0c4a6e',
          secondary: '#0284c7',
          accent: '#38bdf8'
        },
        gradient: {
          from: '#0c4a6e',
          to: '#0284c7'
        },
        backgroundImage: '/themes/ocean-bg.jpg',
        isUnlockable: false
      },
      {
        id: BannerTheme.SUNSET,
        name: 'Sunset',
        description: 'Warm sunset colors',
        previewUrl: '/themes/sunset-preview.jpg',
        colors: {
          primary: '#9a3412',
          secondary: '#ea580c',
          accent: '#fb923c'
        },
        gradient: {
          from: '#9a3412',
          to: '#ea580c'
        },
        backgroundImage: '/themes/sunset-bg.jpg',
        isUnlockable: true,
        unlockRequirement: 'Complete 50 puzzles'
      },
      {
        id: BannerTheme.NEON,
        name: 'Neon',
        description: 'Cyberpunk neon theme',
        previewUrl: '/themes/neon-preview.jpg',
        colors: {
          primary: '#0f0f23',
          secondary: '#1e1b4b',
          accent: '#a855f7'
        },
        gradient: {
          from: '#0f0f23',
          to: '#1e1b4b'
        },
        backgroundImage: '/themes/neon-bg.jpg',
        isUnlockable: true,
        unlockRequirement: 'Win a tournament'
      },
      {
        id: BannerTheme.MINIMAL,
        name: 'Minimal',
        description: 'Clean minimal design',
        previewUrl: '/themes/minimal-preview.jpg',
        colors: {
          primary: '#f8fafc',
          secondary: '#e2e8f0',
          accent: '#64748b'
        },
        isUnlockable: false
      },
      {
        id: BannerTheme.DARK,
        name: 'Dark',
        description: 'Dark theme for night owls',
        previewUrl: '/themes/dark-preview.jpg',
        colors: {
          primary: '#0f172a',
          secondary: '#1e293b',
          accent: '#475569'
        },
        isUnlockable: false
      },
      {
        id: BannerTheme.LIGHT,
        name: 'Light',
        description: 'Bright and clean light theme',
        previewUrl: '/themes/light-preview.jpg',
        colors: {
          primary: '#ffffff',
          secondary: '#f1f5f9',
          accent: '#3b82f6'
        },
        isUnlockable: false
      },
      {
        id: BannerTheme.GRADIENT,
        name: 'Rainbow Gradient',
        description: 'Colorful rainbow gradient',
        previewUrl: '/themes/gradient-preview.jpg',
        colors: {
          primary: '#ec4899',
          secondary: '#8b5cf6',
          accent: '#06b6d4'
        },
        gradient: {
          from: '#ec4899',
          to: '#06b6d4',
          direction: 'to right'
        },
        isUnlockable: true,
        unlockRequirement: 'Achieve perfect score on 10 puzzles'
      }
    ];

    defaultThemes.forEach(theme => {
      this.themes.set(theme.id, theme);
    });
  }

  getAllThemes(): BannerThemeConfig[] {
    return Array.from(this.themes.values());
  }

  getAvailableThemes(): BannerThemeConfig[] {
    return Array.from(this.themes.values()).filter(theme => !theme.isUnlockable);
  }

  getUnlockableThemes(): BannerThemeConfig[] {
    return Array.from(this.themes.values()).filter(theme => theme.isUnlockable);
  }

  getThemeById(id: string): BannerThemeConfig | undefined {
    return this.themes.get(id);
  }

  isThemeUnlocked(themeId: string, userStats: any): boolean {
    const theme = this.getThemeById(themeId);
    if (!theme) {
      return false; // Unknown themes are not unlocked
    }
    
    if (!theme.isUnlockable) {
      return true; // Default themes are always unlocked
    }

    // Simple unlock logic - in a real app, this would be more sophisticated
    switch (themeId) {
      case BannerTheme.SUNSET:
        return userStats.totalPuzzlesSolved >= 50;
      case BannerTheme.NEON:
        return userStats.tournamentsWon > 0;
      case BannerTheme.GRADIENT:
        return userStats.perfectScores >= 10;
      default:
        return false;
    }
  }

  getUserUnlockedThemes(userStats: any): BannerThemeConfig[] {
    return this.getAllThemes().filter(theme => 
      this.isThemeUnlocked(theme.id, userStats)
    );
  }
}