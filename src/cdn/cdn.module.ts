import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import cdnConfig from './config/cdn.config';
import { CdnController } from './cdn.controller';
import { CdnService } from './cdn.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(cdnConfig)],
  controllers: [CdnController],
  providers: [CdnService],
  exports: [CdnService],
})
export class CdnModule {}
