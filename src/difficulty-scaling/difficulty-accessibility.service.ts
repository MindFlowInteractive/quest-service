import { Injectable } from '@nestjs/common';

export interface AccessibilityOptions {
  extraTime?: boolean;
  unlimitedHints?: boolean;
  simplifiedPuzzles?: boolean;
  highContrastMode?: boolean;
  textToSpeech?: boolean;
}

@Injectable()
export class DifficultyAccessibilityService {
  // In production, store user preferences in DB
  private userOptions: Map<string, AccessibilityOptions> = new Map();

  /**
   * Set accessibility options for a player.
   */
  setOptions(playerId: string, options: AccessibilityOptions) {
    this.userOptions.set(playerId, options);
  }

  /**
   * Get accessibility options for a player.
   */
  getOptions(playerId: string): AccessibilityOptions {
    return this.userOptions.get(playerId) || {};
  }

  /**
   * Apply accessibility options to puzzle parameters.
   */
  applyToPuzzle(puzzle: any, options: AccessibilityOptions): any {
    const modified = { ...puzzle };
    if (options.extraTime) modified.timeLimit = Math.round((puzzle.timeLimit || 300) * 1.5);
    if (options.unlimitedHints) modified.maxHints = Infinity;
    if (options.simplifiedPuzzles) modified.simplified = true;
    // UI options (highContrastMode, textToSpeech) would be handled on frontend
    return modified;
  }
}
