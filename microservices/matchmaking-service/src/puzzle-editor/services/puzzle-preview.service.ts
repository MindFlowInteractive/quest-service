/**
 * Puzzle Preview Service
 * Handles puzzle simulation, testing, and preview functionality
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  PreviewSession,
  PreviewConfig,
  ReplayFrame,
  PerformanceMetrics,
  EditorComponent,
  ComponentConnection,
} from '../interfaces/editor.interfaces';
import { IPuzzle, PuzzleGameState } from '../../game-engine/interfaces/puzzle.interfaces';

@Injectable()
export class PuzzlePreviewService {
  private readonly logger = new Logger(PuzzlePreviewService.name);
  private activeSessions = new Map<string, PreviewSession>();

  /**
   * Start a preview session
   */
  async startPreviewSession(
    editorId: string,
    components: EditorComponent[],
    connections: ComponentConnection[],
    config?: Partial<PreviewConfig>,
  ): Promise<PreviewSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: PreviewSession = {
      id: sessionId,
      puzzleEditorId: editorId,
      startTime: new Date(),
      currentState: this.buildInitialState(components, connections),
      moves: [],
      breakpointHits: [],
      performance: {
        avgCompletionTime: 0,
        minCompletionTime: Infinity,
        maxCompletionTime: 0,
        successRate: 0,
        averageAttempts: 0,
        commonMistakes: [],
      },
      recordedReplay: [],
    };

    this.activeSessions.set(sessionId, session);

    this.logger.log(`Started preview session: ${sessionId} for editor: ${editorId}`);

    return session;
  }

  /**
   * Get active preview session
   */
  async getPreviewSession(sessionId: string): Promise<PreviewSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new BadRequestException(`Preview session ${sessionId} not found`);
    }
    return session;
  }

  /**
   * Record a move in preview session
   */
  async recordMove(
    sessionId: string,
    action: string,
    details: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<PreviewSession> {
    const session = await this.getPreviewSession(sessionId);

    // Create replay frame
    const frame: ReplayFrame = {
      timestamp: Date.now() - session.startTime.getTime(),
      state: JSON.parse(JSON.stringify(session.currentState)),
      action,
      metadata: metadata || {},
    };

    // Record move
    const move = {
      id: `move_${session.moves.length}`,
      timestamp: new Date(),
      action,
      details,
      metadata,
    };

    session.moves.push(move);

    // Update state based on action
    this.processMove(session.currentState, action, details);

    // Record replay
    session.recordedReplay.push(frame);

    // Check for win condition
    const isWon = this.checkWinCondition(session.currentState);

    // Update performance metrics if completed
    if (isWon) {
      const completionTime = Date.now() - session.startTime.getTime();
      session.performance.avgCompletionTime = completionTime;
      session.performance.minCompletionTime = Math.min(
        session.performance.minCompletionTime,
        completionTime,
      );
      session.performance.maxCompletionTime = Math.max(
        session.performance.maxCompletionTime,
        completionTime,
      );
      session.performance.successRate = 100;
      session.performance.averageAttempts = session.moves.length;
    }

    return session;
  }

  /**
   * Undo last move
   */
  async undoMove(sessionId: string): Promise<PreviewSession> {
    const session = await this.getPreviewSession(sessionId);

    if (session.moves.length === 0) {
      throw new BadRequestException('No moves to undo');
    }

    // Remove last move
    session.moves.pop();

    // Rebuild state from moves
    session.currentState = this.buildInitialState([], []);
    for (const move of session.moves) {
      this.processMove(session.currentState, move.action, move.details);
    }

    // Remove last replay frame
    if (session.recordedReplay.length > 0) {
      session.recordedReplay.pop();
    }

    return session;
  }

  /**
   * Reset preview to initial state
   */
  async resetPreview(sessionId: string): Promise<PreviewSession> {
    const session = await this.getPreviewSession(sessionId);

    session.currentState = this.buildInitialState([], []);
    session.moves = [];
    session.recordedReplay = [];

    return session;
  }

  /**
   * Replay puzzle from recording
   */
  async replaySession(
    sessionId: string,
    speed: number = 1.0,
  ): Promise<{
    frames: ReplayFrame[];
    totalDuration: number;
    finalState: any;
  }> {
    const session = await this.getPreviewSession(sessionId);

    const frames = session.recordedReplay.map((frame) => ({
      ...frame,
      timestamp: frame.timestamp / speed,
    }));

    const totalDuration = Math.max(...frames.map((f) => f.timestamp), 0);

    return {
      frames,
      totalDuration,
      finalState: session.currentState,
    };
  }

  /**
   * End preview session
   */
  async endPreviewSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);
    this.logger.log(`Ended preview session: ${sessionId}`);
  }

  /**
   * Test puzzle with multiple attempts
   */
  async testPuzzle(
    components: EditorComponent[],
    connections: ComponentConnection[],
    testConfig?: {
      attempts?: number;
      maxTimePerAttempt?: number;
      recordMetrics?: boolean;
    },
  ): Promise<{
    successRate: number;
    avgCompletionTime: number;
    avgAttempts: number;
    commonFailures: string[];
    suggestedImprovements: string[];
  }> {
    const config = {
      attempts: testConfig?.attempts || 5,
      maxTimePerAttempt: testConfig?.maxTimePerAttempt || 5000,
      recordMetrics: testConfig?.recordMetrics || true,
    };

    const results = {
      successes: 0,
      failures: 0,
      totalTime: 0,
      totalAttempts: 0,
      failureReasons: new Map<string, number>(),
      completionTimes: [] as number[],
    };

    // Simulate multiple test attempts
    for (let attempt = 0; attempt < config.attempts; attempt++) {
      const session = await this.startPreviewSession(
        'test',
        components,
        connections,
        { simulationSpeed: 1.0, autoPlay: false },
      );

      const startTime = Date.now();
      let success = false;

      // Simple test: try to reach win condition within time limit
      while (Date.now() - startTime < config.maxTimePerAttempt && !success) {
        // Simulate random moves (in real scenario, this would be AI solving)
        const randomAction = this.generateRandomAction(components, session.currentState);
        if (randomAction) {
          await this.recordMove(session.id, randomAction.type, randomAction.details);
          success = this.checkWinCondition(session.currentState);
        } else {
          break;
        }
      }

      const completionTime = Date.now() - startTime;

      if (success) {
        results.successes++;
        results.completionTimes.push(completionTime);
        results.totalTime += completionTime;
      } else {
        results.failures++;
        const reason = this.analyzeFailure(session.currentState, components);
        results.failureReasons.set(reason, (results.failureReasons.get(reason) || 0) + 1);
      }

      results.totalAttempts += session.moves.length;
      await this.endPreviewSession(session.id);
    }

    // Calculate aggregate metrics
    const successRate = (results.successes / config.attempts) * 100;
    const avgCompletionTime =
      results.successes > 0 ? results.totalTime / results.successes : 0;
    const avgAttempts = results.totalAttempts / config.attempts;

    // Get most common failures
    const commonFailures = Array.from(results.failureReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((e) => e[0]);

    // Generate suggestions
    const suggestions = this.generateImprovementSuggestions(
      successRate,
      avgCompletionTime,
      avgAttempts,
      commonFailures,
    );

    this.logger.log(
      `Test puzzle completed: success rate ${successRate.toFixed(2)}%, avg time ${avgCompletionTime.toFixed(0)}ms`,
    );

    return {
      successRate,
      avgCompletionTime,
      avgAttempts,
      commonFailures,
      suggestedImprovements: suggestions,
    };
  }

  /**
   * Build initial puzzle state
   */
  private buildInitialState(components: EditorComponent[], connections: ComponentConnection[]): any {
    return {
      components: components.map((c) => ({
        id: c.id,
        type: c.type,
        state: 'initial',
        value: null,
        metadata: c.properties,
      })),
      connections: connections.map((c) => ({
        id: c.id,
        source: c.sourceComponentId,
        target: c.targetComponentId,
        active: true,
      })),
      history: [],
      score: 0,
      moves: 0,
    };
  }

  /**
   * Process a move in the puzzle
   */
  private processMove(state: any, action: string, details: Record<string, any>): void {
    state.moves++;

    const [componentId, actionType] = action.split(':');

    const component = state.components.find((c: any) => c.id === componentId);
    if (component) {
      switch (actionType) {
        case 'setValue':
          component.value = details.value;
          component.state = 'updated';
          break;

        case 'toggle':
          component.value = !component.value;
          component.state = 'toggled';
          break;

        case 'click':
          component.state = 'clicked';
          break;

        case 'select':
          component.value = details.selection;
          component.state = 'selected';
          break;
      }
    }

    // Update score based on action
    if (details.isCorrect) {
      state.score += details.points || 10;
    } else if (details.isWrong) {
      state.score = Math.max(0, state.score - (details.penalty || 5));
    }

    state.history.push({
      timestamp: Date.now(),
      action,
      details,
    });
  }

  /**
   * Check if puzzle win condition is met
   */
  private checkWinCondition(state: any): boolean {
    // Check if all required components are in correct state
    const allCorrect = state.components.every((c: any) => {
      return c.state === 'correct' || c.value !== null;
    });

    return allCorrect && state.moves > 0;
  }

  /**
   * Generate random action for testing
   */
  private generateRandomAction(
    components: EditorComponent[],
    state: any,
  ): { type: string; details: Record<string, any> } | null {
    const inputComponents = components.filter(
      (c) =>
        c.type === 'BUTTON' ||
        c.type === 'TEXT_INPUT' ||
        c.type === 'RADIO_GROUP' ||
        c.type === 'DROPDOWN' ||
        c.type === 'GRID_CELL',
    );

    if (inputComponents.length === 0) {
      return null;
    }

    const randomComponent = inputComponents[Math.floor(Math.random() * inputComponents.length)];
    const actionType = this.selectRandomActionType(randomComponent.type);

    return {
      type: `${randomComponent.id}:${actionType}`,
      details: this.generateActionDetails(randomComponent, actionType),
    };
  }

  /**
   * Select random action type based on component
   */
  private selectRandomActionType(componentType: string): string {
    const actionMap: Record<string, string[]> = {
      BUTTON: ['click'],
      TEXT_INPUT: ['setValue'],
      RADIO_GROUP: ['select'],
      DROPDOWN: ['select'],
      GRID_CELL: ['toggle'],
    };

    const actions = actionMap[componentType] || ['click'];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  /**
   * Generate random action details
   */
  private generateActionDetails(component: EditorComponent, actionType: string): Record<string, any> {
    switch (actionType) {
      case 'setValue':
        return { value: Math.random().toString(36).substring(7) };

      case 'select':
        return { selection: component.properties.options?.[0] || 'option1' };

      case 'toggle':
        return { isCorrect: Math.random() > 0.5, points: 10 };

      default:
        return { isCorrect: Math.random() > 0.5, points: 10 };
    }
  }

  /**
   * Analyze failure reason
   */
  private analyzeFailure(state: any, components: EditorComponent[]): string {
    if (!state.components || state.components.length === 0) {
      return 'No components found';
    }

    const incorrectComponents = state.components.filter((c: any) => c.state !== 'correct');
    if (incorrectComponents.length > 0) {
      return `Incorrect component: ${incorrectComponents[0].id}`;
    }

    if (state.moves === 0) {
      return 'No moves made';
    }

    return 'Puzzle not solved';
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(
    successRate: number,
    avgCompletionTime: number,
    avgAttempts: number,
    commonFailures: string[],
  ): string[] {
    const suggestions: string[] = [];

    if (successRate < 50) {
      suggestions.push('Puzzle is too difficult - consider adding hints or simplifying');
    }

    if (successRate > 90) {
      suggestions.push('Puzzle may be too easy - consider increasing difficulty');
    }

    if (avgCompletionTime > 300000) {
      // 5 minutes
      suggestions.push('Puzzle takes too long to solve - simplify or add time limits');
    }

    if (avgAttempts > 5) {
      suggestions.push('Players need many attempts - add more guidance or clearer instructions');
    }

    if (commonFailures.length > 0) {
      suggestions.push(
        `Common failure: "${commonFailures[0]}" - add tutorial or validation for this`,
      );
    }

    return suggestions;
  }
}
