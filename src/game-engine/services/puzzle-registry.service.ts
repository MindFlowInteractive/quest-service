import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PuzzleEngineService } from '../services/puzzle-engine.service';
import { PuzzleGeneratorService } from '../services/puzzle-generator.service';
import { LogicGridPuzzle } from '../implementations/logic-grid-puzzle';
import { SequencePuzzle } from '../implementations/sequence-puzzle';
import { SpatialPuzzle } from '../implementations/spatial-puzzle';
import { PuzzleType } from '../types/puzzle.types';

/**
 * Service responsible for initializing the puzzle engine with concrete implementations
 */
@Injectable()
export class PuzzleRegistryService implements OnModuleInit {
  private readonly logger = new Logger(PuzzleRegistryService.name);

  constructor(
    private readonly puzzleEngine: PuzzleEngineService,
    private readonly puzzleGenerator: PuzzleGeneratorService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.registerPuzzleTypes();
    this.logger.log('Puzzle registry initialized with all puzzle types');
  }

  private async registerPuzzleTypes(): Promise<void> {
    // Register Logic Grid puzzles
    this.puzzleEngine.registerPuzzleType(
      PuzzleType.LOGIC_GRID,
      () => new LogicGridPuzzle(),
    );
    this.logger.debug('Registered Logic Grid puzzle type');

    // Register Sequence puzzles
    this.puzzleEngine.registerPuzzleType(
      PuzzleType.SEQUENCE,
      () => new SequencePuzzle(),
    );
    this.logger.debug('Registered Sequence puzzle type');

    // Register Spatial puzzles
    this.puzzleEngine.registerPuzzleType(
      PuzzleType.SPATIAL,
      () => new SpatialPuzzle(),
    );
    this.logger.debug('Registered Spatial puzzle type');

    // TODO: Register other puzzle types as they are implemented
    // this.puzzleEngine.registerPuzzleType(PuzzleType.PATTERN_MATCHING, () => new PatternMatchingPuzzle())
    // this.puzzleEngine.registerPuzzleType(PuzzleType.MATHEMATICAL, () => new MathematicalPuzzle())
    // this.puzzleEngine.registerPuzzleType(PuzzleType.WORD_PUZZLE, () => new WordPuzzle())
  }

  getSupportedPuzzleTypes(): PuzzleType[] {
    return [
      PuzzleType.LOGIC_GRID,
      PuzzleType.SEQUENCE,
      PuzzleType.SPATIAL,
      // Add more as they are implemented
    ];
  }

  isPuzzleTypeSupported(type: PuzzleType): boolean {
    return this.getSupportedPuzzleTypes().includes(type);
  }

  // Methods for demo compatibility
  getRegisteredTypes(): PuzzleType[] {
    return this.getSupportedPuzzleTypes();
  }

  getGenerator(type: PuzzleType): any {
    return this.puzzleGenerator;
  }

  getGeneratorCount(): number {
    return this.getSupportedPuzzleTypes().length;
  }

  async createPuzzleInstance(type: PuzzleType): Promise<any> {
    switch (type) {
      case PuzzleType.LOGIC_GRID:
        return new LogicGridPuzzle();
      case PuzzleType.SEQUENCE:
        return new SequencePuzzle();
      case PuzzleType.SPATIAL:
        return new SpatialPuzzle();
      default:
        throw new Error(`Unsupported puzzle type: ${type}`);
    }
  }
}
