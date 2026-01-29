import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { SearchModule } from "./search/search.module";
import { IndexModule } from "./index/index.module";
import { AnalyticsModule } from "./analytics/analytics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ElasticsearchModule.registerAsync({
      useFactory: () => ({
        node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
        maxRetries: parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || "3"),
        requestTimeout: parseInt(
          process.env.ELASTICSEARCH_REQUEST_TIMEOUT || "60000",
        ),
      }),
    }),
    SearchModule,
    IndexModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
