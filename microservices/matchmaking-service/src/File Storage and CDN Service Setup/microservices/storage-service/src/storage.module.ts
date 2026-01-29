import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { File, Upload, Metadata } from "./entities";
import { StorageController } from "./controllers/storage.controller";
import { HealthController } from "./controllers/health.controller";
import {
  StorageService,
  S3Service,
  ImageOptimizationService,
  FileValidationService,
} from "./services";
import storageConfig from "./config/storage.config";

@Module({
  imports: [
    ConfigModule.forFeature(storageConfig),
    TypeOrmModule.forFeature([File, Upload, Metadata]),
  ],
  controllers: [StorageController, HealthController],
  providers: [
    StorageService,
    S3Service,
    ImageOptimizationService,
    FileValidationService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
