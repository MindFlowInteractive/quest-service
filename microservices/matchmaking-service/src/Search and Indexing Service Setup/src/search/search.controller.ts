import { Controller, Get, Query } from "@nestjs/common";
import { SearchService } from "./search.service";
import { AnalyticsService } from "../analytics/analytics.service";
import {
  PuzzleSearchDto,
  PlayerSearchDto,
  AchievementSearchDto,
  AutocompleteDto,
} from "../common/dto/search.dto";
import { INDEX_NAMES } from "../common/constants/index.constants";

@Controller("search")
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get("puzzles")
  async searchPuzzles(@Query() searchDto: PuzzleSearchDto) {
    const startTime = Date.now();
    const result = await this.searchService.searchPuzzles(searchDto);
    const responseTime = Date.now() - startTime;

    // Track search analytics
    await this.analyticsService.trackSearch({
      query: searchDto.query || "",
      index: INDEX_NAMES.PUZZLES,
      resultsCount: result.total,
      responseTime,
      filters: searchDto.filters || {},
    });

    return result;
  }

  @Get("players")
  async searchPlayers(@Query() searchDto: PlayerSearchDto) {
    const startTime = Date.now();
    const result = await this.searchService.searchPlayers(searchDto);
    const responseTime = Date.now() - startTime;

    await this.analyticsService.trackSearch({
      query: searchDto.query || "",
      index: INDEX_NAMES.PLAYERS,
      resultsCount: result.total,
      responseTime,
      filters: searchDto.filters || {},
    });

    return result;
  }

  @Get("achievements")
  async searchAchievements(@Query() searchDto: AchievementSearchDto) {
    const startTime = Date.now();
    const result = await this.searchService.searchAchievements(searchDto);
    const responseTime = Date.now() - startTime;

    await this.analyticsService.trackSearch({
      query: searchDto.query || "",
      index: INDEX_NAMES.ACHIEVEMENTS,
      resultsCount: result.total,
      responseTime,
      filters: searchDto.filters || {},
    });

    return result;
  }

  @Get("autocomplete")
  async autocomplete(@Query() autocompleteDto: AutocompleteDto) {
    return this.searchService.autocomplete(autocompleteDto);
  }
}
