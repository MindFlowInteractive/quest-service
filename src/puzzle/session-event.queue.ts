// session-event.queue.ts
const Bull = require('bull');
import { SessionEvent } from './session-event.entity';
import { getRepository } from 'typeorm';

const eventQueue = new Bull('session-events');
const repo = getRepository(SessionEvent);

eventQueue.process(async (job: any) => {
  // persist event asynchronously
  await repo.save(job.data as SessionEvent);
});
