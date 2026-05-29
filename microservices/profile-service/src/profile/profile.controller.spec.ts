import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let ctrl: ProfileController;
  beforeEach(async () => {
    const m: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController], providers: [ProfileService],
    }).compile();
    ctrl = m.get(ProfileController);
  });
  it('should be defined', () => expect(ctrl).toBeDefined());
  it('creates a profile', () => {
    const p = ctrl.create('u1', 'Alice');
    expect(p.userId).toBe('u1');
    expect(p.displayName).toBe('Alice');
  });
  it('throws for unknown user', () => {
    expect(() => ctrl.findOne('ghost')).toThrow(NotFoundException);
  });
});
