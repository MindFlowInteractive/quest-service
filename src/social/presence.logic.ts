// Presence tracking, friend broadcasts and rich presence. Closes #474, #475, #476.
export type PresenceState = 'online' | 'idle' | 'offline';

export interface Presence {
  userId: string;
  lastSeen: number;
  appearOffline: boolean; // Privacy setting
  hideActivity: boolean;
  activity: string | null; // e.g. "Playing puzzle #42"
}

const IDLE_MS = 2 * 60_000;
const OFFLINE_MS = 5 * 60_000;

export const heartbeat = (p: Presence, now = Date.now()): Presence => ({ ...p, lastSeen: now });

// Derived from the last heartbeat, so it stays accurate within the configured windows.
export function stateOf(p: Presence, now = Date.now()): PresenceState {
  const age = now - p.lastSeen;
  return age >= OFFLINE_MS ? 'offline' : age >= IDLE_MS ? 'idle' : 'online';
}

export const setActivity = (p: Presence, activity: string | null): Presence => ({ ...p, activity });

// What a friend is allowed to see: hidden players look offline, hidden activity is never included.
export function publicView(p: Presence, now = Date.now()) {
  if (p.appearOffline) return { userId: p.userId, state: 'offline' as PresenceState, activity: null };
  return { userId: p.userId, state: stateOf(p, now), activity: p.hideActivity ? null : p.activity };
}

// Only friends receive updates.
export const recipientsFor = (userId: string, friendsOf: Map<string, string[]>) => friendsOf.get(userId) ?? [];

// Throttles rapid flips (one change per user per interval) and batches the rest into one message.
export class PresenceBatcher {
  private lastSent = new Map<string, number>();
  private pending = new Map<string, ReturnType<typeof publicView>>();

  constructor(private minIntervalMs = 5000) {}

  queue(update: ReturnType<typeof publicView>, now = Date.now()) {
    if (now - (this.lastSent.get(update.userId) ?? 0) < this.minIntervalMs) return;
    this.lastSent.set(update.userId, now);
    this.pending.set(update.userId, update);
  }

  flush() {
    const batch = [...this.pending.values()];
    this.pending.clear();
    return batch;
  }
}
