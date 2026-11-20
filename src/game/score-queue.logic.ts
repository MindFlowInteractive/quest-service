// Score submission queue with idempotency keys and exponential backoff. Closes #477.
export interface ScoreSubmission {
  idempotencyKey: string;
  userId: string;
  puzzleId: string;
  score: number;
  attempts: number;
  nextAttemptAt: number;
  status: 'pending' | 'confirmed';
}

export const backoffMs = (attempts: number, baseMs = 1000, maxMs = 5 * 60_000) =>
  Math.min(baseMs * 2 ** Math.max(attempts - 1, 0), maxMs);

export class ScoreQueue {
  // Keyed by idempotency key, so duplicates are stored once. Persist this map (e.g. in the DB) in production.
  private items = new Map<string, ScoreSubmission>();

  submit(input: Pick<ScoreSubmission, 'idempotencyKey' | 'userId' | 'puzzleId' | 'score'>, now = Date.now()): ScoreSubmission {
    const existing = this.items.get(input.idempotencyKey);
    if (existing) return existing;
    const item: ScoreSubmission = { ...input, attempts: 0, nextAttemptAt: now, status: 'pending' };
    this.items.set(item.idempotencyKey, item);
    return item;
  }

  due(now = Date.now()): ScoreSubmission[] {
    return [...this.items.values()].filter((i) => i.status === 'pending' && i.nextAttemptAt <= now);
  }

  // Runs `write` for each due item; failures are kept and rescheduled, so no accepted score is lost.
  async process(write: (s: ScoreSubmission) => Promise<void>, now = Date.now()) {
    for (const item of this.due(now)) {
      try {
        await write(item);
        item.status = 'confirmed';
      } catch {
        item.attempts += 1;
        item.nextAttemptAt = now + backoffMs(item.attempts);
      }
    }
  }
}
