import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RewardsService } from '../services/rewards.service';
import {
  ApproveRewardDto,
  PayRewardDto,
  UpdateRewardStatusDto,
} from '../dto/reward.dto';
import { RewardStatus } from '../entities/report-status.enum';

@ApiTags('rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @ApiOperation({ summary: 'List rewards with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: RewardStatus })
  @ApiQuery({ name: 'researcherId', required: false })
  @ApiQuery({ name: 'bountyId', required: false })
  async list(
    @Query('status') status?: RewardStatus,
    @Query('researcherId') researcherId?: string,
    @Query('bountyId') bountyId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.rewardsService.list({ status, researcherId, bountyId, page: Number(page), limit: Number(limit) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reward by id' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.rewardsService.getById(id);
  }

  @Get('by-report/:reportId')
  @ApiOperation({ summary: 'Find the reward attached to a report' })
  async findByReport(@Param('reportId', ParseUUIDPipe) reportId: string) {
    return this.rewardsService.findByReport(reportId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a pending reward for payment' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveRewardDto,
  ) {
    return this.rewardsService.approve(id, dto);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Mark an approved reward as paid' })
  async pay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayRewardDto,
  ) {
    return this.rewardsService.pay(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Force-update a reward status (admin use)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRewardStatusDto,
  ) {
    return this.rewardsService.updateStatus(id, dto);
  }
}
