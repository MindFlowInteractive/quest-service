import { Injectable } from '@nestjs/common';
import { Clan, Territory, Conflict } from './entities';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClansService {
  private clans = new Map<string, Clan>();
  private territories = new Map<string, Territory>();
  private conflicts = new Map<string, Conflict>();

  createClan(name: string, leader: string, parentId?: string): Clan {
    const id = uuidv4();
    const clan: Clan = { id, name, leader, parentId, members: [leader], treasury: 0 };
    this.clans.set(id, clan);
    return clan;
  }

  addMember(clanId: string, member: string): boolean {
    const c = this.clans.get(clanId);
    if (!c) return false;
    if (!c.members.includes(member)) c.members.push(member);
    this.clans.set(clanId, c);
    return true;
  }

  claimTerritory(clanId: string, territoryName: string): Territory {
    const id = uuidv4();
    const t: Territory = { id, name: territoryName, ownerClanId: clanId };
    this.territories.set(id, t);
    return t;
  }

  startConflict(attackers: string[], defenders: string[]): Conflict {
    const id = uuidv4();
    const c: Conflict = { id, attackers, defenders, startedAt: Date.now(), resolved: false };
    this.conflicts.set(id, c);
    return c;
  }

  transferTreasury(fromClanId: string, toClanId: string, amount: number): boolean {
    const a = this.clans.get(fromClanId);
    const b = this.clans.get(toClanId);
    if (!a || !b || amount <= 0 || a.treasury < amount) return false;
    a.treasury -= amount;
    b.treasury += amount;
    this.clans.set(a.id, a);
    this.clans.set(b.id, b);
    return true;
  }

  listClans(): Clan[] {
    return Array.from(this.clans.values());
  }
}
