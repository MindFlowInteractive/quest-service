import { Injectable } from '@nestjs/common';
import { PuzzleAnalysis, Hint } from './interfaces/puzzle-analysis.interface';

@Injectable()
export class HintProgressionService {
  private playerHintLevels: Map<string, Map<string, number>> = new Map();

  async getPlayerHintLevel(userId: string, puzzleId: string): Promise<number> {
    if (!this.playerHintLevels.has(userId)) {
      this.playerHintLevels.set(userId, new Map());
    }
    
    const userHints = this.playerHintLevels.get(userId);
    return userHints.get(puzzleId) || 1;
  }

  async generateHint(
    analysis: PuzzleAnalysis,
    currentHintLevel: number,
    previousAttempts: number
  ): Promise<Hint> {
    // Adjust hint level based on attempts
    const adjustedLevel = this.adjustHintLevel(currentHintLevel, previousAttempts);
    
    // Generate hint that matches the level
    const hint = this.createHintForLevel(analysis, adjustedLevel);
    
    // Ensure hint doesn't give away the solution
    if (!hint.avoidsSolution) {
      return this.dilutehint(hint);
    }
    
    return hint;
  }

  private adjustHintLevel(baseLevel: number, attempts: number): number {
    // Increase hint detail gradually based on struggle
    if (attempts > 5) return Math.min(baseLevel + 2, 5);
    if (attempts > 3) return Math.min(baseLevel + 1, 5);
    return baseLevel;
  }

  private createHintForLevel(analysis: PuzzleAnalysis, level: number): Hint {
    switch (level) {
      case 1:
        return this.createObservationalHint(analysis);
      case 2:
        return this.createQuestionBasedHint(analysis);
      case 3:
        return this.createStrategyHint(analysis);
      case 4:
        return this.createPatternHint(analysis);
      case 5:
        return this.createDirectionalHint(analysis);
      default:
        return this.createObservationalHint(analysis);
    }
  }

  private createObservationalHint(analysis: PuzzleAnalysis): Hint {
    return {
      level: 1,
      type: 'observation',
      content: this.generateObservation(analysis),
      reasoning: 'Encouraging careful observation without directing solution',
      nextSteps: ['Think about what this observation means', 'Look for similar patterns'],
      avoidsSolution: true,
    };
  }

  private createQuestionBasedHint(analysis: PuzzleAnalysis): Hint {
    const questions = this.generateGuidingQuestions(analysis);
    
    return {
      level: 2,
      type: 'question',
      content: `Consider these questions: ${questions.join(' ')}`,
      reasoning: 'Socratic method to guide thinking',
      nextSteps: ['Answer each question', 'See what patterns emerge'],
      avoidsSolution: true,
    };
  }

  private createStrategyHint(analysis: PuzzleAnalysis): Hint {
    const strategy = analysis.suggestedStrategies[0];
    
    return {
      level: 3,
      type: 'strategy',
      content: `Try using the "${strategy.name}" approach. ${strategy.description}`,
      reasoning: 'Introducing a problem-solving framework',
      nextSteps: [
        'Think about how this strategy applies here',
        'Identify where you can use it first',
      ],
      avoidsSolution: true,
    };
  }

  private createPatternHint(analysis: PuzzleAnalysis): Hint {
    const pattern = analysis.identifiedPatterns[0] || 'structure';
    
    return {
      level: 4,
      type: 'pattern',
      content: `Notice the ${pattern} in the puzzle. How might this help you?`,
      reasoning: 'Pointing to specific patterns without solving',
      nextSteps: [
        'Analyze how this pattern constrains possibilities',
        'Use this insight to eliminate options',
      ],
      avoidsSolution: true,
    };
  }

  private createDirectionalHint(analysis: PuzzleAnalysis): Hint {
    return {
      level: 5,
      type: 'strategy',
      content: this.generateDirectionalGuidance(analysis),
      reasoning: 'Providing clear direction while maintaining discovery',
      nextSteps: ['Apply this approach step by step', 'Verify each step as you go'],
      avoidsSolution: true,
    };
  }

  private generateObservation(analysis: PuzzleAnalysis): string {
    const observations = [
      'Take a moment to examine the entire puzzle structure.',
      'Notice what information is explicitly given versus what needs to be found.',
      'Look for any symmetries or repetitions in the puzzle.',
      'Consider what constraints are limiting your moves.',
    ];
    
    return observations[Math.floor(Math.random() * observations.length)];
  }

  private generateGuidingQuestions(analysis: PuzzleAnalysis): string[] {
    return [
      'What do you know for certain?',
      'What relationships can you identify?',
      'What would happen if you made an assumption?',
    ].slice(0, 2);
  }

  private generateDirectionalGuidance(analysis: PuzzleAnalysis): string {
    if (analysis.currentProgress < 30) {
      return 'Start by focusing on the areas with the most constraints.';
    } else if (analysis.currentProgress < 70) {
      return 'You\'re making progress! Now look for implications of what you\'ve determined.';
    } else {
      return 'You\'re close! Double-check your logic and look for the final connections.';
    }
  }

  private dilutehint(hint: Hint): Hint {
    // Make hint more indirect if it's too revealing
    return {
      ...hint,
      content: this.makeMoreIndirect(hint.content),
      avoidsSolution: true,
    };
  }

  private makeMoreIndirect(content: string): string {
    // Add questioning language to make hints less direct
    return `Think about this: ${content} What might this suggest?`;
  }
}
