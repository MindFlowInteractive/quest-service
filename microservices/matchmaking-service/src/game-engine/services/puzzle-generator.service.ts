import { Injectable, Logger } from '@nestjs/common';
import type {
  IPuzzleGenerator,
  IPuzzle,
} from '../interfaces/puzzle.interfaces';
import { PuzzleType, DifficultyLevel } from '../types/puzzle.types';
import { LogicGridPuzzle } from '../implementations/logic-grid-puzzle';
import { SequencePuzzle } from '../implementations/sequence-puzzle';
import { SpatialPuzzle } from '../implementations/spatial-puzzle';

/**
 * Service responsible for generating puzzles of different types
 * Implements variation and randomization systems
 */
@Injectable()
export class PuzzleGeneratorService {
  private readonly logger = new Logger(PuzzleGeneratorService.name);
  private readonly generators = new Map<PuzzleType, IPuzzleGenerator>();

  constructor() {
    this.registerDefaultGenerators();
  }

  private registerDefaultGenerators(): void {
    this.registerGenerator(new LogicGridGenerator());
    this.registerGenerator(new SequenceGenerator());
    this.registerGenerator(new SpatialGenerator());
    this.registerGenerator(new PatternMatchingGenerator());
    this.registerGenerator(new MathematicalGenerator());
    this.registerGenerator(new WordPuzzleGenerator());
  }

  registerGenerator(generator: IPuzzleGenerator): void {
    this.generators.set(generator.type, generator);
    this.logger.log(`Registered generator for puzzle type: ${generator.type}`);
  }

  async generatePuzzle(
    type: PuzzleType,
    difficulty: DifficultyLevel,
    constraints?: any,
  ): Promise<IPuzzle> {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`No generator registered for puzzle type: ${type}`);
    }

    this.logger.debug(
      `Generating ${type} puzzle with difficulty ${difficulty}`,
    );
    return await generator.generatePuzzle(difficulty, constraints);
  }

  validateConfiguration(type: PuzzleType, config: any): boolean {
    const generator = this.generators.get(type);
    if (!generator) {
      return false;
    }

    return generator.validateConfiguration(config);
  }

  estimateDifficulty(puzzle: IPuzzle): DifficultyLevel {
    const generator = this.generators.get(puzzle.type);
    if (!generator) {
      return DifficultyLevel.MEDIUM;
    }

    return generator.estimateDifficulty(puzzle);
  }

  getSupportedTypes(): PuzzleType[] {
    return Array.from(this.generators.keys());
  }

  // Randomization utilities
  getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateVariation(
    basePuzzle: IPuzzle,
    variationType: 'easy' | 'hard' | 'theme' = 'easy',
  ): Promise<IPuzzle> {
    const generator = this.generators.get(basePuzzle.type);
    if (!generator) {
      throw new Error(`No generator for puzzle type: ${basePuzzle.type}`);
    }

    // Create variation based on type
    const constraints = this.getVariationConstraints(basePuzzle, variationType);
    return generator.generatePuzzle(basePuzzle.difficulty, constraints);
  }

  private getVariationConstraints(
    basePuzzle: IPuzzle,
    variationType: string,
  ): any {
    const baseConstraints = basePuzzle.metadata.generationConstraints || {};

    switch (variationType) {
      case 'easy':
        return {
          ...baseConstraints,
          complexity: Math.max(1, (baseConstraints.complexity || 3) - 1),
          timeLimit: (basePuzzle.timeLimit || 300000) * 1.5,
          maxMoves: (basePuzzle.maxMoves || 20) + 5,
        };

      case 'hard':
        return {
          ...baseConstraints,
          complexity: Math.min(5, (baseConstraints.complexity || 3) + 1),
          timeLimit: (basePuzzle.timeLimit || 300000) * 0.75,
          maxMoves: Math.max(5, (basePuzzle.maxMoves || 20) - 3),
        };

      case 'theme':
        return {
          ...baseConstraints,
          theme: this.getRandomElement([
            'medieval',
            'space',
            'nature',
            'abstract',
          ]),
        };

      default:
        return baseConstraints;
    }
  }
}

// Concrete generator implementations

class LogicGridGenerator implements IPuzzleGenerator {
  type: PuzzleType = PuzzleType.LOGIC_GRID;

  async generatePuzzle(
    difficulty: DifficultyLevel,
    constraints?: any,
  ): Promise<IPuzzle> {
    const puzzle = new LogicGridPuzzle();
    puzzle.difficulty = difficulty;

    const config = this.generateLogicGridConfig(difficulty, constraints);
    await puzzle.initialize(config);

    return puzzle;
  }

