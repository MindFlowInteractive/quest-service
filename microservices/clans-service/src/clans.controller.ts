import { Body, Controller, Get, Post } from '@nestjs/common';
import { ClansService } from './clans.service';

@Controller()
export class ClansController {
  constructor(private readonly svc: ClansService) {}

  @Post('clans')
  createClan(@Body() body: { name: string; leader: string; parentId?: string }) {
    return this.svc.createClan(body.name, body.leader, body.parentId);
  }

  @Post('clans/:id/members')
  addMember(@Body() body: { clanId: string; member: string }) {
    return { ok: this.svc.addMember(body.clanId, body.member) };
  }

  @Post('territories')
  claimTerritory(@Body() body: { clanId: string; name: string }) {
    return this.svc.claimTerritory(body.clanId, body.name);
  }

  @Post('conflicts')
  startConflict(@Body() body: { attackers: string[]; defenders: string[] }) {
    return this.svc.startConflict(body.attackers, body.defenders);
  }

  @Post('treasury/transfer')
  transfer(@Body() body: { from: string; to: string; amount: number }) {
    return { ok: this.svc.transferTreasury(body.from, body.to, body.amount) };
  }

  @Get('clans')
  list() {
    return this.svc.listClans();
  }
}
