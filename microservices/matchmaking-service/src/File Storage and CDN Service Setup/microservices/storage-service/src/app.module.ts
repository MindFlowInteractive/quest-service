import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StorageModule } from "./storage.module";
import { File, Upload, Metadata } from "./entities";
import databaseConfig from "./config/database.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get("database"),
        entities: [File, Upload, Metadata],
      }),
      inject: [ConfigService],
    }),
    StorageModule,
  ],
})
export class AppModule {}
