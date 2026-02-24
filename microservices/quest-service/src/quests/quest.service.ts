import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quest } from './entities/quest.entity';
import { DatabaseMonitoringService } from '../database/database-monitoring.service';
import { MonitorQuery, AutoMonitorQuery } from '../decorators/query-monitor.decorator';

@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);

  constructor(
    @InjectRepository(Quest)
    private questRepository: Repository<Quest>,
    private databaseMonitoringService: DatabaseMonitoringService,
  ) {}

  @AutoMonitorQuery(100) // Monitor with 100ms threshold
  async findAll(): Promise<Quest[]> {
    this.logger.log('Fetching all quests');
    return await this.questRepository.find({
      where: { isActive: true },
    });
  }

  @AutoMonitorQuery(150) // Monitor with 150ms threshold for this specific operation
  async findById(id: number): Promise<Quest | null> {
    this.logger.log(`Fetching quest with id: ${id}`);
    return await this.questRepository.findOneBy({ id });
  }

  @MonitorQuery('INSERT', 'quests', 200) // Monitor insert operation on quests table
  async create(questData: Partial<Quest>): Promise<Quest> {
    this.logger.log('Creating new quest');
    const quest = this.questRepository.create(questData);
    return await this.questRepository.save(quest);
  }

  @MonitorQuery('UPDATE', 'quests', 150) // Monitor update operation
  async update(id: number, updateData: Partial<Quest>): Promise<Quest | null> {
    this.logger.log(`Updating quest with id: ${id}`);
    await this.questRepository.update(id, updateData);
    return await this.findById(id);
  }

  @MonitorQuery('DELETE', 'quests', 100) // Monitor delete operation
  async delete(id: number): Promise<void> {
    this.logger.log(`Deleting quest with id: ${id}`);
    await this.questRepository.delete(id);
  }

  @AutoMonitorQuery(300) // Higher threshold for complex queries
  async findActiveQuestsWithHighRewards(): Promise<Quest[]> {
    this.logger.log('Finding active quests with high rewards');
    return await this.questRepository
      .createQueryBuilder('quest')
      .where('quest.isActive = :isActive', { isActive: true })
      .andWhere('quest.rewardPoints > :minReward', { minReward: 100 })
      .orderBy('quest.rewardPoints', 'DESC')
      .getMany();
  }

  /**
   * Method demonstrating raw SQL monitoring
   */
  async getQuestStats(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total_quests,
        AVG(reward_points) as avg_reward,
        MAX(required_energy) as max_energy_required
      FROM quests 
      WHERE is_active = $1
    `;
    
    return await this.databaseMonitoringService.monitorRawQuery(
      sql,
      [true],
      async () => {
        // In a real implementation, this would execute the raw SQL
        // For demonstration, returning mock data
        return {
          total_quests: 10,
          avg_reward: 50,
          max_energy_required: 20,
        };
      },
      200, // 200ms threshold
    );
  }
}