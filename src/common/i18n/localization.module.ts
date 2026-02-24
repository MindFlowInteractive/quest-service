import { Module } from '@nestjs/common';
import {
    AcceptLanguageResolver,
    HeaderResolver,
    I18nModule,
    QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Translation } from './entities/translation.entity';
import { LocalizationService } from './localization.service';
import { UserPreferenceResolver } from './user-preference.resolver';
import { TranslationsController } from './translations.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Translation]),
        I18nModule.forRoot({
            fallbackLanguage: 'en',
            loaderOptions: {
                path: path.join(__dirname, 'locales'),
                watch: true,
            },
            resolvers: [
                UserPreferenceResolver,
                { use: QueryResolver, options: ['lang'] },
                AcceptLanguageResolver,
                new HeaderResolver(['x-custom-lang']),
            ],
        }),
    ],
    providers: [LocalizationService, UserPreferenceResolver],
    controllers: [TranslationsController],
    exports: [I18nModule, LocalizationService],
})
export class LocalizationModule { }
