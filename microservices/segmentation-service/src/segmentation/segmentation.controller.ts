import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { AssignExperimentDto } from './dto/create-experiment.dto';
import {
  CheckMembershipDto,
  EvaluateSegmentDto,
  MembershipChangeDto,
  OverlapQueryDto,
} from './dto/evaluate-segment.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { IngestUserEventDto } from './dto/ingest-user-event.dto';
import { SegmentationService } from './segmentation.service';

@Controller('segments')
export class SegmentationController {
  constructor(private readonly segmentationService: SegmentationService) {}

  @Get()
  list() {
    return this.segmentationService.listSegments();
  }

  @Get('dashboard')
  dashboard() {
    return this.segmentationService.getDashboard();
  }

  @Post('overlap')
  overlap(@Body() dto: OverlapQueryDto) {
    return this.segmentationService.overlap(dto);
  }

  @Post()
  create(@Body() dto: CreateSegmentDto) {
    return this.segmentationService.createSegment(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.segmentationService.getSegment(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSegmentDto) {
    return this.segmentationService.updateSegment(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.segmentationService.deleteSegment(id);
  }

  @Post(':id/rules')
  addRule(@Param('id') id: string, @Body() dto: CreateRuleDto) {
    return this.segmentationService.addRule(id, dto);
  }

  @Delete(':id/rules/:ruleId')
  removeRule(@Param('id') id: string, @Param('ruleId') ruleId: string) {
    return this.segmentationService.removeRule(id, ruleId);
  }

  @Post(':id/evaluate')
  evaluate(@Param('id') id: string, @Body() dto: EvaluateSegmentDto = {}) {
    return this.segmentationService.evaluateSegment(id, dto);
  }

  @Post(':id/membership')
  addMember(
    @Param('id') id: string,
    @Body() dto: MembershipChangeDto | MembershipChangeDto[],
  ) {
    const members = Array.isArray(dto) ? dto : [dto];
    return this.segmentationService.addManualMembers(id, members);
  }

  @Delete(':id/membership/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Query('reason') reason?: string,
  ) {
    return this.segmentationService.removeManualMember(id, userId, reason);
  }

  @Get(':id/members')
  members(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : undefined;
    return this.segmentationService.listMembers(
      id,
      Number.isFinite(parsed) && parsed && parsed > 0 ? parsed : 100,
    );
  }

  @Get(':id/size')
  size(@Param('id') id: string) {
    return this.segmentationService.getSize(id);
  }

  @Post(':id/check')
  check(@Param('id') id: string, @Body() dto: CheckMembershipDto) {
    return this.segmentationService.checkMembership(id, dto.userId);
  }
}

@Controller('events')
export class EventController {
  constructor(private readonly segmentationService: SegmentationService) {}

  @Post()
  ingest(@Body() dto: IngestUserEventDto) {
    return this.segmentationService.ingestSignal(dto);
  }
}

@Controller('experiments')
export class ExperimentController {
  constructor(private readonly segmentationService: SegmentationService) {}

  @Post()
  create(@Body() dto: CreateExperimentDto) {
    return this.segmentationService.createExperiment(dto);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignExperimentDto) {
    return this.segmentationService.assignVariant(id, dto);
  }
}
