import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ProducerService, UserCreatedPayload, AchievementUnlockedPayload } from './producer.service';

@Controller('events')
export class ProducerController {
  private readonly logger = new Logger(ProducerController.name);

  constructor(private readonly producerService: ProducerService) {}

  @Post('user-created')
  async publishUserCreated(@Body() payload: UserCreatedPayload) {
    this.logger.log('Received request to publish user.created event');
    await this.producerService.publishUserCreated(payload);
    return { success: true, message: 'Event published successfully' };
  }

  @Post('achievement-unlocked')
  async publishAchievementUnlocked(@Body() payload: AchievementUnlockedPayload) {
    this.logger.log('Received request to publish achievement.unlocked event');
    await this.producerService.publishAchievementUnlocked(payload);
    return { success: true, message: 'Event published successfully' };
  }

  @Post('batch')
  async publishBatch() {
    this.logger.log('Received request to publish batch events');
    await this.producerService.publishBatch();
    return { success: true, message: 'Batch events published successfully' };
  }
}
