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
import { TutorialService } from '../services/tutorial.service';
import { LocalizationService } from '../services/localization.service';
import {
  CreateTutorialDto,
  UpdateTutorialDto,
  TutorialFilterDto,
  CreateTutorialStepDto,
  UpdateTutorialStepDto,
  StepOrderDto,
} from '../dto';

@Controller('tutorials')
export class TutorialController {
  private readonly logger = new Logger(TutorialController.name);

  constructor(
    private readonly tutorialService: TutorialService,
    private readonly localizationService: LocalizationService,
  ) {}

  // Tutorial CRUD
  @Post()
  async create(@Body() dto: CreateTutorialDto) {
    this.logger.log(`Creating tutorial: ${dto.name}`);
    return this.tutorialService.create(dto);
  }

  @Get()
  async findAll(@Query() filters: TutorialFilterDto) {
    this.logger.log(`Fetching tutorials with filters: ${JSON.stringify(filters)}`);
    return this.tutorialService.findAll(filters);
  }

  @Get('onboarding')
  async getOnboardingCurriculum() {
    this.logger.log('Fetching onboarding curriculum');
    return this.tutorialService.getOnboardingCurriculum();
  }

  @Get('recommended/:userId')
  async getRecommendedTutorials(@Param('userId', ParseUUIDPipe) userId: string) {
    this.logger.log(`Fetching recommended tutorials for user: ${userId}`);
    return this.tutorialService.getRecommendedTutorials(userId);
  }

  @Get('mechanic/:mechanic')
  async getTutorialsByMechanic(@Param('mechanic') mechanic: string) {
    this.logger.log(`Fetching tutorials for mechanic: ${mechanic}`);
    return this.tutorialService.getTutorialsByMechanic(mechanic);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('locale') locale?: string,
  ) {
    this.logger.log(`Fetching tutorial: ${id}`);
    const tutorial = await this.tutorialService.findById(id);

    if (locale) {
      return this.localizationService.localizeTutorial(tutorial, locale);
    }

    return tutorial;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTutorialDto,
  ) {
    this.logger.log(`Updating tutorial: ${id}`);
    return this.tutorialService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Deleting tutorial: ${id}`);
    await this.tutorialService.delete(id);
  }

  // Prerequisites validation
  @Get(':id/prerequisites/:userId')
  async validatePrerequisites(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    this.logger.log(`Validating prerequisites for tutorial ${id} and user ${userId}`);
    return this.tutorialService.validatePrerequisites(userId, id);
  }

  // Step Management
  @Post(':tutorialId/steps')
  async createStep(
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
    @Body() dto: CreateTutorialStepDto,
  ) {
    this.logger.log(`Creating step for tutorial: ${tutorialId}`);
    dto.tutorialId = tutorialId;
    return this.tutorialService.createStep(dto);
  }

  @Get(':tutorialId/steps')
  async getSteps(
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
    @Query('locale') locale?: string,
  ) {
    this.logger.log(`Fetching steps for tutorial: ${tutorialId}`);
    const steps = await this.tutorialService.getStepsByTutorial(tutorialId);

    if (locale) {
      return Promise.all(
        steps.map((step) => this.localizationService.localizeStep(step, locale)),
      );
    }

    return steps;
  }

  @Get(':tutorialId/steps/:stepId')
  async getStep(
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Query('locale') locale?: string,
  ) {
    this.logger.log(`Fetching step: ${stepId}`);
    const step = await this.tutorialService.getStepById(stepId);

    if (locale) {
      return this.localizationService.localizeStep(step, locale);
    }

    return step;
  }

  @Patch(':tutorialId/steps/:stepId')
  async updateStep(
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: UpdateTutorialStepDto,
  ) {
    this.logger.log(`Updating step: ${stepId}`);
    return this.tutorialService.updateStep(stepId, dto);
  }

  @Delete(':tutorialId/steps/:stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStep(@Param('stepId', ParseUUIDPipe) stepId: string) {
    this.logger.log(`Deleting step: ${stepId}`);
    await this.tutorialService.deleteStep(stepId);
  }

  @Post(':tutorialId/steps/reorder')
  async reorderSteps(
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
    @Body() orders: StepOrderDto[],
  ) {
    this.logger.log(`Reordering steps for tutorial: ${tutorialId}`);
    await this.tutorialService.reorderSteps(tutorialId, orders);
    return { message: 'Steps reordered successfully' };
  }

  // Localization endpoints
  @Get(':id/locales')
  async getSupportedLocales() {
    return this.localizationService.getSupportedLocales();
  }

  @Post(':id/translations/:locale')
  async importTranslations(
    @Param('locale') locale: string,
    @Body() translations: Record<string, string>,
  ) {
    await this.localizationService.importTranslations(locale, translations);
    return { message: `Imported translations for locale: ${locale}` };
  }

  @Get(':id/translations/:locale')
  async getTranslations(@Param('locale') locale: string) {
    return this.localizationService.getTranslationsForLocale(locale);
  }

  @Get(':id/translations/:locale/validate')
  async validateTranslations(@Param('locale') locale: string) {
    return this.localizationService.validateTranslations(locale);
  }
}
