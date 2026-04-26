import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { OnChainEvent, OnChainEventType, EventProcessingStatus } from './entities/onchain-event.entity';
import { DeadLetterEvent } from './entities/dead-letter-event.entity';
import { EventHandlersService } from './event-handlers.service';

interface HorizonEvent {
  id: string;
  paging_token: string;
  ledger: number;
  created_at: string;
  transaction_hash: string;
  type: string;
  contract_id?: string;
  topic: string[];
  value: {
    xdr: string;
  };
}

interface HorizonEventsResponse {
  _links: {
    self: { href: string };
    next: { href: string };
    prev: { href: string };
  };
  _embedded: {
    records: HorizonEvent[];
  };
}

@Injectable()
export class BlockchainEventsService {
  private readonly logger = new Logger(BlockchainEventsService.name);
  private readonly registeredContracts: string[] = [];
  private readonly horizonBaseUrl: string;
  private lastProcessedLedger: number = 0;

  constructor(
    @InjectRepository(OnChainEvent)
    private readonly onChainEventRepository: Repository<OnChainEvent>,
    @InjectRepository(DeadLetterEvent)
    private readonly deadLetterEventRepository: Repository<DeadLetterEvent>,
    private readonly eventHandlersService: EventHandlersService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.horizonBaseUrl = this.configService.get<string>('STELLAR_HORIZON_URL') || 'https://horizon-testnet.stellar.org';
    this.loadRegisteredContracts();
    this.initializeLastProcessedLedger();
  }

