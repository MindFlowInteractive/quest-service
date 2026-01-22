import { Injectable, Logger } from "@nestjs/common"
import type { ConfigType } from "@nestjs/config"
import type { IPuzzle, IHintSystem } from "../interfaces/puzzle.interfaces"
import type { PuzzleHint } from "../types/puzzle.types"
import type { gameEngineConfig } from "../config/game-engine.config"
import { PuzzleType } from "../types/puzzle.types" // Declaration of PuzzleType

export interface HintGenerator {
  puzzleType: PuzzleType
  generateHint(puzzle: IPuzzle, level: number, context?: any): Promise<PuzzleHint>
  getMaxHintLevel(puzzle: IPuzzle): number
}

@Injectable()
export class HintSystemService implements IHintSystem {
  private readonly logger = new Logger(HintSystemService.name)
  private readonly hintGenerators = new Map<PuzzleType, HintGenerator>()
  private readonly playerHintUsage = new Map<string, { count: number; lastUsed: Date }>()

  constructor(private readonly config: any) {
    this.initializeDefaultHintGenerators()
  }

  registerHintGenerator(generator: HintGenerator): void {
    this.hintGenerators.set(generator.puzzleType, generator)
    this.logger.log(`Registered hint generator for puzzle type: ${generator.puzzleType}`)
  }

  async generateHint(puzzle: IPuzzle, level: number, context?: any): Promise<PuzzleHint> {
    try {
      // Check if player can use hints
      const canUseHint = await this.canPlayerUseHint(puzzle.getState().playerId)
      if (!canUseHint) {
        throw new Error("Hint usage limit exceeded or cooldown active")
      }

      const generator = this.hintGenerators.get(puzzle.type)
      if (!generator) {
        return this.generateGenericHint(puzzle, level)
      }

      const maxLevel = generator.getMaxHintLevel(puzzle)
      const clampedLevel = Math.min(Math.max(level, 1), maxLevel)

      const hint = await generator.generateHint(puzzle, clampedLevel, context)

      // Track hint usage
      this.trackHintUsage(puzzle.getState().playerId)

      this.logger.debug(`Generated hint for puzzle ${puzzle.id}`, {
        level: clampedLevel,
        type: hint.type,
        revealPercentage: hint.revealPercentage,
      })

      return hint
    } catch (error) {
      this.logger.error(`Error generating hint for puzzle ${puzzle.id}:`, error)
      throw error
    }
  }

  async getAvailableHints(puzzle: IPuzzle): Promise<PuzzleHint[]> {
    const generator = this.hintGenerators.get(puzzle.type)
    if (!generator) {
      return []
    }

    const maxLevel = generator.getMaxHintLevel(puzzle)
    const hints: PuzzleHint[] = []

    for (let level = 1; level <= maxLevel; level++) {
      try {
        const hint = await generator.generateHint(puzzle, level)
        hints.push(hint)
      } catch (error) {
        this.logger.warn(`Failed to generate hint level ${level} for puzzle ${puzzle.id}`)
      }
    }

    return hints
  }

  async applyHint(puzzle: IPuzzle, hint: PuzzleHint): Promise<void> {
    try {
      const currentState = puzzle.getState()

      // Apply hint effects based on type
      switch (hint.type) {
        case "visual":
          await this.applyVisualHint(puzzle, hint)
          break
        case "textual":
          await this.applyTextualHint(puzzle, hint)
          break
        case "interactive":
          await this.applyInteractiveHint(puzzle, hint)
          break
      }

      // Update puzzle state to reflect hint usage
      currentState.hintsUsed += 1
      currentState.metadata.lastHint = {
        hintId: hint.id,
        timestamp: new Date(),
        level: hint.level,
      }

      await puzzle.setState(currentState)

      this.logger.debug(`Applied hint ${hint.id} to puzzle ${puzzle.id}`)
    } catch (error) {
      this.logger.error(`Error applying hint ${hint.id} to puzzle ${puzzle.id}:`, error)
      throw error
    }
  }

  calculateHintPenalty(hint: PuzzleHint): number {
    const basePenalty = this.config.hints.hintPenalty
    const levelMultiplier = 1 + (hint.level - 1) * 0.1 // Increase penalty for higher level hints
    const revealMultiplier = 1 + hint.revealPercentage * 0.5 // More penalty for more revealing hints

    return Math.round(basePenalty * levelMultiplier * revealMultiplier * 100)
  }

  private async canPlayerUseHint(playerId: string): Promise<boolean> {
    const usage = this.playerHintUsage.get(playerId)
    const now = new Date()

    if (!usage) {
      return true
    }

    // Check cooldown
    const timeSinceLastHint = now.getTime() - usage.lastUsed.getTime()
    if (timeSinceLastHint < this.config.hints.cooldownPeriod) {
      return false
    }

    // Check session limit (reset daily)
    const isNewDay = now.getDate() !== usage.lastUsed.getDate()
    if (isNewDay) {
      usage.count = 0
    }

    return usage.count < this.config.hints.maxHintsPerSession
  }

