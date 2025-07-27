import { Injectable, Logger } from "@nestjs/common"
import type { IPuzzle, ICauseEffectEngine, CauseEffectRule, PuzzleType } from "../interfaces/puzzle.interfaces"
import type { PuzzleMove, CauseEffectResult } from "../types/puzzle.types"

@Injectable()
export class CauseEffectEngineService implements ICauseEffectEngine {
  private readonly logger = new Logger(CauseEffectEngineService.name)
  private readonly rules = new Map<string, CauseEffectRule>()
  private readonly rulesByType = new Map<PuzzleType, CauseEffectRule[]>()

  registerRule(rule: CauseEffectRule): void {
    this.rules.set(rule.id, rule)

    // Index by puzzle types
    for (const puzzleType of rule.puzzleTypes) {
      if (!this.rulesByType.has(puzzleType)) {
        this.rulesByType.set(puzzleType, [])
      }
      this.rulesByType.get(puzzleType)!.push(rule)
    }

    // Sort rules by priority
    for (const rules of this.rulesByType.values()) {
      rules.sort((a, b) => b.priority - a.priority)
    }

    this.logger.log(`Registered cause-effect rule: ${rule.name}`)
  }

  async processMove(puzzle: IPuzzle, move: PuzzleMove): Promise<CauseEffectResult[]> {
    try {
      const applicableRules = this.getApplicableRules(puzzle.type, puzzle, move)
      const effects: CauseEffectResult[] = []

      for (const rule of applicableRules) {
        try {
          const ruleEffects = await rule.effect(puzzle, move)
          effects.push(...ruleEffects)

          this.logger.debug(`Applied rule ${rule.name} to puzzle ${puzzle.id}`, {
            effectsCount: ruleEffects.length,
          })
        } catch (error) {
          this.logger.error(`Error applying rule ${rule.name}:`, error)
        }
      }

      // Process cascade effects
      if (effects.length > 0) {
        const cascadeEffects = await this.getCascadeEffects(puzzle, effects)
        effects.push(...cascadeEffects)
      }

      return effects
    } catch (error) {
      this.logger.error(`Error processing move effects for puzzle ${puzzle.id}:`, error)
      return []
    }
  }

  async simulateMove(puzzle: IPuzzle, move: PuzzleMove): Promise<CauseEffectResult[]> {
    // Create a clone of the puzzle for simulation
    const simulationPuzzle = puzzle.clone()

    try {
      return await this.processMove(simulationPuzzle, move)
    } catch (error) {
      this.logger.error(`Error simulating move effects for puzzle ${puzzle.id}:`, error)
      return []
    }
  }

  async getCascadeEffects(puzzle: IPuzzle, initialEffects: CauseEffectResult[]): Promise<CauseEffectResult[]> {
    const cascadeEffects: CauseEffectResult[] = []
    const maxCascadeDepth = 5 // Prevent infinite cascades
    let currentLevel = 1

    let effectsToProcess = [...initialEffects]

    while (effectsToProcess.length > 0 && currentLevel <= maxCascadeDepth) {
      const nextLevelEffects: CauseEffectResult[] = []

      for (const effect of effectsToProcess) {
        const cascadableRules = this.getCascadableRules(puzzle.type, effect)

        for (const rule of cascadableRules) {
          try {
            // Create a synthetic move for cascade processing
            const cascadeMove: PuzzleMove = {
              id: `cascade-${effect.effectId}-${Date.now()}`,
              timestamp: new Date(),
              playerId: "system",
              puzzleId: puzzle.id,
              moveType: "cascade",
              moveData: effect,
              isValid: true,
            }

            if (rule.condition(puzzle, cascadeMove)) {
              const ruleEffects = await rule.effect(puzzle, cascadeMove)
              const leveledEffects = ruleEffects.map((e) => ({
                ...e,
                cascadeLevel: currentLevel,
              }))

              nextLevelEffects.push(...leveledEffects)
              cascadeEffects.push(...leveledEffects)
            }
          } catch (error) {
            this.logger.error(`Error processing cascade rule ${rule.name}:`, error)
          }
        }
      }

      effectsToProcess = nextLevelEffects
      currentLevel++
    }

    if (currentLevel > maxCascadeDepth) {
      this.logger.warn(`Cascade depth limit reached for puzzle ${puzzle.id}`)
    }

    return cascadeEffects
  }

  private getApplicableRules(puzzleType: PuzzleType, puzzle: IPuzzle, move: PuzzleMove): CauseEffectRule[] {
    const typeRules = this.rulesByType.get(puzzleType) || []
    return typeRules.filter((rule) => {
      try {
        return rule.condition(puzzle, move)
      } catch (error) {
        this.logger.error(`Error evaluating rule condition ${rule.name}:`, error)
        return false
      }
    })
  }