  private loadRegisteredContracts(): void {
    const contracts = this.configService.get<string>('QUEST_CONTRACT_ADDRESSES', '');
    this.registeredContracts = contracts.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0);
    this.logger.log(`Loaded ${this.registeredContracts.length} registered contract addresses`);
  }

  private async initializeLastProcessedLedger(): Promise<void> {
    try {
      const lastEvent = await this.onChainEventRepository.findOne({
        where: { status: EventProcessingStatus.PROCESSED },
        order: { ledger: 'DESC' },
      });
      this.lastProcessedLedger = lastEvent?.ledger || 0;
      this.logger.log(`Initialized last processed ledger: ${this.lastProcessedLedger}`);
    } catch (error) {
      this.logger.error('Failed to initialize last processed ledger:', error);
      this.lastProcessedLedger = 0;
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollForEvents(): Promise<void> {
    this.logger.debug('Starting event polling cycle');
    
    try {
      for (const contractAddress of this.registeredContracts) {
        await this.pollContractEvents(contractAddress);
      }
    } catch (error) {
      this.logger.error('Error during event polling:', error);
    }
  }

  private async pollContractEvents(contractAddress: string): Promise<void> {
    try {
      const url = `${this.horizonBaseUrl}/contracts/${contractAddress}/events`;
      const params: Record<string, string> = {
        limit: '200',
        order: 'asc',
      };

      if (this.lastProcessedLedger > 0) {
        params.min_ledger = (this.lastProcessedLedger + 1).toString();
      }

      const response = await firstValueFrom(
        this.httpService.get<HorizonEventsResponse>(url, { params })
      );

      const events = response.data._embedded.records;
      this.logger.debug(`Found ${events.length} events for contract ${contractAddress}`);

      for (const event of events) {
        await this.processEvent(event, contractAddress);
      }

      if (events.length > 0) {
        const maxLedger = Math.max(...events.map(e => e.ledger));
        this.lastProcessedLedger = maxLedger;
        this.logger.debug(`Updated last processed ledger to ${this.lastProcessedLedger}`);
      }
    } catch (error) {
      this.logger.error(`Error polling events for contract ${contractAddress}:`, error);
    }
  }

  private async processEvent(horizonEvent: HorizonEvent, contractAddress: string): Promise<void> {
    try {
      const existingEvent = await this.onChainEventRepository.findOne({
        where: { txHash: horizonEvent.transaction_hash },
      });

      if (existingEvent) {
        this.logger.debug(`Event ${horizonEvent.transaction_hash} already processed, skipping`);
        return;
      }

      const eventType = this.mapTopicToEventType(horizonEvent.topic);
      if (!eventType) {
        this.logger.debug(`Skipping unregistered event type: ${horizonEvent.topic.join(', ')}`);
        return;
      }

      const payload = this.parseEventValue(horizonEvent.value.xdr);

      const onChainEvent = this.onChainEventRepository.create({
        contractAddress,
        eventType,
        payload,
        ledger: horizonEvent.ledger,
        txHash: horizonEvent.transaction_hash,
        pagingToken: horizonEvent.paging_token,
        network: this.configService.get<string>('STELLAR_NETWORK', 'testnet'),
      });

      const savedEvent = await this.onChainEventRepository.save(onChainEvent);

      await this.eventHandlersService.handleEvent(savedEvent);

      savedEvent.status = EventProcessingStatus.PROCESSED;
      savedEvent.processedAt = new Date();
      await this.onChainEventRepository.save(savedEvent);

      this.logger.log(`Successfully processed event ${horizonEvent.transaction_hash} of type ${eventType}`);
    } catch (error) {
      this.logger.error(`Error processing event ${horizonEvent.transaction_hash}:`, error);
      await this.handleEventProcessingError(horizonEvent, contractAddress, error);
    }
  }

  private mapTopicToEventType(topic: string[]): OnChainEventType | null {
    const topicString = topic.join(',');
    const topicMap: Record<string, OnChainEventType> = {
      'RewardClaimed': OnChainEventType.REWARD_CLAIMED,
      'AchievementUnlocked': OnChainEventType.ACHIEVEMENT_UNLOCKED,
      'NFTMinted': OnChainEventType.NFT_MINTED,
      'TournamentCompleted': OnChainEventType.TOURNAMENT_COMPLETED,
      'StakeDeposited': OnChainEventType.STAKE_DEPOSITED,
    };

    return topicMap[topicString] || null;
  }

  private parseEventValue(xdrString: string): Record<string, any> {
    try {
      return {
        xdr: xdrString,
        parsed: this.parseXDREventually(xdrString),
      };
    } catch (error) {
      this.logger.warn('Failed to parse XDR value, storing raw XDR:', error);
      return { xdr: xdrString };
    }
  }

  private parseXDREventually(xdrString: string): any {
    return { raw: xdrString };
  }

  private async handleEventProcessingError(
    horizonEvent: HorizonEvent,
    contractAddress: string,
    error: any
  ): Promise<void> {
    const eventType = this.mapTopicToEventType(horizonEvent.topic);
    
    const deadLetterEvent = this.deadLetterEventRepository.create({
      originalEventId: horizonEvent.id,
      contractAddress,
      eventType: eventType || 'Unknown',
      payload: this.parseEventValue(horizonEvent.value.xdr),
      ledger: horizonEvent.ledger,
      txHash: horizonEvent.transaction_hash,
      errorMessage: error.message,
      errorStack: error.stack,
      network: this.configService.get<string>('STELLAR_NETWORK', 'testnet'),
    });

    await this.deadLetterEventRepository.save(deadLetterEvent);
    this.logger.error(`Event ${horizonEvent.transaction_hash} moved to dead-letter queue`);
  }

  async getSyncStatus(): Promise<{
    lastSyncedLedger: number;
    eventsProcessedToday: number;
    errorCount: number;
    registeredContracts: string[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [eventsProcessedToday, errorCount, lastSyncedEvent] = await Promise.all([
      this.onChainEventRepository.count({
        where: {
          status: EventProcessingStatus.PROCESSED,
          processedAt: MoreThanOrEqual(today),
        },
      }),
      this.deadLetterEventRepository.count({
        where: {
          createdAt: MoreThanOrEqual(today),
        },
      }),
      this.onChainEventRepository.findOne({
        where: { status: EventProcessingStatus.PROCESSED },
        order: { ledger: 'DESC' },
      }),
    ]);

    return {
      lastSyncedLedger: lastSyncedEvent?.ledger || 0,
      eventsProcessedToday,
      errorCount,
      registeredContracts: this.registeredContracts,
    };
  }

  async replayEvents(fromLedger: number, toLedger?: number): Promise<{
    replayed: number;
    errors: number;
  }> {
    this.logger.log(`Starting replay from ledger ${fromLedger}${toLedger ? ` to ${toLedger}` : ''}`);
    
    let replayed = 0;
    let errors = 0;

    try {
      const whereClause: any = {
        ledger: MoreThanOrEqual(fromLedger),
      };

      if (toLedger) {
        whereClause.ledger = LessThan(toLedger + 1);
      }

      const events = await this.onChainEventRepository.find({
        where: whereClause,
        order: { ledger: 'ASC' },
      });

      for (const event of events) {
        try {
          await this.eventHandlersService.handleEvent(event);
          event.status = EventProcessingStatus.PROCESSED;
          event.processedAt = new Date();
          await this.onChainEventRepository.save(event);
          replayed++;
        } catch (error) {
          this.logger.error(`Error replaying event ${event.txHash}:`, error);
          errors++;
        }
      }

      this.logger.log(`Replay completed: ${replayed} events replayed, ${errors} errors`);
    } catch (error) {
      this.logger.error('Error during event replay:', error);
      errors++;
    }

    return { replayed, errors };
  }
}
