import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MetricsService } from '../metrics/metrics.service';

@Processor('event-processing')
export class EventsProcessor extends WorkerHost {
  constructor(private readonly metricsService: MetricsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const event = job.data;
    console.log(`Processing event: ${event.type}`);

    // Simple aggregation logic: count event types
    await this.metricsService.aggregateMetric(
      `count_${event.type}`,
      1,
      { playerId: event.playerId }
    );

    // Additional logic based on event type
    if (event.type === 'puzzle_solved') {
      await this.metricsService.aggregateMetric(
        'total_puzzles_solved',
        1
      );
      if (event.data?.timeTaken) {
        await this.metricsService.aggregateMetric(
          'average_solve_time',
          event.data.timeTaken,
          { puzzleId: event.data.puzzleId }
        );
      }
    }

    return { success: true };
  }
}