  private generateLogicGridConfig(
    difficulty: DifficultyLevel,
    constraints?: any,
  ) {
    const themes = [
      {
        categories: ['Names', 'Ages', 'Pets'],
        items: {
          Names: ['Alice', 'Bob', 'Carol', 'Dave'],
          Ages: ['22', '25', '28', '31'],
          Pets: ['Cat', 'Dog', 'Bird', 'Fish'],
        },
      },
      {
        categories: ['Cities', 'Colors', 'Foods'],
        items: {
          Cities: ['New York', 'Paris', 'Tokyo', 'London'],
          Colors: ['Red', 'Blue', 'Green', 'Yellow'],
          Foods: ['Pizza', 'Sushi', 'Burger', 'Pasta'],
        },
      },
    ];

    const theme =
      constraints?.theme || themes[Math.floor(Math.random() * themes.length)];
    const size = Math.min(difficulty + 1, 4);

    return {
      size,
      categories: theme.categories.slice(0, size),
      items: Object.fromEntries(
        theme.categories
          .slice(0, size)
          .map((cat: string) => [
            cat,
            theme.items[cat as keyof typeof theme.items].slice(0, size),
          ]),
      ),
      complexity: constraints?.complexity || difficulty,
    };
  }

  validateConfiguration(config: any): boolean {
    return (
      config.size > 0 &&
      config.categories &&
      config.items &&
      config.categories.length === config.size
    );
  }

  estimateDifficulty(puzzle: IPuzzle): DifficultyLevel {
    const state = puzzle.getState().currentState;
    if (!state) return DifficultyLevel.MEDIUM;

    // Estimate based on grid size and rule complexity
    const size = state.size || 3;
    const ruleCount = state.rules?.length || 0;

    if (size <= 2 && ruleCount <= 1) return DifficultyLevel.BEGINNER;
    if (size <= 3 && ruleCount <= 2) return DifficultyLevel.EASY;
    if (size <= 4 && ruleCount <= 4) return DifficultyLevel.MEDIUM;
    if (size <= 5 && ruleCount <= 6) return DifficultyLevel.HARD;
    return DifficultyLevel.EXPERT;
  }
}

class SequenceGenerator implements IPuzzleGenerator {
  type: PuzzleType = PuzzleType.SEQUENCE;

  async generatePuzzle(
    difficulty: DifficultyLevel,
    constraints?: any,
  ): Promise<IPuzzle> {
    const puzzle = new SequencePuzzle();
    puzzle.difficulty = difficulty;

    const config = this.generateSequenceConfig(difficulty, constraints);
    await puzzle.initialize(config);

    return puzzle;
  }

  private generateSequenceConfig(
    difficulty: DifficultyLevel,
    constraints?: any,
  ) {
    const patterns = [
      { type: 'arithmetic', params: { difference: this.getRandomInt(2, 8) } },
      { type: 'geometric', params: { ratio: this.getRandomInt(2, 4) } },
      { type: 'fibonacci', params: {} },
      {
        type: 'polynomial',
        params: {
          coefficients: [1, this.getRandomInt(1, 3), this.getRandomInt(0, 2)],
        },
      },
    ];

    const availablePatterns = patterns.filter((p) => {
      switch (difficulty) {
        case DifficultyLevel.BEGINNER:
          return p.type === 'arithmetic';
        case DifficultyLevel.EASY:
          return ['arithmetic', 'geometric'].includes(p.type);
        case DifficultyLevel.MEDIUM:
          return ['arithmetic', 'geometric', 'fibonacci'].includes(p.type);
        default:
          return true;
      }
    });

    const pattern =
      availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    const targetLength = Math.min(8 + difficulty * 2, 20);

    return {
      pattern: {
        type: pattern.type,
        parameters: pattern.params,
        description: this.getPatternDescription(pattern.type),
      },
      targetLength,
      complexity: constraints?.complexity || difficulty,
    };
  }

  private getPatternDescription(type: string): string {
    const descriptions = {
      arithmetic: 'Arithmetic sequence (constant difference)',
      geometric: 'Geometric sequence (constant ratio)',
      fibonacci: 'Fibonacci sequence (sum of previous two)',
      polynomial: 'Polynomial sequence',
    };
    return descriptions[type as keyof typeof descriptions] || 'Unknown pattern';
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  validateConfiguration(config: any): boolean {
    return config.pattern && config.pattern.type && config.targetLength > 0;
  }

  estimateDifficulty(puzzle: IPuzzle): DifficultyLevel {
    const state = puzzle.getState().currentState;
    if (!state) return DifficultyLevel.MEDIUM;

    const patternType = state.pattern?.type;
    const length = state.targetLength || 10;

    if (patternType === 'arithmetic' && length <= 8)
      return DifficultyLevel.BEGINNER;
    if (['arithmetic', 'geometric'].includes(patternType) && length <= 12)
      return DifficultyLevel.EASY;
    if (patternType === 'fibonacci' && length <= 15)
      return DifficultyLevel.MEDIUM;
    return DifficultyLevel.HARD;
  }
}

class SpatialGenerator implements IPuzzleGenerator {
  type: PuzzleType = PuzzleType.SPATIAL;

