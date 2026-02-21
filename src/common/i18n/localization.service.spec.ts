import { Test, TestingModule } from '@nestjs/testing';
import { LocalizationService } from './localization.service';
import { I18nService } from 'nestjs-i18n';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Translation } from './entities/translation.entity';

describe('LocalizationService', () => {
    let service: LocalizationService;
    let i18nService: I18nService;
    let translationRepo: any;

    const mockI18nService = {
        translate: jest.fn(),
    };

    const mockTranslationRepo = {
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LocalizationService,
                {
                    provide: I18nService,
                    useValue: mockI18nService,
                },
                {
                    provide: getRepositoryToken(Translation),
                    useValue: mockTranslationRepo,
                },
            ],
        }).compile();

        service = module.get<LocalizationService>(LocalizationService);
        i18nService = module.get<I18nService>(I18nService);
        translationRepo = module.get(getRepositoryToken(Translation));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('translate', () => {
        it('should return translation from database if exists', async () => {
            const mockTranslation = { content: 'Translated Content' };
            translationRepo.findOne.mockResolvedValue(mockTranslation);

            const result = await service.translate('test-key', { lang: 'en' });

            expect(result).toBe('Translated Content');
            expect(translationRepo.findOne).toHaveBeenCalledWith({
                where: { key: 'test-key', locale: 'en' },
            });
            expect(mockI18nService.translate).not.toHaveBeenCalled();
        });

        it('should fallback to static i18n if not in database', async () => {
            translationRepo.findOne.mockResolvedValue(null);
            mockI18nService.translate.mockResolvedValue('Static Translation');

            const result = await service.translate('static-key', { lang: 'en' });

            expect(result).toBe('Static Translation');
            expect(mockI18nService.translate).toHaveBeenCalledWith('static-key', {
                lang: 'en',
                args: undefined,
            });
        });

        it('should return defaultValue if translation not found anywhere', async () => {
            translationRepo.findOne.mockResolvedValue(null);
            mockI18nService.translate.mockResolvedValue('static-key'); // nestjs-i18n returns key if not found

            const result = await service.translate('static-key', {
                lang: 'en',
                defaultValue: 'Default Value',
            });

            expect(result).toBe('Default Value');
        });

        it('should return key if translation and defaultValue not found', async () => {
            translationRepo.findOne.mockResolvedValue(null);
            mockI18nService.translate.mockResolvedValue('missing-key');

            const result = await service.translate('missing-key', { lang: 'en' });

            expect(result).toBe('missing-key');
        });
    });
});
