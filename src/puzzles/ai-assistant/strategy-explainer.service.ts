import { Injectable } from '@nestjs/common';
import { PuzzleAnalysis, Strategy } from './interfaces/puzzle-analysis.interface';

@Injectable()
export class StrategyExplainerService {
  private strategyDatabase: Map<string, Strategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  async identifyApplicableStrategies(
    puzzleState: any,
    patterns: string[],
    playerProfile: any
  ): Promise<Strategy[]> {
    const applicableStrategies: Strategy[] = [];

    for (const [name, strategy] of this.strategyDatabase) {
      const score = this.calculateApplicability(strategy, puzzleState, patterns);
      
      if (score > 0.3 && this.meetsPrerequisites(strategy, playerProfile)) {
        applicableStrategies.push({
          ...strategy,
          applicability: score,
        });
      }
    }

    // Sort by applicability and cognitive load
    return applicableStrategies.sort((a, b) => {
      if (a.applicability !== b.applicability) {
        return b.applicability - a.applicability;
      }
      return this.getCognitiveLoadScore(a.cognitiveLoad) - 
             this.getCognitiveLoadScore(b.cognitiveLoad);
    });
  }

  explainThinkingProcess(analysis: PuzzleAnalysis, specificStep?: string): any {
    const explanation = {
      overview: this.generateOverview(analysis),
      thinkingSteps: this.generateThinkingSteps(analysis),
      keyQuestions: this.generateKeyQuestions(analysis),
      strategicApproach: this.describeStrategicApproach(analysis),
      commonPitfalls: this.identifyCommonPitfalls(analysis),
    };

    if (specificStep) {
      explanation['detailedStep'] = this.explainSpecificStep(specificStep, analysis);
    }

    return explanation;
  }

  private initializeStrategies() {
    // Initialize common puzzle-solving strategies
    this.strategyDatabase.set('elimination', {
      name: 'Process of Elimination',
      description: 'Remove impossible options to narrow down solutions',
      applicability: 0,
      prerequisites: ['basic_logic'],
      cognitiveLoad: 'low',
    });

    this.strategyDatabase.set('pattern_recognition', {
      name: 'Pattern Recognition',
      description: 'Identify repeating structures or relationships',
      applicability: 0,
      prerequisites: ['observation'],
      cognitiveLoad: 'medium',
    });

    this.strategyDatabase.set('working_backwards', {
      name: 'Working Backwards',
      description: 'Start from the goal and work towards the current state',
      applicability: 0,
      prerequisites: ['basic_logic', 'goal_analysis'],
      cognitiveLoad: 'medium',
    });

    this.strategyDatabase.set('constraint_propagation', {
      name: 'Constraint Propagation',
      description: 'Apply constraints systematically to reduce possibilities',
      applicability: 0,
      prerequisites: ['elimination', 'logical_reasoning'],
      cognitiveLoad: 'high',
    });

    this.strategyDatabase.set('divide_conquer', {
      name: 'Divide and Conquer',
      description: 'Break the puzzle into smaller, manageable parts',
      applicability: 0,
      prerequisites: ['problem_decomposition'],
      cognitiveLoad: 'medium',
    });
  }

  private calculateApplicability(
    strategy: Strategy,
    puzzleState: any,
    patterns: string[]
  ): number {
    let score = 0;

    // Strategy-specific applicability logic
    switch (strategy.name) {
      case 'Process of Elimination':
        score = this.hasMultipleChoices(puzzleState) ? 0.8 : 0.2;
        break;
      case 'Pattern Recognition':
        score = patterns.length > 0 ? 0.9 : 0.3;
        break;
      case 'Working Backwards':
        score = this.hasClearGoal(puzzleState) ? 0.7 : 0.2;
        break;
      // Add more cases
    }

    return score;
  }

  private meetsPrerequisites(strategy: Strategy, playerProfile: any): boolean {
    if (!playerProfile || !playerProfile.masteredStrategies) {
      return strategy.prerequisites.length === 0;
    }

    return strategy.prerequisites.every(prereq =>
      playerProfile.masteredStrategies.includes(prereq)
    );
  }

  private getCognitiveLoadScore(load: string): number {
    const scores = { low: 1, medium: 2, high: 3 };
    return scores[load] || 2;
  }

  private generateOverview(analysis: PuzzleAnalysis): string {
    return `This ${analysis.puzzleType} puzzle has a difficulty of ${analysis.difficulty}/10. ` +
           `You've made ${analysis.currentProgress}% progress. ` +
           `The key is to focus on ${analysis.identifiedPatterns.join(', ')} patterns.`;
  }

  private generateThinkingSteps(analysis: PuzzleAnalysis): string[] {
    const steps = [
      'First, observe what information is given and what is unknown',
      'Look for patterns or relationships in the puzzle structure',
      'Consider what constraints or rules apply',
    ];

    if (analysis.suggestedStrategies.length > 0) {
      steps.push(
        `Try applying the ${analysis.suggestedStrategies[0].name} strategy`
      );
    }

    steps.push('Test your hypotheses and adjust based on what works');

    return steps;
  }

  private generateKeyQuestions(analysis: PuzzleAnalysis): string[] {
    return [
      'What patterns do you notice in the puzzle?',
      'What constraints limit your possible moves?',
      'What happens if you assume a particular solution?',
      'Can you break this into smaller problems?',
    ];
  }

  private describeStrategicApproach(analysis: PuzzleAnalysis): string {
    if (analysis.suggestedStrategies.length === 0) {
      return 'Start by carefully observing the puzzle structure.';
    }

    const topStrategy = analysis.suggestedStrategies[0];
    return `Consider using ${topStrategy.name}: ${topStrategy.description}`;
  }

  private identifyCommonPitfalls(analysis: PuzzleAnalysis): string[] {
    const pitfalls = [
      'Don\'t rush to guess without analyzing the puzzle',
      'Avoid focusing too narrowly on one approach',
    ];

    if (analysis.playerMisconceptions) {
      pitfalls.push(...analysis.playerMisconceptions.map(m => `Watch out: ${m}`));
    }

    return pitfalls;
  }

  private explainSpecificStep(step: string, analysis: PuzzleAnalysis): any {
    return {
      step,
      reasoning: 'Detailed reasoning for this specific step',
      alternatives: ['Alternative approach 1', 'Alternative approach 2'],
      learningPoint: 'Key concept this step teaches',
    };
  }

  private hasMultipleChoices(state: any): boolean {
    return true; // Implement based on puzzle structure
  }

  private hasClearGoal(state: any): boolean {
    return true; // Implement based on puzzle structure
  }
}
