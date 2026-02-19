import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ContextualHelpService } from '../services/contextual-help.service';
import { LocalizationService } from '../services/localization.service';
import {
  CreateContextualHelpDto,
  UpdateContextualHelpDto,
  ContextualHelpFilterDto,
  TriggerContextualHelpDto,
  RecordHelpInteractionDto,
} from '../dto';

@Controller('contextual-help')
export class ContextualHelpController {
  private readonly logger = new Logger(ContextualHelpController.name);

  constructor(
    private readonly helpService: ContextualHelpService,
    private readonly localizationService: LocalizationService,
  ) {}

  // CRUD Operations
  @Post()
  async create(@Body() dto: CreateContextualHelpDto) {
    this.logger.log(`Creating contextual help: ${dto.name}`);
    return this.helpService.create(dto);
  }

  @Get()
  async findAll(@Query() filters: ContextualHelpFilterDto) {
    this.logger.log(`Fetching contextual help with filters: ${JSON.stringify(filters)}`);
    return this.helpService.findAll(filters);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('locale') locale?: string,
  ) {
    this.logger.log(`Fetching contextual help: ${id}`);
    const help = await this.helpService.findById(id);

    if (locale) {
      return this.localizationService.localizeHelp(help, locale);
    }

    return help;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContextualHelpDto,
  ) {
    this.logger.log(`Updating contextual help: ${id}`);
    return this.helpService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Deleting contextual help: ${id}`);
    await this.helpService.delete(id);
  }

  // Trigger and Display
  @Post('user/:userId/trigger')
  async triggerHelp(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: TriggerContextualHelpDto,
    @Query('locale') locale?: string,
  ) {
    this.logger.log(`Triggering help for user ${userId} in context: ${dto.context}`);
    const help = await this.helpService.triggerHelp(userId, dto);

    if (help && locale) {
      return this.localizationService.localizeHelp(help, locale);
    }

    return help;
  }

  @Post('user/:userId/interaction')
  async recordInteraction(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: RecordHelpInteractionDto,
  ) {
    this.logger.log(`Recording interaction for user ${userId} on help ${dto.helpId}`);
    await this.helpService.recordInteraction(userId, dto);
    return { message: 'Interaction recorded successfully' };
  }

  @Get('user/:userId/history')
  async getUserHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('helpId') helpId?: string,
  ) {
    this.logger.log(`Fetching help history for user ${userId}`);
    return this.helpService.getUserHelpHistory(userId, helpId);
  }

  // Integration Endpoints
  @Get('puzzle-start/:userId/:puzzleType')
  async getHelpForPuzzleStart(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('puzzleType') puzzleType: string,
    @Query('locale') locale?: string,
  ) {
    this.logger.log(`Getting puzzle start help for user ${userId}, type: ${puzzleType}`);
    const help = await this.helpService.getHelpForPuzzleStart(userId, puzzleType);

    if (help && locale) {
      return this.localizationService.localizeHelp(help, locale);
    }

    return help;
  }

  @Get('repeated-failure/:userId/:puzzleId')
  async getHelpForRepeatedFailure(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('puzzleId', ParseUUIDPipe) puzzleId: string,
    @Query('attempts') attempts: number,
    @Query('locale') locale?: string,
  ) {
    this.logger.log(`Getting failure help for user ${userId}, puzzle: ${puzzleId}`);
    const help = await this.helpService.getHelpForRepeatedFailure(userId, puzzleId, attempts);

    if (help && locale) {
      return this.localizationService.localizeHelp(help, locale);
    }

    return help;
  }

  @Get('feature/:userId/:feature')
  async getHelpForFeature(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('feature') feature: string,
    @Query('locale') locale?: string,
  ) {
    this.logger.log(`Getting feature help for user ${userId}, feature: ${feature}`);
    const help = await this.helpService.getHelpForFeature(userId, feature);

    if (help && locale) {
      return this.localizationService.localizeHelp(help, locale);
    }

    return help;
  }

  // Analytics
  @Get('analytics')
  async getHelpAnalytics(@Query('helpId') helpId?: string) {
    this.logger.log('Fetching contextual help analytics');
    if (helpId) {
      return this.helpService.getUserHelpHistory(helpId);
    }
    return { message: 'Provide helpId for analytics' };
  }
}
