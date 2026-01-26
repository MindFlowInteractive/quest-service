import { Injectable, Logger } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { INDEX_NAMES } from "../common/constants/index.constants";
import {
  SearchResult,
  SearchHit,
  AutocompleteResult,
  Puzzle,
  Player,
  Achievement,
} from "../common/interfaces/search.interface";
import {
  SearchDto,
  PuzzleSearchDto,
  PlayerSearchDto,
  AchievementSearchDto,
  AutocompleteDto,
} from "../common/dto/search.dto";

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async searchPuzzles(
    searchDto: PuzzleSearchDto,
  ): Promise<SearchResult<Puzzle>> {
    const {
      query,
      page = 1,
      size = 20,
      sort,
      order = "desc",
      filters,
    } = searchDto;
    const from = (page - 1) * size;

    const must: any[] = [];
    const filter: any[] = [];

    // Full-text search with relevance scoring
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ["title^3", "description^2", "category", "tags"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    // Filters
    if (searchDto.difficulty) {
      filter.push({ term: { difficulty: searchDto.difficulty } });
    }

    if (searchDto.category) {
      filter.push({ term: { category: searchDto.category } });
    }

    if (
      searchDto.minRating !== undefined ||
      searchDto.maxRating !== undefined
    ) {
      const range: any = {};
      if (searchDto.minRating !== undefined) range.gte = searchDto.minRating;
      if (searchDto.maxRating !== undefined) range.lte = searchDto.maxRating;
      filter.push({ range: { rating: range } });
    }

    filter.push({ term: { isActive: true } });

    // Additional dynamic filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filter.push({ terms: { [key]: value } });
        } else {
          filter.push({ term: { [key]: value } });
        }
      });
    }

    const body: any = {
      from,
      size,
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
      highlight: {
        fields: {
          title: {},
          description: {},
        },
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"],
      },
      aggs: {
        difficulties: {
          terms: { field: "difficulty", size: 10 },
        },
        categories: {
          terms: { field: "category", size: 20 },
        },
        rating_ranges: {
          range: {
            field: "rating",
            ranges: [
              { to: 2 },
              { from: 2, to: 3 },
              { from: 3, to: 4 },
              { from: 4 },
            ],
          },
        },
      },
    };

    // Sorting
    if (sort) {
      body.sort = [{ [sort]: { order } }];
    } else if (query) {
      body.sort = [{ _score: { order: "desc" } }];
    } else {
      body.sort = [{ createdAt: { order: "desc" } }];
    }

    try {
      const startTime = Date.now();
      const response = await this.elasticsearchService.search({
        index: INDEX_NAMES.PUZZLES,
        body,
      });
      const took = Date.now() - startTime;

      return this.formatSearchResponse<Puzzle>(response, took);
    } catch (error) {
      this.logger.error("Search failed:", error.message);
      throw error;
    }
  }

  async searchPlayers(
    searchDto: PlayerSearchDto,
  ): Promise<SearchResult<Player>> {
    const {
      query,
      page = 1,
      size = 20,
      sort,
      order = "desc",
      filters,
    } = searchDto;
    const from = (page - 1) * size;

    const must: any[] = [];
    const filter: any[] = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ["username^3", "displayName^2", "bio"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    if (searchDto.minLevel !== undefined || searchDto.maxLevel !== undefined) {
      const range: any = {};
      if (searchDto.minLevel !== undefined) range.gte = searchDto.minLevel;
      if (searchDto.maxLevel !== undefined) range.lte = searchDto.maxLevel;
      filter.push({ range: { level: range } });
    }

    filter.push({ term: { isActive: true } });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filter.push({ terms: { [key]: value } });
        } else {
          filter.push({ term: { [key]: value } });
        }
      });
    }

    const body: any = {
      from,
      size,
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
      highlight: {
        fields: {
          username: {},
          displayName: {},
          bio: {},
        },
      },
      aggs: {
        level_ranges: {
          range: {
            field: "level",
            ranges: [
              { to: 10 },
              { from: 10, to: 25 },
              { from: 25, to: 50 },
              { from: 50 },
            ],
          },
        },
      },
    };

    if (sort) {
      body.sort = [{ [sort]: { order } }];
    } else if (query) {
      body.sort = [{ _score: { order: "desc" } }];
    } else {
      body.sort = [{ totalScore: { order: "desc" } }];
    }

    try {
      const startTime = Date.now();
      const response = await this.elasticsearchService.search({
        index: INDEX_NAMES.PLAYERS,
        body,
      });
      const took = Date.now() - startTime;

      return this.formatSearchResponse<Player>(response, took);
    } catch (error) {
      this.logger.error("Search failed:", error.message);
      throw error;
    }
  }

  async searchAchievements(
    searchDto: AchievementSearchDto,
  ): Promise<SearchResult<Achievement>> {
    const {
      query,
      page = 1,
      size = 20,
      sort,
      order = "desc",
      filters,
    } = searchDto;
    const from = (page - 1) * size;

    const must: any[] = [];
    const filter: any[] = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ["title^3", "description^2", "category"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    if (searchDto.rarity) {
      filter.push({ term: { rarity: searchDto.rarity } });
    }

    if (searchDto.category) {
      filter.push({ term: { category: searchDto.category } });
    }

    filter.push({ term: { isActive: true } });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filter.push({ terms: { [key]: value } });
        } else {
          filter.push({ term: { [key]: value } });
        }
      });
    }

    const body: any = {
      from,
      size,
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
      highlight: {
        fields: {
          title: {},
          description: {},
        },
      },
      aggs: {
        rarities: {
          terms: { field: "rarity", size: 10 },
        },
        categories: {
          terms: { field: "category", size: 20 },
        },
      },
    };

    if (sort) {
      body.sort = [{ [sort]: { order } }];
    } else if (query) {
      body.sort = [{ _score: { order: "desc" } }];
    } else {
      body.sort = [{ points: { order: "desc" } }];
    }

    try {
      const startTime = Date.now();
      const response = await this.elasticsearchService.search({
        index: INDEX_NAMES.ACHIEVEMENTS,
        body,
      });
      const took = Date.now() - startTime;

      return this.formatSearchResponse<Achievement>(response, took);
    } catch (error) {
      this.logger.error("Search failed:", error.message);
      throw error;
    }
  }

  async autocomplete(
    autocompleteDto: AutocompleteDto,
  ): Promise<AutocompleteResult[]> {
    const { query, size = 10, type } = autocompleteDto;

    if (!query || query.length < 2) {
      return [];
    }

    const indices = type
      ? [INDEX_NAMES[type.toUpperCase()]]
      : [INDEX_NAMES.PUZZLES, INDEX_NAMES.PLAYERS, INDEX_NAMES.ACHIEVEMENTS];

    const searches = indices.map((index) => ({
      index,
      body: {
        suggest: {
          autocomplete: {
            prefix: query,
            completion: {
              field: this.getCompletionField(index),
              size,
              skip_duplicates: true,
              fuzzy: {
                fuzziness: "AUTO",
              },
            },
          },
        },
      },
    }));

    try {
      const results: AutocompleteResult[] = [];

      for (const search of searches) {
        const response = await this.elasticsearchService.search(search);
        const suggestions = response.suggest?.autocomplete?.[0]?.options || [];

        suggestions.forEach((option: any) => {
          results.push({
            text: option.text,
            score: option._score,
            category: this.getIndexCategory(search.index),
          });
        });
      }

      return results.sort((a, b) => b.score - a.score).slice(0, size);
    } catch (error) {
      this.logger.error("Autocomplete failed:", error.message);
      return [];
    }
  }

  private formatSearchResponse<T>(
    response: any,
    took: number,
  ): SearchResult<T> {
    const hits: SearchHit<T>[] = response.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      source: hit._source,
      highlight: hit.highlight,
    }));

    return {
      hits,
      total: response.hits.total.value,
      took,
      aggregations: response.aggregations,
    };
  }

  private getCompletionField(index: string): string {
    if (index === INDEX_NAMES.PUZZLES) return "title.completion";
    if (index === INDEX_NAMES.PLAYERS) return "username.completion";
    if (index === INDEX_NAMES.ACHIEVEMENTS) return "title.completion";
    return "title.completion";
  }

  private getIndexCategory(index: string): string {
    if (index === INDEX_NAMES.PUZZLES) return "puzzle";
    if (index === INDEX_NAMES.PLAYERS) return "player";
    if (index === INDEX_NAMES.ACHIEVEMENTS) return "achievement";
    return "unknown";
  }
}
