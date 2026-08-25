import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PUZZLE_SESSION_TIMEOUT_QUEUE } from '../multiplayer.module';
import { PuzzleSessionService } from '../services/puzzle-session.service';

@Processor(PUZZLE_SESSION_TIMEOUT_QUEUE)
export class PuzzleSessionTimeoutProcessor extends WorkerHost {
  constructor(private readonly sessionService: PuzzleSessionService) {
    super();
  }

  async process(job: Job<{ sessionId: string }>) {
    if (job.name !== 'expire-session') return;
    return this.sessionService.expire(job.data.sessionId);
  }
}
