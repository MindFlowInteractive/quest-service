import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation } from './entities/translation.entity';

@Injectable()
export class LocalizationService {
    constructor(
        private readonly i18n: I18nService,
        @InjectRepository(Translation)
        private readonly translationRepo: Repository<Translation>,
    ) { }

    /**
     * Translates a key using both static files and database-backed translations.
     * @param key The translation key
     * @param options Translation options (args, lang, defaultValue)
     */
    async translate(
        key: string,
        options: { lang?: string; args?: any; defaultValue?: string } = {},
    ): Promise<string> {
        const lang = options.lang || I18nContext.current()?.lang || 'en';

        // 1. Try to find in database first (dynamic content has priority)
        const dbTranslation = await this.translationRepo.findOne({
            where: { key, locale: lang },
        });

        if (dbTranslation) {
            return dbTranslation.content;
        }

        // 2. Fallback to static files
        try {
            const translated = await this.i18n.translate(key, {
                lang,
                args: options.args,
            });

            // If translation fails or returns the key نفسه, return defaultValue or key
            if (translated === key && options.defaultValue) {
                return options.defaultValue;
            }

            return translated as string;
        } catch (error) {
            return options.defaultValue || key;
        }
    }

    /**
     * Bulk translate keys for a specific locale
     */
    async getTranslationsForLocale(locale: string, namespace?: string) {
        const query = this.translationRepo.createQueryBuilder('translation')
            .where('translation.locale = :locale', { locale });

        if (namespace) {
            query.andWhere('translation.namespace = :namespace', { namespace });
        }

        return await query.getMany();
    }
}
