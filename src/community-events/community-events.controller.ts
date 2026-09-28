import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CommunityEventsService } from './community-events.service';
import {
  CreateCommunityEventDto,
  RecordParticipationDto,
  CreateMilestoneDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants';

@ApiTags('Community Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('community-events')
export class CommunityEventsController {
  constructor(private readonly service: CommunityEventsService) {}

  // ─── Events ────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new community event (admin only)' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async create(@Body() dto: CreateCommunityEventDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all community events' })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@Query('status') status?: string) {
    return this.service.findAll(status ? { status: status as any } : {});
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all currently active community events' })
  async getActive() {
    return this.service.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single community event by ID' })
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ─── Participation ─────────────────────────────────────────────────────────

  @Post(':id/participate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a participation action for a user' })
  @ApiResponse({ status: 200, description: 'Participation recorded' })
  @ApiResponse({ status: 400, description: 'Event not active or at capacity' })
  async recordParticipation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordParticipationDto,
  ) {
    return this.service.recordParticipation(id, dto);
  }

  @Get(':id/participation/:userId')
  @ApiOperation({ summary: "Get a user's participation record for an event" })
  async getParticipation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') userId: string,
  ) {
    return this.service.getParticipation(id, userId);
  }

  @Post(':id/participation/:userId/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: mark a participation record as verified' })
  async verifyParticipation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') userId: string,
  ) {
    return this.service.verifyParticipation(id, userId);
  }

  // ─── Milestones ────────────────────────────────────────────────────────────

  @Post(':id/milestones')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a milestone to an event (admin only)' })
  async addMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.service.addMilestone(id, dto);
  }

  @Get(':id/milestones')
  @ApiOperation({ summary: 'Get all milestones for an event' })
  async getMilestones(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getMilestones(id);
  }

  // ─── Leaderboard ───────────────────────────────────────────────────────────

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get event leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.service.getLeaderboard(id, limit);
  }

  @Get(':id/leaderboard/:userId')
  @ApiOperation({ summary: "Get a user's rank within the event leaderboard" })
  async getUserRank(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') userId: string,
  ) {
    return this.service.getUserRank(id, userId);
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  @Get(':id/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get engagement analytics for an event (admin only)' })
  async getAnalytics(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAnalytics(id);
  }

  // ─── Reward Distribution ───────────────────────────────────────────────────

  @Post(':id/distribute-rewards')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger end-of-event reward distribution (admin only)' })
  async distributeRewards(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.distributeEndRewards(id);
    return { message: 'Rewards distributed successfully' };
  }
}
