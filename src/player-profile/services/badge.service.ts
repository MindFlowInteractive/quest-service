import { Injectable, NotFoundException } from '@nestjs/common';
import { BadgeDto, BadgeCategory } from '../dto/badge-management.dto';

@Injectable()
export class BadgeService {
  private readonly badges: Map<string, BadgeDto> = new Map();

  constructor() {
    this.initializeDefaultBadges();
  }

  private initializeDefaultBadges() {
    const defaultBadges: BadgeDto[] = [
      {
        id: 'first-win',
        name: 'First Victory',
        description: 'Won your first game',
        iconUrl: '/badges/first-win.png',
        category: BadgeCategory.ACHIEVEMENT,
        rarity: 'common'
      },
      {
        id: 'puzzle-master',
        name: 'Puzzle Master',
        description: 'Solved 100 puzzles',
        iconUrl: '/badges/puzzle-master.png',
        category: BadgeCategory.SKILL,
        rarity: 'rare'
      },
      {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Completed a puzzle in under 30 seconds',
        iconUrl: '/badges/speed-demon.png',
        category: BadgeCategory.SKILL,
        rarity: 'epic'
      },
      {
        id: 'tournament-winner',
        name: 'Tournament Champion',
        description: 'Won a tournament',
        iconUrl: '/badges/tournament-winner.png',
        category: BadgeCategory.TOURNAMENT,
        rarity: 'legendary'
      },
      {
        id: 'perfect-streak',
        name: 'Perfect Streak',
        description: 'Achieved a 10-game win streak',
        iconUrl: '/badges/perfect-streak.png',
        category: BadgeCategory.ACHIEVEMENT,
        rarity: 'epic'
      },
      {
        id: 'beta-tester',
        name: 'Beta Tester',
        description: 'Participated in the beta program',
        iconUrl: '/badges/beta-tester.png',
        category: BadgeCategory.SPECIAL,
        rarity: 'rare'
      },
      {
        id: 'community-helper',
        name: 'Community Helper',
        description: 'Helped other players in the community',
        iconUrl: '/badges/community-helper.png',
        category: BadgeCategory.SPECIAL,
        rarity: 'rare'
      },
      {
        id: 'daily-player',
        name: 'Daily Player',
        description: 'Played for 30 consecutive days',
        iconUrl: '/badges/daily-player.png',
        category: BadgeCategory.ACHIEVEMENT,
        rarity: 'common'
      }
    ];

    defaultBadges.forEach(badge => {
      this.badges.set(badge.id, badge);
    });
  }

  getAllBadges(): BadgeDto[] {
    return Array.from(this.badges.values());
  }

  getBadgeById(id: string): BadgeDto {
    const badge = this.badges.get(id);
    if (!badge) {
      throw new NotFoundException(`Badge with ID ${id} not found`);
    }
    return badge;
  }

  getBadgesByIds(ids: string[]): BadgeDto[] {
    return ids.map(id => {
      try {
        return this.getBadgeById(id);
      } catch {
        return null;
      }
    }).filter(Boolean) as BadgeDto[];
  }

  getBadgesByCategory(category: BadgeCategory): BadgeDto[] {
    return Array.from(this.badges.values()).filter(badge => badge.category === category);
  }

  getBadgesByRarity(rarity: string): BadgeDto[] {
    return Array.from(this.badges.values()).filter(badge => badge.rarity === rarity);
  }

  validateBadgeIds(ids: string[]): boolean {
    return ids.every(id => this.badges.has(id));
  }

  addBadge(badge: BadgeDto): void {
    this.badges.set(badge.id, badge);
  }

  updateBadge(id: string, updates: Partial<BadgeDto>): BadgeDto {
    const badge = this.getBadgeById(id);
    const updatedBadge = { ...badge, ...updates };
    this.badges.set(id, updatedBadge);
    return updatedBadge;
  }

  removeBadge(id: string): boolean {
    return this.badges.delete(id);
  }
}