  private getCascadableRules(puzzleType: PuzzleType, effect: CauseEffectResult): CauseEffectRule[] {
    const typeRules = this.rulesByType.get(puzzleType) || []
    return typeRules.filter((rule) => rule.cascadable)
  }

  // Built-in common rules
  registerCommonRules(): void {
    // Chain reaction rule
    this.registerRule({
      id: "chain-reaction",
      name: "Chain Reaction",
      puzzleTypes: [PuzzleType.LOGIC_GRID, PuzzleType.SPATIAL],
      condition: (puzzle, move) => {
        return move.moveData?.type === "activate" && move.moveData?.chainable === true
      },
      effect: async (puzzle, move) => {
        const effects: CauseEffectResult[] = []
        const targetElements = move.moveData?.adjacentElements || []

        for (const element of targetElements) {
          effects.push({
            effectId: `chain-${element}-${Date.now()}`,
            effectType: "activation",
            targetElements: [element],
            changes: { activated: true },
            cascadeLevel: 0,
          })
        }

        return effects
      },
      priority: 100,
      cascadable: true,
    })

    // Domino effect rule
    this.registerRule({
      id: "domino-effect",
      name: "Domino Effect",
      puzzleTypes: [PuzzleType.SEQUENCE, PuzzleType.SPATIAL],
      condition: (puzzle, move) => {
        return move.moveData?.type === "push" || move.moveData?.type === "slide"
      },
      effect: async (puzzle, move) => {
        const effects: CauseEffectResult[] = []
        const direction = move.moveData?.direction
        const startPosition = move.moveData?.position

        if (direction && startPosition) {
          // Calculate affected positions in the direction
          const affectedPositions = this.calculateDominoPath(startPosition, direction, puzzle)

          for (const position of affectedPositions) {
            effects.push({
              effectId: `domino-${position.x}-${position.y}-${Date.now()}`,
              effectType: "displacement",
              targetElements: [`element-${position.x}-${position.y}`],
              changes: { position: this.getNextPosition(position, direction) },
              cascadeLevel: 0,
            })
          }
        }

        return effects
      },
      priority: 90,
      cascadable: false,
    })

    // Constraint propagation rule
    this.registerRule({
      id: "constraint-propagation",
      name: "Constraint Propagation",
      puzzleTypes: [PuzzleType.LOGIC_GRID, PuzzleType.MATHEMATICAL],
      condition: (puzzle, move) => {
        return move.moveData?.type === "assign" && move.moveData?.value !== undefined
      },
      effect: async (puzzle, move) => {
        const effects: CauseEffectResult[] = []
        const assignedValue = move.moveData.value
        const position = move.moveData.position

        // Find related constraints
        const relatedElements = this.findConstraintRelatedElements(puzzle, position, assignedValue)

        for (const element of relatedElements) {
          effects.push({
            effectId: `constraint-${element.id}-${Date.now()}`,
            effectType: "constraint_update",
            targetElements: [element.id],
            changes: { availableValues: element.newAvailableValues },
            cascadeLevel: 0,
          })
        }

        return effects
      },
      priority: 80,
      cascadable: true,
    })
  }

  private calculateDominoPath(startPosition: any, direction: string, puzzle: IPuzzle): any[] {
    // Implementation would depend on puzzle structure
    // This is a simplified example
    const path = []
    let currentPos = { ...startPosition }

    const directionMap = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    }

    const delta = directionMap[direction as keyof typeof directionMap]
    if (!delta) return path

    // Continue until we hit a boundary or obstacle
    for (let i = 0; i < 10; i++) {
      currentPos = {
        x: currentPos.x + delta.x,
        y: currentPos.y + delta.y,
      }

      // Check if position is valid (would depend on puzzle implementation)
      if (this.isValidPosition(puzzle, currentPos)) {
        path.push({ ...currentPos })
      } else {
        break
      }
    }

    return path
  }

  private getNextPosition(position: any, direction: string): any {
    const directionMap = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    }

    const delta = directionMap[direction as keyof typeof directionMap]
    if (!delta) return position

    return {
      x: position.x + delta.x,
      y: position.y + delta.y,
    }
  }

  private findConstraintRelatedElements(puzzle: IPuzzle, position: any, value: any): any[] {
    // This would be implemented based on specific puzzle logic
    // For now, return empty array
    return []
  }

  private isValidPosition(puzzle: IPuzzle, position: any): boolean {
    // This would be implemented based on puzzle boundaries
    // For now, assume positions within 0-9 range are valid
    return position.x >= 0 && position.x < 10 && position.y >= 0 && position.y < 10
  }
}
