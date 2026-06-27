import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BountiesService } from '../services/bounties.service';
import { RewardsService } from '../services/rewards.service';
import { CreateBountyDto, UpdateBountyDto } from '../dto/bounty.dto';
import { BountyStatus } from '../entities/report-status.enum';
import { VulnerabilityReport } from '../entities/report.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('bounties')
@Controller('bounties')
export class BountiesController {
  constructor(
    private readonly bountiesService: BountiesService,
    private readonly rewardsService: RewardsService,
    @InjectRepository(VulnerabilityReport)
    private readonly reportsRepo: Repository<VulnerabilityReport>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bounty program' })
  async create(@Body() dto: CreateBountyDto) {
    return this.bountiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bounty programs' })
  @ApiQuery({ name: 'status', required: false, enum: BountyStatus })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('status') status?: BountyStatus,
  ) {
    return this.bountiesService.list(Number(page), Number(limit), status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bounty by id' })
  @ApiParam({ name: 'id' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.bountiesService.findById(id);
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get a bounty by URL slug' })
  async getBySlug(@Param('slug') slug: string) {
    return this.bountiesService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing bounty' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBountyDto,
  ) {
    return this.bountiesService.update(id, dto);
  }

  @Get(':id/reports')
  @ApiOperation({ summary: 'List reports filed against this bounty' })
  @ApiParam({ name: 'id' })
  async reports(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.max(1, Math.min(100, Number(limit)));
    const [data, total] = await this.reportsRepo.findAndCount({
      where: { bountyId: id },
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  @Get(':id/rewards/summary')
  @ApiOperation({ summary: 'Aggregate reward payouts for a bounty' })
  @ApiParam({ name: 'id' })
  async rewardSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.rewardsService.aggregateByBounty(id);
  }
}
