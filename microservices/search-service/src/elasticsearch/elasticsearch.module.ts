import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Module({
  providers: [
    {
      provide: 'ELASTIC_CLIENT',
      useFactory: (configService: ConfigService) => {
        const node = configService.get<string>('ELASTIC_HOST') || 'http://localhost:9200';
        const username = configService.get<string>('ELASTIC_USERNAME');
        const password = configService.get<string>('ELASTIC_PASSWORD');
        const auth = username && password ? { username, password } : undefined;
        return new Client({ node, auth });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['ELASTIC_CLIENT'],
})
export class ElasticsearchModule {}
