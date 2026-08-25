import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PUZZLE_SESSION_TIMEOUT_QUEUE } from '../multiplayer.module';

@Injectable()
export class PuzzleSessionTimeoutService {
  constructor(
    @InjectQueue(PUZZLE_SESSION_TIMEOUT_QUEUE)
    private readonly queue: Queue,
  ) {}

  async schedule(sessionId: string, delayMs: number) {
    return this.queue.add(
      'expire-session',
      { sessionId },
      {
        delay: Math.max(0, delayMs),
        jobId: `puzzle-session-timeout:${sessionId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  async cancel(sessionId: string) {
    const job = await this.queue.getJob(`puzzle-session-timeout:${sessionId}`);
    if (job) await job.remove();
  }
}
