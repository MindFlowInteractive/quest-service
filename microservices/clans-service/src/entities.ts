export interface Clan {
  id: string;
  name: string;
  leader: string;
  parentId?: string;
  members: string[];
  treasury: number;
}

export interface Territory {
  id: string;
  name: string;
  ownerClanId?: string;
}

export interface Conflict {
  id: string;
  attackers: string[]; // clan ids
  defenders: string[]; // clan ids
  startedAt: number;
  resolved?: boolean;
}
