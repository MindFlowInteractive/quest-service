import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { QuestService } from './quest.service';
import { Quest } from './entities/quest.entity';

@Controller('quests')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllQuests(): Promise<Quest[]> {
    return await this.questService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getQuest(@Param('id') id: number): Promise<Quest | null> {
    return await this.questService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQuest(@Body() questData: Partial<Quest>): Promise<Quest> {
    return await this.questService.create(questData);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateQuest(
    @Param('id') id: number,
    @Body() updateData: Partial<Quest>,
  ): Promise<Quest | null> {
    return await this.questService.update(id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuest(@Param('id') id: number): Promise<void> {
    await this.questService.delete(id);
  }

  @Get('stats/rewards')
  @HttpCode(HttpStatus.OK)
  async getHighRewardQuests(): Promise<Quest[]> {
    return await this.questService.findActiveQuestsWithHighRewards();
  }
}