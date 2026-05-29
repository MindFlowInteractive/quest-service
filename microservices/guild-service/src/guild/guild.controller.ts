import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GuildService } from './guild.service';

@Controller('guilds')
export class GuildController {
  constructor(private readonly svc: GuildService) {}

  @Post()
  create(@Body('name') name: string, @Body('ownerId') ownerId: string) {
    return this.svc.create(name, ownerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findById(id); }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body('memberId') memberId: string) {
    return this.svc.addMember(id, memberId);
  }

  @Delete(':id/members/:memberId')
  removeMember(@Param('id') id: string, @Param('memberId') mid: string) {
    return this.svc.removeMember(id, mid);
  }
}
