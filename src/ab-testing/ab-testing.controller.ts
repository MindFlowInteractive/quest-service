import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ExperimentsService } from './experiments.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { TrackConversionDto } from './dto/track-conversion.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { CreateFlagDto } from './dto/create-flag.dto';
import { AdminGuard } from './guards/admin.guard';

@Controller()
export class AbTestingController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  // ─── Experiments ────────────────────────────────────────────────────────

  @Post('experiments')
  @UseGuards(AdminGuard)
  createExperiment(@Body() dto: CreateExperimentDto) {
    return this.experimentsService.createExperiment(dto);
  }

  @Get('experiments/assign/:userId')
  assignVariant(@Param('userId') userId: string) {
    return this.experimentsService.assignVariant(userId);
  }

  @Post('experiments/:id/track')
  trackConversion(
    @Param('id') id: string,
    @Body() dto: TrackConversionDto,
  ) {
    return this.experimentsService.trackConversion(id, dto);
  }

  @Get('experiments/:id/results')
  getResults(@Param('id') id: string) {
    return this.experimentsService.getResults(id);
  }

  // ─── Feature Flags ──────────────────────────────────────────────────────

  @Post('flags')
  @UseGuards(AdminGuard)
  createFlag(@Body() dto: CreateFlagDto) {
    return this.experimentsService.createFlag(dto);
  }

  @Get('flags/:key')
  evaluateFlag(@Param('key') key: string, @Request() req) {
    const player = {
      userId: req.user?.id ?? 'anonymous',
      isPremium: req.user?.isPremium ?? false,
      accountAgeDays: req.user?.accountAgeDays ?? 999,
    };
    return this.experimentsService.evaluateFlag(key, player);
  }

  @Patch('flags/:key')
  @UseGuards(AdminGuard)
  updateFlag(
    @Param('key') key: string,
    @Body() dto: UpdateFlagDto,
  ) {
    return this.experimentsService.updateFlag(key, dto);
  }

  @Get('flags')
  listFlags() {
    return this.experimentsService.listFlags();
  }
}