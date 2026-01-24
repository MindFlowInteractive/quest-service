import { Injectable, Logger, Inject } from "@nestjs/common"
import { ConfigType } from "@nestjs/config"
import type { IPuzzle, IPuzzleValidator } from "../interfaces/puzzle.interfaces"
import type { PuzzleMove, ValidationResult, ValidationError, PuzzleType } from "../types/puzzle.types"
import { gameEngineConfig } from "../config/game-engine.config"

@Injectable()
export class ValidationService implements IPuzzleValidator {
  private readonly logger = new Logger(ValidationService.name)
  private readonly validators = new Map<PuzzleType, IPuzzleValidator>()

  constructor(@Inject(gameEngineConfig.KEY) private readonly config: any) { }

  registerValidator(puzzleType: PuzzleType, validator: IPuzzleValidator): void {
    this.validators.set(puzzleType, validator)
    this.logger.log(`Registered validator for puzzle type: ${puzzleType}`)
  }

  async validateMove(puzzle: IPuzzle, move: PuzzleMove): Promise<ValidationResult> {
    try {
      const validator = this.validators.get(puzzle.type)
      if (validator) {
        return await validator.validateMove(puzzle, move)
      }

      // Default validation logic
      return await this.defaultValidateMove(puzzle, move)
    } catch (error) {
      this.logger.error(`Validation error for puzzle ${puzzle.id}:`, error)
      return {
        isValid: false,
        isComplete: false,
        score: 0,
        errors: [
          {
            type: "validation_error",
            message: "Failed to validate move",
            severity: "high",
          },
        ],
        completionPercentage: 0,
      }
    }
  }

  async validateSolution(puzzle: IPuzzle, solution: any): Promise<ValidationResult> {
    try {
      const validator = this.validators.get(puzzle.type)
      if (validator) {
        return await validator.validateSolution(puzzle, solution)
      }

      // Default solution validation
      return await this.defaultValidateSolution(puzzle, solution)
    } catch (error) {
      this.logger.error(`Solution validation error for puzzle ${puzzle.id}:`, error)
      return {
        isValid: false,
        isComplete: false,
        score: 0,
        errors: [
          {
            type: "solution_error",
            message: "Failed to validate solution",
            severity: "high",
          },
        ],
        completionPercentage: 0,
      }
    }
  }

  checkConstraints(puzzle: IPuzzle, state: any): boolean {
    try {
      const validator = this.validators.get(puzzle.type)
      if (validator) {
        return validator.checkConstraints(puzzle, state)
      }

      // Default constraint checking
      return this.defaultCheckConstraints(puzzle, state)
    } catch (error) {
      this.logger.error(`Constraint check error for puzzle ${puzzle.id}:`, error)
      return false
    }
  }

  private async defaultValidateMove(puzzle: IPuzzle, move: PuzzleMove): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    let score = 0
    let isValid = true

    // Basic move validation
    if (!move.moveData) {
      errors.push({
        type: "invalid_move_data",
        message: "Move data is required",
        severity: "high",
      })
      isValid = false
    }

    // Check if puzzle is in valid state for moves
    const currentState = puzzle.getState()
    if (!currentState) {
      errors.push({
        type: "invalid_puzzle_state",
        message: "Puzzle is not in a valid state for moves",
        severity: "high",
      })
      isValid = false
    }

    // Time limit validation
    if (puzzle.timeLimit) {
      const timeSpent = Date.now() - new Date(currentState.startTime).getTime()
      if (timeSpent > puzzle.timeLimit) {
        errors.push({
          type: "time_limit_exceeded",
          message: "Time limit exceeded",
          severity: "high",
        })
        isValid = false
      }
    }

    // Move limit validation
    if (puzzle.maxMoves && currentState.moves.length >= puzzle.maxMoves) {
      errors.push({
        type: "move_limit_exceeded",
        message: "Maximum moves exceeded",
        severity: "high",
      })
      isValid = false
    }

    if (isValid) {
      score = this.calculateMoveScore(puzzle, move)
    }

    const completionPercentage = this.calculateCompletionPercentage(puzzle)

