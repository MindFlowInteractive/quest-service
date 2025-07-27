import { Controller } from "@nestjs/common"
import type { SaveLoadService } from "../services/save-load.service"
import type { ProgressionService } from "../services/progression.service"
import type { StateManagementService } from "../services/state-management.service"

@Controller("game-state")
export class GameStateController {
  constructor(
    private readonly saveLoadService: SaveLoadService,
    private readonly progressionService: ProgressionService,
    private readonly stateManagement: StateManagementService,
  ) {}

  saveGame(playerId: string, saveOptions: { includeHistory?: boolean } = {}) {
    return this.saveLoadService.saveGame(playerId, saveOptions.includeHistory)
  }

  loadGame(playerId: string, loadData?: any) {
    return this.saveLoadService.loadGame(playerId, loadData)
  }

  exportGameData(playerId: string, format: "json" | "binary" = "json") {
    return this.saveLoadService.exportGameData(playerId, format)
  }

  importGameData(playerId: string, importData: { data: string | Buffer; format?: "json" | "binary" }) {
    return this.saveLoadService.importGameData(playerId, importData.data, importData.format)
  }

  createCheckpoint(playerId: string, checkpointData: { name: string }) {
    this.saveLoadService.createCheckpoint(playerId, checkpointData.name)
    return { success: true }
  }

  listCheckpoints(playerId: string) {
    return this.saveLoadService.listCheckpoints(playerId)
  }

  loadCheckpoint(playerId: string, checkpointName: string) {
    return this.saveLoadService.loadCheckpoint(playerId, checkpointName)
  }

  deleteCheckpoint(playerId: string, checkpointName: string) {
    this.saveLoadService.deleteCheckpoint(playerId, checkpointName)
    return { success: true }
  }

  getPlayerProgress(playerId: string) {
    return this.progressionService.getPlayerProgress(playerId)
  }

  getPlayerStats(playerId: string) {
    return this.stateManagement.getPlayerStats(playerId)
  }

  getProgressionPath(playerId: string) {
    return this.progressionService.getProgressionPath(playerId)
  }
}
