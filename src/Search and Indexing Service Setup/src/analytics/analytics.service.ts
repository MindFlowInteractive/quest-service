import { Injectable, Logger } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { INDEX_NAMES } from "../common/constants/index.constants";
import { randomUUID } from "crypto";

interface SearchEvent {
  query: string;
  index: string;
  resultsCount: number;
  responseTime: number;
  filters: Record<string, any>;
  userId?: string;
  clickedResults?: string[];
}

interface AnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  index?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService & Record<string, any>) {}

  async trackSearch(event: SearchEvent): Promise<void> {
    try {
      const document = {
        id: randomUUID(),
        ...event,
        timestamp: new Date(),
      };

      await this.elasticsearchService.index({
        index: INDEX_NAMES.ANALYTICS,
        document,
      });

      this.logger.debug(`Tracked search: ${event.query} in ${event.index}`);
    } catch (error) {
      this.logger.error("Failed to track search:", error.message);
    }
  }

  async trackClick(searchId: string, resultId: string): Promise<void> {
    try {
      await this.elasticsearchService.update({
        index: INDEX_NAMES.ANALYTICS,
        id: searchId,
        body: {
          script: {
            source:
              "if (ctx._source.clickedResults == null) { ctx._source.clickedResults = [] } ctx._source.clickedResults.add(params.resultId)",
            params: { resultId },
          },
        },
      });

      this.logger.debug(`Tracked click: ${resultId}`);
    } catch (error) {
      this.logger.error("Failed to track click:", error.message);
    }
  }

  async getPopularQueries(query: AnalyticsQuery): Promise<any> {
    const must: any[] = [];

    if (query.startDate || query.endDate) {
      const range: any = {};
      if (query.startDate) range.gte = query.startDate;
      if (query.endDate) range.lte = query.endDate;
      must.push({ range: { timestamp: range } });
    }

    if (query.index) {
      must.push({ term: { index: query.index } });
    }

    try {
      const response = await this.elasticsearchService.search({
        index: INDEX_NAMES.ANALYTICS,
        body: {
          size: 0,
          query: {
            bool: {
              must: must.length > 0 ? must : [{ match_all: {} }],
            },
          },
          aggs: {
            popular_queries: {
              terms: {
                field: "query.keyword",
                size: 100,
                order: { _count: "desc" },
              },
              aggs: {
                avg_results: {
                  avg: { field: "resultsCount" },
                },
                avg_response_time: {
                  avg: { field: "responseTime" },
                },
              },
            },
          },
        },
      });

      return (response.aggregations.popular_queries as any).buckets.map(
        (bucket: any) => ({
          query: bucket.key,
          count: bucket.doc_count,
          avgResults: Math.round(bucket.avg_results.value),
          avgResponseTime: Math.round(bucket.avg_response_time.value),
        }),
      );
    } catch (error) {
      this.logger.error("Failed to get popular queries:", error.message);
      return [];
    }
  }

  async getSearchMetrics(query: AnalyticsQuery): Promise<any> {
    const must: any[] = [];

    if (query.startDate || query.endDate) {
      const range: any = {};
      if (query.startDate) range.gte = query.startDate;
      if (query.endDate) range.lte = query.endDate;
      must.push({ range: { timestamp: range } });
    }

    if (query.index) {
      must.push({ term: { index: query.index } });
    }

    try {
      const response = await this.elasticsearchService.search({
        index: INDEX_NAMES.ANALYTICS,
        body: {
          size: 0,
          query: {
            bool: {
              must: must.length > 0 ? must : [{ match_all: {} }],
            },
          },
          aggs: {
            total_searches: {
              value_count: { field: "query.keyword" },
            },
            avg_results: {
              avg: { field: "resultsCount" },
            },
            avg_response_time: {
              avg: { field: "responseTime" },
            },
            zero_results: {
              filter: {
                term: { resultsCount: 0 },
              },
            },
            searches_over_time: {
              date_histogram: {
                field: "timestamp",
                calendar_interval: "day",
              },
            },
            by_index: {
              terms: {
                field: "index",
                size: 10,
              },
            },
          },
        },
      });

      const aggs = response.aggregations as any;

      return {
        totalSearches: aggs.total_searches.value,
        avgResults: Math.round(aggs.avg_results.value || 0),
        avgResponseTime: Math.round(aggs.avg_response_time.value || 0),
        zeroResultsCount: aggs.zero_results.doc_count,
        zeroResultsRate:
          aggs.total_searches.value > 0
            ? (aggs.zero_results.doc_count / aggs.total_searches.value) * 100
            : 0,
        searchesOverTime: aggs.searches_over_time.buckets.map(
          (bucket: any) => ({
            date: bucket.key_as_string,
            count: bucket.doc_count,
          }),
        ),
        byIndex: aggs.by_index.buckets.map((bucket: any) => ({
          index: bucket.key,
          count: bucket.doc_count,
        })),
      };
    } catch (error) {
      this.logger.error("Failed to get search metrics:", error.message);
      return null;
    }
  }

  async getFailedSearches(query: AnalyticsQuery): Promise<any> {
    const must: any[] = [{ term: { resultsCount: 0 } }];

    if (query.startDate || query.endDate) {
      const range: any = {};
      if (query.startDate) range.gte = query.startDate;
      if (query.endDate) range.lte = query.endDate;
      must.push({ range: { timestamp: range } });
    }

    if (query.index) {
      must.push({ term: { index: query.index } });
    }

    try {
      const response = await this.elasticsearchService.search({
        index: INDEX_NAMES.ANALYTICS,
        body: {
          size: 0,
          query: {
            bool: { must },
          },
          aggs: {
            failed_queries: {
              terms: {
                field: "query.keyword",
                size: 50,
                order: { _count: "desc" },
              },
            },
          },
        },
      });

      return (response.aggregations.failed_queries as any).buckets.map(
        (bucket: any) => ({
          query: bucket.key,
          count: bucket.doc_count,
        }),
      );
    } catch (error) {
      this.logger.error("Failed to get failed searches:", error.message);
      return [];
    }
  }
}
