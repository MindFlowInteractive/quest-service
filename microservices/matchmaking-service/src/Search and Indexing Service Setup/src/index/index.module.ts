import { Module } from "@nestjs/common";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { IndexService } from "./index.service";
import { IndexController } from "./index.controller";

@Module({
  imports: [ElasticsearchModule],
  controllers: [IndexController],
  providers: [IndexService],
  exports: [IndexService],
})
export class IndexModule {}
