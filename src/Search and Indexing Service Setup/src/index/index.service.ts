import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import {
  INDEX_NAMES,
  INDEX_MAPPINGS,
  INDEX_SETTINGS,
} from "../common/constants/index.constants";
import {
  Puzzle,
  Player,
  Achievement,
  IndexingResult,
} from "../common/interfaces/search.interface";

@Injectable()
export class IndexService implements OnModuleInit {
  private readonly logger = new Logger(IndexService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService & Record<string, any>) {}

  async onModuleInit() {
    await this.initializeIndices();
  }

  async initializeIndices(): Promise<void> {
    this.logger.log("Initializing Elasticsearch indices...");

    for (const [key, indexName] of Object.entries(INDEX_NAMES)) {
      try {
        const exists = await this.elasticsearchService.indices.exists({
          index: indexName,
        });

        if (!exists) {
          await this.createIndex(indexName, INDEX_MAPPINGS[key]);
          this.logger.log(`Created index: ${indexName}`);
        } else {
          this.logger.log(`Index already exists: ${indexName}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to initialize index ${indexName}:`,
          error.message,
        );
      }
    }
  }

  async createIndex(indexName: string, mappings: any): Promise<void> {
    await this.elasticsearchService.indices.create({
      index: indexName,
      body: {
        settings: INDEX_SETTINGS,
        mappings,
      },
    });
  }

  async deleteIndex(indexName: string): Promise<void> {
    const exists = await this.elasticsearchService.indices.exists({
      index: indexName,
    });

    if (exists) {
      await this.elasticsearchService.indices.delete({
        index: indexName,
      });
      this.logger.log(`Deleted index: ${indexName}`);
    }
  }

  async indexPuzzle(puzzle: Puzzle): Promise<void> {
    await this.elasticsearchService.index({
      index: INDEX_NAMES.PUZZLES,
      id: puzzle.id,
      document: puzzle,
      refresh: true,
    });
    this.logger.debug(`Indexed puzzle: ${puzzle.id}`);
  }

  async indexPuzzles(puzzles: Puzzle[]): Promise<IndexingResult> {
    const result: IndexingResult = {
      success: true,
      indexed: 0,
      failed: 0,
      errors: [],
    };

    const operations = puzzles.flatMap((puzzle) => [
      { index: { _index: INDEX_NAMES.PUZZLES, _id: puzzle.id } },
      puzzle,
    ]);

    try {
      const bulkResponse = await this.elasticsearchService.bulk({
        refresh: true,
        operations,
      });

      if (bulkResponse.errors) {
        bulkResponse.items.forEach((item: any) => {
          if (item.index?.error) {
            result.failed++;
            result.errors.push(item.index.error.reason);
          } else {
            result.indexed++;
          }
        });
        result.success = result.failed === 0;
      } else {
        result.indexed = puzzles.length;
      }

      this.logger.log(
        `Bulk indexed ${result.indexed} puzzles, ${result.failed} failed`,
      );
    } catch (error) {
      result.success = false;
      result.failed = puzzles.length;
      result.errors = [error.message];
      this.logger.error("Bulk indexing failed:", error.message);
    }

    return result;
  }

  async indexPlayer(player: Player): Promise<void> {
    await this.elasticsearchService.index({
      index: INDEX_NAMES.PLAYERS,
      id: player.id,
      document: player,
      refresh: true,
    });
    this.logger.debug(`Indexed player: ${player.id}`);
  }

  async indexPlayers(players: Player[]): Promise<IndexingResult> {
    const result: IndexingResult = {
      success: true,
      indexed: 0,
      failed: 0,
      errors: [],
    };

    const operations = players.flatMap((player) => [
      { index: { _index: INDEX_NAMES.PLAYERS, _id: player.id } },
      player,
    ]);

    try {
      const bulkResponse = await this.elasticsearchService.bulk({
        refresh: true,
        operations,
      });

      if (bulkResponse.errors) {
        bulkResponse.items.forEach((item: any) => {
          if (item.index?.error) {
            result.failed++;
            result.errors.push(item.index.error.reason);
          } else {
            result.indexed++;
          }
        });
        result.success = result.failed === 0;
      } else {
        result.indexed = players.length;
      }

      this.logger.log(
        `Bulk indexed ${result.indexed} players, ${result.failed} failed`,
      );
    } catch (error) {
      result.success = false;
      result.failed = players.length;
      result.errors = [error.message];
      this.logger.error("Bulk indexing failed:", error.message);
    }

    return result;
  }

  async indexAchievement(achievement: Achievement): Promise<void> {
    await this.elasticsearchService.index({
      index: INDEX_NAMES.ACHIEVEMENTS,
      id: achievement.id,
      document: achievement,
      refresh: true,
    });
    this.logger.debug(`Indexed achievement: ${achievement.id}`);
  }

  async indexAchievements(
    achievements: Achievement[],
  ): Promise<IndexingResult> {
    const result: IndexingResult = {
      success: true,
      indexed: 0,
      failed: 0,
      errors: [],
    };

    const operations = achievements.flatMap((achievement) => [
      { index: { _index: INDEX_NAMES.ACHIEVEMENTS, _id: achievement.id } },
      achievement,
    ]);

    try {
      const bulkResponse = await this.elasticsearchService.bulk({
        refresh: true,
        operations,
      });

      if (bulkResponse.errors) {
        bulkResponse.items.forEach((item: any) => {
          if (item.index?.error) {
            result.failed++;
            result.errors.push(item.index.error.reason);
          } else {
            result.indexed++;
          }
        });
        result.success = result.failed === 0;
      } else {
        result.indexed = achievements.length;
      }

      this.logger.log(
        `Bulk indexed ${result.indexed} achievements, ${result.failed} failed`,
      );
    } catch (error) {
      result.success = false;
      result.failed = achievements.length;
      result.errors = [error.message];
      this.logger.error("Bulk indexing failed:", error.message);
    }

    return result;
  }

  async updateDocument(
    index: string,
    id: string,
    document: Partial<any>,
  ): Promise<void> {
    await this.elasticsearchService.update({
      index,
      id,
      doc: document,
      refresh: true,
    });
    this.logger.debug(`Updated document ${id} in ${index}`);
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    await this.elasticsearchService.delete({
      index,
      id,
      refresh: true,
    });
    this.logger.debug(`Deleted document ${id} from ${index}`);
  }

  async reindexAll(indexName: string): Promise<void> {
    await this.deleteIndex(indexName);

    const key = Object.keys(INDEX_NAMES).find(
      (k) => INDEX_NAMES[k] === indexName,
    );

    if (key) {
      await this.createIndex(indexName, INDEX_MAPPINGS[key]);
      this.logger.log(`Reindexed: ${indexName}`);
    }
  }
}
