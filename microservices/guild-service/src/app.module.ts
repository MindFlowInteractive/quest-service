import { Module } from '@nestjs/common';
import { GuildModule } from './guild/guild.module';

@Module({ imports: [GuildModule] })
export class AppModule {}
