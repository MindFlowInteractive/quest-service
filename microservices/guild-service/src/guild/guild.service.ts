import { Injectable, NotFoundException } from '@nestjs/common';

export interface Guild { id: string; name: string; ownerId: string; memberIds: string[]; }

@Injectable()
export class GuildService {
  private readonly guilds: Guild[] = [];

  create(name: string, ownerId: string): Guild {
    const g: Guild = { id: Date.now().toString(), name, ownerId, memberIds: [ownerId] };
    this.guilds.push(g);
    return g;
  }

  findById(id: string): Guild {
    const g = this.guilds.find((x) => x.id === id);
    if (!g) throw new NotFoundException(`Guild ${id} not found`);
    return g;
  }

  addMember(guildId: string, memberId: string): Guild {
    const g = this.findById(guildId);
    if (!g.memberIds.includes(memberId)) g.memberIds.push(memberId);
    return g;
  }

  removeMember(guildId: string, memberId: string): Guild {
    const g = this.findById(guildId);
    g.memberIds = g.memberIds.filter((id) => id !== memberId);
    return g;
  }
}
