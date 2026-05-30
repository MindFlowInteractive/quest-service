import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GuildController } from './guild.controller';
import { GuildService } from './guild.service';

describe('GuildController', () => {
  let ctrl: GuildController;
  beforeEach(async () => {
    const m: TestingModule = await Test.createTestingModule({
      controllers: [GuildController], providers: [GuildService],
    }).compile();
    ctrl = m.get(GuildController);
  });
  it('should be defined', () => expect(ctrl).toBeDefined());
  it('creates a guild with owner as first member', () => {
    const g = ctrl.create('Alphas', 'owner1');
    expect(g.name).toBe('Alphas');
    expect(g.memberIds).toContain('owner1');
  });
  it('throws for unknown guild', () => {
    expect(() => ctrl.findOne('none')).toThrow(NotFoundException);
  });
  it('adds and removes members', () => {
    const g = ctrl.create('Betas', 'o1');
    ctrl.addMember(g.id, 'm2');
    expect(ctrl.findOne(g.id).memberIds).toContain('m2');
    ctrl.removeMember(g.id, 'm2');
    expect(ctrl.findOne(g.id).memberIds).not.toContain('m2');
  });
});
