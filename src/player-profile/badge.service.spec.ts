import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BadgeService } from './services/badge.service';
import { BadgeCategory } from './dto/badge-management.dto';

describe('BadgeService', () => {
  let service: BadgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BadgeService],
    }).compile();

    service = module.get<BadgeService>(BadgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllBadges', () => {
    it('should return all default badges', () => {
      const badges = service.getAllBadges();
      
      expect(badges.length).toBeGreaterThan(0);
      expect(badges.some(badge => badge.id === 'first-win')).toBe(true);
      expect(badges.some(badge => badge.id === 'puzzle-master')).toBe(true);
    });
  });

  describe('getBadgeById', () => {
    it('should return badge by ID', () => {
      const badge = service.getBadgeById('first-win');
      
      expect(badge).toBeDefined();
      expect(badge.id).toBe('first-win');
      expect(badge.name).toBe('First Victory');
    });

    it('should throw NotFoundException for invalid ID', () => {
      expect(() => service.getBadgeById('non-existent'))
        .toThrow(NotFoundException);
    });
  });

  describe('getBadgesByIds', () => {
    it('should return badges for valid IDs', () => {
      const badges = service.getBadgesByIds(['first-win', 'puzzle-master']);
      
      expect(badges).toHaveLength(2);
      expect(badges[0].id).toBe('first-win');
      expect(badges[1].id).toBe('puzzle-master');
    });

    it('should filter out invalid IDs', () => {
      const badges = service.getBadgesByIds(['first-win', 'non-existent']);
      
      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('first-win');
    });
  });

  describe('getBadgesByCategory', () => {
    it('should return badges by category', () => {
      const achievementBadges = service.getBadgesByCategory(BadgeCategory.ACHIEVEMENT);
      
      expect(achievementBadges.length).toBeGreaterThan(0);
      expect(achievementBadges.every(badge => badge.category === BadgeCategory.ACHIEVEMENT)).toBe(true);
    });

    it('should return skill badges', () => {
      const skillBadges = service.getBadgesByCategory(BadgeCategory.SKILL);
      
      expect(skillBadges.length).toBeGreaterThan(0);
      expect(skillBadges.every(badge => badge.category === BadgeCategory.SKILL)).toBe(true);
    });
  });

  describe('getBadgesByRarity', () => {
    it('should return badges by rarity', () => {
      const rareBadges = service.getBadgesByRarity('rare');
      
      expect(rareBadges.length).toBeGreaterThan(0);
      expect(rareBadges.every(badge => badge.rarity === 'rare')).toBe(true);
    });

    it('should return legendary badges', () => {
      const legendaryBadges = service.getBadgesByRarity('legendary');
      
      expect(legendaryBadges.length).toBeGreaterThan(0);
      expect(legendaryBadges.every(badge => badge.rarity === 'legendary')).toBe(true);
    });
  });

  describe('validateBadgeIds', () => {
    it('should return true for valid badge IDs', () => {
      const isValid = service.validateBadgeIds(['first-win', 'puzzle-master']);
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid badge IDs', () => {
      const isValid = service.validateBadgeIds(['first-win', 'non-existent']);
      
      expect(isValid).toBe(false);
    });

    it('should return true for empty array', () => {
      const isValid = service.validateBadgeIds([]);
      
      expect(isValid).toBe(true);
    });
  });

  describe('addBadge', () => {
    it('should add new badge', () => {
      const newBadge = {
        id: 'test-badge',
        name: 'Test Badge',
        description: 'A test badge',
        iconUrl: '/test.png',
        category: BadgeCategory.SPECIAL,
        rarity: 'common' as const
      };

      service.addBadge(newBadge);
      const retrievedBadge = service.getBadgeById('test-badge');
      
      expect(retrievedBadge).toEqual(newBadge);
    });
  });

  describe('updateBadge', () => {
    it('should update existing badge', () => {
      const updates = { name: 'Updated First Victory' };
      const updatedBadge = service.updateBadge('first-win', updates);
      
      expect(updatedBadge.name).toBe('Updated First Victory');
      expect(updatedBadge.id).toBe('first-win');
    });

    it('should throw NotFoundException for non-existent badge', () => {
      expect(() => service.updateBadge('non-existent', { name: 'Test' }))
        .toThrow(NotFoundException);
    });
  });

  describe('removeBadge', () => {
    it('should remove existing badge', () => {
      // First add a badge to remove
      const testBadge = {
        id: 'removable-badge',
        name: 'Removable Badge',
        description: 'A badge to be removed',
        iconUrl: '/removable.png',
        category: BadgeCategory.SPECIAL,
        rarity: 'common' as const
      };
      
      service.addBadge(testBadge);
      expect(service.getBadgeById('removable-badge')).toBeDefined();
      
      const removed = service.removeBadge('removable-badge');
      expect(removed).toBe(true);
      
      expect(() => service.getBadgeById('removable-badge'))
        .toThrow(NotFoundException);
    });

    it('should return false for non-existent badge', () => {
      const removed = service.removeBadge('non-existent');
      expect(removed).toBe(false);
    });
  });
});