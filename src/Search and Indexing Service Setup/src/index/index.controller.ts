import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { IndexService } from "./index.service";
import {
  Puzzle,
  Player,
  Achievement,
} from "../common/interfaces/search.interface";

@Controller("index")
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  @Post("puzzles")
  @HttpCode(HttpStatus.CREATED)
  async indexPuzzle(@Body() puzzle: Puzzle) {
    await this.indexService.indexPuzzle(puzzle);
    return { success: true, message: "Puzzle indexed successfully" };
  }

  @Post("puzzles/bulk")
  @HttpCode(HttpStatus.CREATED)
  async indexPuzzles(@Body() puzzles: Puzzle[]) {
    const result = await this.indexService.indexPuzzles(puzzles);
    return result;
  }

  @Post("players")
  @HttpCode(HttpStatus.CREATED)
  async indexPlayer(@Body() player: Player) {
    await this.indexService.indexPlayer(player);
    return { success: true, message: "Player indexed successfully" };
  }

  @Post("players/bulk")
  @HttpCode(HttpStatus.CREATED)
  async indexPlayers(@Body() players: Player[]) {
    const result = await this.indexService.indexPlayers(players);
    return result;
  }

  @Post("achievements")
  @HttpCode(HttpStatus.CREATED)
  async indexAchievement(@Body() achievement: Achievement) {
    await this.indexService.indexAchievement(achievement);
    return { success: true, message: "Achievement indexed successfully" };
  }

  @Post("achievements/bulk")
  @HttpCode(HttpStatus.CREATED)
  async indexAchievements(@Body() achievements: Achievement[]) {
    const result = await this.indexService.indexAchievements(achievements);
    return result;
  }

  @Delete(":index/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param("index") index: string, @Param("id") id: string) {
    await this.indexService.deleteDocument(index, id);
  }

  @Post("reindex/:index")
  @HttpCode(HttpStatus.OK)
  async reindex(@Param("index") index: string) {
    await this.indexService.reindexAll(index);
    return { success: true, message: `Index ${index} reindexed successfully` };
  }
}
