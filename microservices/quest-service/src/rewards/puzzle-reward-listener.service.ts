import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RewardsService } from './rewards.service';

@Injectable()
export class PuzzleRewardListenerService implements OnModuleInit {
  private readonly logger = new Logger(PuzzleRewardListenerService.name);

  @Client({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 8888, // Default port for user-progress service
    },
  })
  private userProgressClient: ClientProxy;

  constructor(
    private rewardsService: RewardsService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.userProgressClient.connect();
      this.logger.log('Connected to user-progress service');
    } catch (error) {
      this.logger.error('Failed to connect to user-progress service:', error);
    }
  }

  /**
   * Handles puzzle completion event and distributes rewards
   */
  async handlePuzzleCompleted(userId: string, puzzleId: string, completionTime?: number, hintsUsed?: number): Promise<void> {
    try {
      this.logger.log(`Handling puzzle completion for user ${userId}, puzzle ${puzzleId}`);
      
      // Process the reward distribution
      const result = await this.rewardsService.handlePuzzleCompletion(
        userId,
        puzzleId,
        completionTime,
        hintsUsed
      );

      this.logger.log(`Reward processing result: ${JSON.stringify(result)}`);

      // Optionally emit an event for successful reward distribution
      if (result.success) {
        this.logger.log(`Successfully processed reward for user ${userId} completing puzzle ${puzzleId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling puzzle completion for user ${userId}, puzzle ${puzzleId}:`, error);
    }
  }

  /**
   * Alternative method to subscribe to puzzle completion events via RabbitMQ or other messaging system
   */
  async subscribeToPuzzleEvents(): Promise<void> {
    // This would typically subscribe to events from the user-progress service or puzzle service
    // Implementation would depend on the messaging infrastructure in place
    this.logger.log('Subscribing to puzzle completion events...');
  }
}