  private trackHintUsage(playerId: string): void {
    const now = new Date()
    const usage = this.playerHintUsage.get(playerId) || { count: 0, lastUsed: now }

    usage.count += 1
    usage.lastUsed = now

    this.playerHintUsage.set(playerId, usage)
  }

  private async generateGenericHint(puzzle: IPuzzle, level: number): Promise<PuzzleHint> {
    const hintMessages = [
      "Look for patterns in the puzzle elements",
      "Consider the relationships between different parts",
      "Try working backwards from the goal",
      "Focus on the constraints and rules",
      "Break the problem into smaller parts",
    ]

    return {
      id: `generic-${puzzle.id}-${level}-${Date.now()}`,
      level,
      type: "textual",
      content: hintMessages[Math.min(level - 1, hintMessages.length - 1)],
      revealPercentage: level * 0.1,
    }
  }

  private async applyVisualHint(puzzle: IPuzzle, hint: PuzzleHint): Promise<void> {
    // Visual hints would highlight elements or show visual cues
    const currentState = puzzle.getState()

    if (!currentState.metadata.visualHints) {
      currentState.metadata.visualHints = []
    }

    currentState.metadata.visualHints.push({
      hintId: hint.id,
      targetElements: hint.targetElements || [],
      highlightType: "glow",
      duration: 10000, // 10 seconds
    })
  }

  private async applyTextualHint(puzzle: IPuzzle, hint: PuzzleHint): Promise<void> {
    // Textual hints add guidance messages
    const currentState = puzzle.getState()

    if (!currentState.metadata.textualHints) {
      currentState.metadata.textualHints = []
    }

    currentState.metadata.textualHints.push({
      hintId: hint.id,
      message: hint.content,
      timestamp: new Date(),
    })
  }

  private async applyInteractiveHint(puzzle: IPuzzle, hint: PuzzleHint): Promise<void> {
    // Interactive hints might temporarily enable certain actions or show possible moves
    const currentState = puzzle.getState()

    if (!currentState.metadata.interactiveHints) {
      currentState.metadata.interactiveHints = []
    }

    currentState.metadata.interactiveHints.push({
      hintId: hint.id,
      enabledActions: hint.targetElements || [],
      duration: 30000, // 30 seconds
    })
  }

  private initializeDefaultHintGenerators(): void {
    // Logic Grid hint generator
    this.registerHintGenerator({
      puzzleType: PuzzleType.LOGIC_GRID,
      generateHint: async (puzzle, level) => {
        const hintContent = this.getLogicGridHintContent(level)
        return {
          id: `logic-grid-${puzzle.id}-${level}-${Date.now()}`,
          level,
          type: level <= 2 ? "textual" : "visual",
          content: hintContent,
          revealPercentage: level * 0.15,
        }
      },
      getMaxHintLevel: () => 4,
    })

    // Sequence hint generator
    this.registerHintGenerator({
      puzzleType: PuzzleType.SEQUENCE,
      generateHint: async (puzzle, level) => {
        const hintContent = this.getSequenceHintContent(level)
        return {
          id: `sequence-${puzzle.id}-${level}-${Date.now()}`,
          level,
          type: level === 1 ? "textual" : "interactive",
          content: hintContent,
          revealPercentage: level * 0.2,
        }
      },
      getMaxHintLevel: () => 3,
    })

    // Pattern Matching hint generator
    this.registerHintGenerator({
      puzzleType: PuzzleType.PATTERN_MATCHING,
      generateHint: async (puzzle, level) => {
        const hintContent = this.getPatternMatchingHintContent(level)
        return {
          id: `pattern-${puzzle.id}-${level}-${Date.now()}`,
          level,
          type: "visual",
          content: hintContent,
          revealPercentage: level * 0.25,
        }
      },
      getMaxHintLevel: () => 3,
    })

    this.logger.log("Initialized default hint generators")
  }

  private getLogicGridHintContent(level: number): string {
    const hints = [
      "Start by looking for cells that can only have one possible value",
      "Use the process of elimination to narrow down possibilities",
      "Look for rows or columns that are almost complete",
      "Focus on the intersections of constraints",
    ]
    return hints[Math.min(level - 1, hints.length - 1)]
  }

  private getSequenceHintContent(level: number): string {
    const hints = [
      "Look for repeating patterns in the sequence",
      "Try to identify the mathematical relationship between consecutive elements",
      "Consider if the sequence follows a specific rule or formula",
    ]
    return hints[Math.min(level - 1, hints.length - 1)]
  }

  private getPatternMatchingHintContent(level: number): string {
    const hints = [
      "Compare the shapes and colors systematically",
      "Look for symmetries or rotational patterns",
      "Focus on the differences between similar patterns",
    ]
    return hints[Math.min(level - 1, hints.length - 1)]
  }
}