    return {
      isValid,
      isComplete: puzzle.isComplete(),
      score,
      errors,
      completionPercentage,
      timeBonus: this.calculateTimeBonus(puzzle),
      perfectSolution: this.isPerfectSolution(puzzle),
    }
  }

  private async defaultValidateSolution(puzzle: IPuzzle, solution: any): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    let isValid = true
    let score = 0

    // Check if solution matches expected format
    if (!solution || typeof solution !== "object") {
      errors.push({
        type: "invalid_solution_format",
        message: "Solution must be a valid object",
        severity: "high",
      })
      isValid = false
    }

    if (isValid) {
      // Calculate solution score
      score = this.calculateSolutionScore(puzzle, solution)

      // Check if solution is complete
      const isComplete = this.isSolutionComplete(puzzle, solution)
      if (!isComplete && !this.config.validation.allowPartialSolutions) {
        errors.push({
          type: "incomplete_solution",
          message: "Solution is not complete",
          severity: "medium",
        })
        isValid = this.config.validation.allowPartialSolutions
      }
    }

    return {
      isValid,
      isComplete: isValid && this.isSolutionComplete(puzzle, solution),
      score,
      errors,
      completionPercentage: this.calculateCompletionPercentage(puzzle),
      perfectSolution: this.isPerfectSolution(puzzle),
    }
  }

  private defaultCheckConstraints(puzzle: IPuzzle, state: any): boolean {
    // Basic constraint checking
    if (!state || typeof state !== "object") {
      return false
    }

    // Check required fields
    const requiredFields = ["puzzleId", "playerId", "status"]
    for (const field of requiredFields) {
      if (!(field in state)) {
        return false
      }
    }

    return true
  }

  private calculateMoveScore(puzzle: IPuzzle, move: PuzzleMove): number {
    // Base score for valid move
    let score = 10

    // Bonus for efficient moves
    const currentState = puzzle.getState()
    if (currentState.moves.length < (puzzle.maxMoves || Number.POSITIVE_INFINITY) * 0.5) {
      score += 5
    }

    // Penalty for hints used
    if (currentState.hintsUsed > 0) {
      score -= currentState.hintsUsed * 2
    }

    return Math.max(0, score)
  }

  private calculateSolutionScore(puzzle: IPuzzle, solution: any): number {
    let baseScore = 100

    // Difficulty multiplier
    baseScore *= puzzle.difficulty

    // Time bonus
    const timeBonus = this.calculateTimeBonus(puzzle)
    if (timeBonus) {
      baseScore += timeBonus
    }

    // Perfect solution bonus
    if (this.isPerfectSolution(puzzle)) {
      baseScore *= this.config.progression.perfectSolutionBonus
    }

    return Math.round(baseScore)
  }

  private calculateTimeBonus(puzzle: IPuzzle): number | undefined {
    if (!puzzle.timeLimit) return undefined

    const currentState = puzzle.getState()
    const timeSpent = Date.now() - new Date(currentState.startTime).getTime()
    const timeRemaining = puzzle.timeLimit - timeSpent

    if (timeRemaining > 0) {
      return Math.round((timeRemaining / puzzle.timeLimit) * 50)
    }

    return 0
  }

  private calculateCompletionPercentage(puzzle: IPuzzle): number {
    // This would be implemented based on puzzle-specific logic
    // For now, return a basic calculation
    if (puzzle.isComplete()) {
      return 100
    }

    const currentState = puzzle.getState()
    if (!currentState.moves || currentState.moves.length === 0) {
      return 0
    }

    // Estimate based on moves made vs expected moves
    const expectedMoves = puzzle.maxMoves || 20
    return Math.min(95, (currentState.moves.length / expectedMoves) * 100)
  }

  private isSolutionComplete(puzzle: IPuzzle, solution: any): boolean {
    // This would be implemented based on puzzle-specific logic
    return puzzle.isComplete()
  }

  private isPerfectSolution(puzzle: IPuzzle): boolean {
    const currentState = puzzle.getState()
    return (
      puzzle.isComplete() &&
      currentState.hintsUsed === 0 &&
      (!puzzle.maxMoves || currentState.moves.length <= puzzle.maxMoves)
    )
  }
}
