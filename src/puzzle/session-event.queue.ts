// session-event.queue.ts
import { Queue } from 'bull';
import { SessionEvent } from './session-event.entity';

const eventQueue = new Queue<SessionEvent>('session-events');

eventQueue.process(async (job) => {
  // persist event asynchronously
  await repo.save(job.data);
});
