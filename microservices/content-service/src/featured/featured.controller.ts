import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { FeaturedService } from './featured.service.js';
import { CreateFeaturedDto } from './dto/create-featured.dto.js';
import { FeaturedConfigDto } from './dto/featured-config.dto.js';
import { FeaturedSlot } from '../entities/featured-content.entity.js';

@Controller('featured')
export class FeaturedController {
  constructor(private readonly featuredService: FeaturedService) {}

  @Get()
  async findAll() {
    return this.featuredService.findAll();
  }

  @Get(':slot')
  async findBySlot(@Param('slot') slot: FeaturedSlot) {
    return this.featuredService.findBySlot(slot);
  }

  @Post()
  async create(
    @Body() createFeaturedDto: CreateFeaturedDto,
    @Headers('x-admin-id') adminId: string,
  ) {
    return this.featuredService.create(createFeaturedDto, adminId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.featuredService.remove(id);
  }

  @Put(':id/position')
  async updatePosition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('position') position: number,
  ) {
    return this.featuredService.updatePosition(id, position);
  }

  @Put('config')
  async updateConfig(@Body() configDto: FeaturedConfigDto) {
    return { message: 'Configuration updated', config: configDto };
  }

  @Post('rotate/:slot')
  @HttpCode(HttpStatus.OK)
  async triggerRotation(@Param('slot') slot: FeaturedSlot) {
    await this.featuredService.triggerRotation(slot);
    return { message: `Rotation triggered for slot ${slot}` };
  }

  @Post(':id/impression')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackImpression(@Param('id', ParseUUIDPipe) id: string) {
    await this.featuredService.trackImpression(id);
  }

  @Post(':id/click')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackClick(@Param('id', ParseUUIDPipe) id: string) {
    await this.featuredService.trackClick(id);
  }
}
