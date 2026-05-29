import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PuzzleLibraryController } from './puzzle-library.controller';
import { PuzzleLibraryService } from './puzzle-library.service';

describe('PuzzleLibraryController', () => {
  let ctrl: PuzzleLibraryController;
  beforeEach(async () => {
    const m: TestingModule = await Test.createTestingModule({
      controllers: [PuzzleLibraryController], providers: [PuzzleLibraryService],
    }).compile();
    ctrl = m.get(PuzzleLibraryController);
  });
  it('should be defined', () => expect(ctrl).toBeDefined());
  it('creates and retrieves a puzzle', () => {
    const p = ctrl.create('Riddle 1', 'logic', 'easy');
    expect(p.title).toBe('Riddle 1');
    expect(ctrl.findOne(p.id).category).toBe('logic');
  });
  it('filters by category', () => {
    ctrl.create('A', 'math', 'hard');
    ctrl.create('B', 'logic', 'easy');
    expect(ctrl.findAll('math')).toHaveLength(1);
  });
  it('throws for unknown puzzle', () => {
    expect(() => ctrl.findOne('x')).toThrow(NotFoundException);
  });
});
