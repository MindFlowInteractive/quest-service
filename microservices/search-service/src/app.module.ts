import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ElasticsearchModule, SearchModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
