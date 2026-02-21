import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation } from './entities/translation.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Translations')
@Controller('translations')
export class TranslationsController {
    constructor(
        @InjectRepository(Translation)
        private readonly translationRepo: Repository<Translation>,
    ) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Create or update a translation' })
    @ApiResponse({ status: 200, description: 'Translation saved successfully' })
    async upsert(@Body() data: Partial<Translation>) {
        const existing = await this.translationRepo.findOne({
            where: { key: data.key, locale: data.locale },
        });

        if (existing) {
            Object.assign(existing, data);
            return await this.translationRepo.save(existing);
        }

        const translation = this.translationRepo.create(data);
        return await this.translationRepo.save(translation);
    }

    @Get()
    @ApiOperation({ summary: 'List all translations' })
    async findAll(@Query('locale') locale?: string, @Query('namespace') namespace?: string) {
        const where: any = {};
        if (locale) where.locale = locale;
        if (namespace) where.namespace = namespace;

        return await this.translationRepo.find({ where });
    }

    @Get(':key')
    @ApiOperation({ summary: 'Get translations for a specific key' })
    async findByKey(@Param('key') key: string, @Query('locale') locale?: string) {
        const where: any = { key };
        if (locale) where.locale = locale;

        return await this.translationRepo.find({ where });
    }
}
