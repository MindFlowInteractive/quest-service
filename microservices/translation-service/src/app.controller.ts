import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('translate')
  translate(
    @Query('key') key: string,
    @Query('language') language: string,
    @Query('fallback') fallback = 'en',
  ) {
    return this.appService.translate(key, language, fallback);
  }

  @Get('languages')
  getLanguages() {
    return this.appService.getLanguages();
  }

  @Get('keys')
  getKeys() {
    return this.appService.getTranslationKeys();
  }

  @Post('translations')
  addTranslation(@Body() body: { key: string; language: string; text: string }) {
    return this.appService.addTranslation(body.key, body.language, body.text);
  }

  @Post('translations/contribute')
  contributeTranslation(
    @Body() body: { key: string; language: string; text: string; contributor: string },
  ) {
    return this.appService.contributeTranslation(body.key, body.language, body.text, body.contributor);
  }
}
