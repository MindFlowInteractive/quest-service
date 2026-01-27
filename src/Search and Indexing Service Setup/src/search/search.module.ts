import { Module } from "@nestjs/common";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller";
import { AnalyticsModule } from "../analytics/analytics.module";

@Module({
  imports: [ElasticsearchModule, AnalyticsModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
