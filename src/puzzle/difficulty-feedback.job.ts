// difficulty-feedback.job.ts
import { Injectable } from '@nestjs/common';
import { DifficultyFeedbackService } from './difficulty-feedback.service';

@Injectable()
export class DifficultyFeedbackJob {
  constructor(private readonly service: DifficultyFeedbackService) {}

  async run() {
    await this.service.notifyCreators();
  }
}
