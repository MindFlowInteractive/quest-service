import { Controller, Get, Post, Param, Body } from "@nestjs/common"
import type { PuzzleEngineService } from "../services/puzzle-engine.service"
import type { HintSystemService } from "../services/hint-system.service"
import type { DifficultyScalingService } from "../services/difficulty-scaling.service"
import { PuzzleType, PuzzleMove, DifficultyLevel } from "../types/puzzle.types"

@Controller("puzzles")
export class PuzzleController {
  constructor(
    private readonly puzzleEngine: PuzzleEngineService,
    private readonly hintSystem: HintSystemService,
    private readonly difficultyScaling: DifficultyScalingService,
  ) { }

  @Post()
  async createPuzzle(
    @Body() createPuzzleDto: {
      type: PuzzleType
      playerId: string
      difficulty?: string
      config?: any
    },
  ) {
    const difficulty = DifficultyLevel[createPuzzleDto.difficulty?.toUpperCase() as keyof typeof DifficultyLevel] || DifficultyLevel.MEDIUM
    return this.puzzleEngine.createPuzzle(
      createPuzzleDto.type,
      createPuzzleDto.playerId,
      difficulty,
      createPuzzleDto.config,
    )
  }

  @Get(":puzzleId/player/:playerId")
  async getPuzzle(@Param("puzzleId") puzzleId: string, @Param("playerId") playerId: string) {
    return this.puzzleEngine.loadPuzzle(puzzleId, playerId)
  }

  @Get(":puzzleId/player/:playerId/state")
  async getPuzzleState(@Param("puzzleId") puzzleId: string, @Param("playerId") playerId: string) {
    return this.puzzleEngine.getPuzzleState(puzzleId, playerId)
  }

  @Post(":puzzleId/player/:playerId/moves")
  async makeMove(@Param("puzzleId") puzzleId: string, @Param("playerId") playerId: string, @Body() move: PuzzleMove) {
    return this.puzzleEngine.makeMove(puzzleId, playerId, move)
  }

  @Post(":puzzleId/player/:playerId/reset")
  async resetPuzzle(@Param("puzzleId") puzzleId: string, @Param("playerId") playerId: string) {
    await this.puzzleEngine.resetPuzzle(puzzleId, playerId)
    return { success: true }
  }

  @Post(":puzzleId/player/:playerId/abandon")
  async abandonPuzzle(@Param("puzzleId") puzzleId: string, @Param("playerId") playerId: string) {
    await this.puzzleEngine.abandonPuzzle(puzzleId, playerId)
    return { success: true }
  }

  @Get("player/:playerId/active")
  async getActivePuzzles(@Param("playerId") playerId: string) {
    return this.puzzleEngine.getActivePuzzles(playerId)
  }

  @Post(":puzzleId/player/:playerId/hints")
  async getHint(
    @Param("puzzleId") puzzleId: string,
    @Param("playerId") playerId: string,
    @Body() hintRequest: { level: number; context?: any },
  ) {
    const puzzle = await this.puzzleEngine.loadPuzzle(puzzleId, playerId)
    return this.hintSystem.generateHint(puzzle, hintRequest.level, hintRequest.context)
  }

  @Get(":puzzleId/player/:playerId/hints")
  async getAvailableHints(@Param("puzzleId") puzzleId: string, @Param("playerId") playerId: string) {
    const puzzle = await this.puzzleEngine.loadPuzzle(puzzleId, playerId)
    return this.hintSystem.getAvailableHints(puzzle)
  }

  @Post(":puzzleId/player/:playerId/clone")
  async clonePuzzle(
    @Param("puzzleId") puzzleId: string,
    @Param("playerId") playerId: string,
    @Body() cloneRequest: { newPlayerId: string },
  ) {
    return this.puzzleEngine.clonePuzzle(puzzleId, playerId, cloneRequest.newPlayerId)
  }
}