  async generatePuzzle(
    difficulty: DifficultyLevel,
    constraints?: any,
  ): Promise<IPuzzle> {
    const puzzle = new SpatialPuzzle();
    puzzle.difficulty = difficulty;

    const config = this.generateSpatialConfig(difficulty, constraints);
    await puzzle.initialize(config);

    return puzzle;
  }

  private generateSpatialConfig(
    difficulty: DifficultyLevel,
    constraints?: any,
  ) {
    const sizes = [
      { width: 6, height: 6 }, // Beginner
      { width: 8, height: 6 }, // Easy
      { width: 8, height: 8 }, // Medium
      { width: 10, height: 8 }, // Hard
      { width: 12, height: 10 }, // Expert+
    ];

    const sizeIndex = Math.min(difficulty - 1, sizes.length - 1);
    const size = sizes[sizeIndex];

    return {
      width: constraints?.width || size.width,
      height: constraints?.height || size.height,
      goalCount: Math.min(difficulty + 1, 4),
      obstacleRatio: 0.1 + difficulty * 0.05,
      movableObjects: difficulty >= 3 ? Math.floor(difficulty / 2) : 0,
      theme: constraints?.theme || 'default',
    };
  }

  validateConfiguration(config: any): boolean {
    return (
      config.width > 0 &&
      config.height > 0 &&
      config.width * config.height >= 16
    );
  }

  estimateDifficulty(puzzle: IPuzzle): DifficultyLevel {
    const state = puzzle.getState().currentState;
    if (!state) return DifficultyLevel.MEDIUM;

    const area = (state.width || 8) * (state.height || 8);
    const goalCount = state.goals?.length || 1;
    const hasMovableObjects = (state.movableObjects?.length || 0) > 0;

    if (area <= 36 && goalCount === 1 && !hasMovableObjects)
      return DifficultyLevel.BEGINNER;
    if (area <= 48 && goalCount <= 2 && !hasMovableObjects)
      return DifficultyLevel.EASY;
    if (area <= 64 && goalCount <= 3) return DifficultyLevel.MEDIUM;
    if (area <= 80 && goalCount <= 4) return DifficultyLevel.HARD;
    return DifficultyLevel.EXPERT;
  }
}

// Placeholder generators for other puzzle types

class PatternMatchingGenerator implements IPuzzleGenerator {
  type: PuzzleType = PuzzleType.PATTERN_MATCHING;

  async generatePuzzle(
    difficulty: DifficultyLevel,
    constraints?: any,
  ): Promise<IPuzzle> {
    // TODO: Implement pattern matching puzzle
    throw new Error('Pattern matching puzzles not yet implemented');
  }

  validateConfiguration(config: any): boolean {
    return true;
  }

  estimateDifficulty(puzzle: IPuzzle): DifficultyLevel {
    return DifficultyLevel.MEDIUM;
  }
}

class MathematicalGenerator implements IPuzzleGenerator {
  type: PuzzleType = PuzzleType.MATHEMATICAL;

  async generatePuzzle(
    difficulty: DifficultyLevel,
    constraints?: any,
  ): Promise<IPuzzle> {
    // TODO: Implement mathematical puzzle
    throw new Error('Mathematical puzzles not yet implemented');
  }

  validateConfiguration(config: any): boolean {
    return true;
  }

  estimateDifficulty(puzzle: IPuzzle): DifficultyLevel {
    return DifficultyLevel.MEDIUM;
  }
}

class WordPuzzleGenerator implements IPuzzleGenerator {
  type: PuzzleType = PuzzleType.WORD_PUZZLE;

  async generatePuzzle(
    difficulty: DifficultyLevel,
    constraints?: any,
  ): Promise<IPuzzle> {
    // TODO: Implement word puzzle
    throw new Error('Word puzzles not yet implemented');
  }

  validateConfiguration(config: any): boolean {
    return true;
  }

  estimateDifficulty(puzzle: IPuzzle): DifficultyLevel {
    return DifficultyLevel.MEDIUM;
  }
}
