import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { CreateIndexDto } from '../dto/create-index.dto';

@Injectable()
export class ElasticsearchService {
  constructor(@Inject('ELASTIC_CLIENT') private readonly client: Client) {}

  async indexDocument(dto: CreateIndexDto) {
    const index = dto.type === 'puzzle' ? 'puzzles' : 'players';
    return this.client.index({
      index,
      body: dto.data,
      refresh: true,
    });
  }

  async search(index: string, query: any) {
    return this.client.search({
      index,
      body: query,
    });
  }

  async suggest(index: string, suggester: any) {
    return this.client.search({
      index,
      body: {
        suggest: suggester,
      },
    });
  }

  async trackAnalytics(event: any) {
    // simple implementation: store in a dedicated index
    return this.client.index({
      index: 'search-analytics',
      body: event,
      refresh: true,
    });
  }
}
