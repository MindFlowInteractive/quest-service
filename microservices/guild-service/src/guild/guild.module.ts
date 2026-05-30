import { Module } from '@nestjs/common';
import { GuildController } from './guild.controller';
import { GuildService } from './guild.service';

@Module({ controllers: [GuildController], providers: [GuildService] })
export class GuildModule {}
