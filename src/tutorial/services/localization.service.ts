import { Injectable, Logger } from '@nestjs/common';
import { Tutorial } from '../entities/tutorial.entity';
import { TutorialStep } from '../entities/tutorial-step.entity';
import { ContextualHelp } from '../entities/contextual-help.entity';

export interface LocalizedTutorial extends Omit<Tutorial, 'name' | 'description'> {
  name: string;
  description: string;
  locale: string;
}

export interface LocalizedStep extends Omit<TutorialStep, 'title' | 'content'> {
  title: string;
  content: {
    instructions: string;
    [key: string]: any;
  };
  locale: string;
}

export interface LocalizedContextualHelp extends Omit<ContextualHelp, 'content'> {
  content: {
    title: string;
    body: string;
    [key: string]: any;
  };
  locale: string;
}

export interface TranslationValidationResult {
  locale: string;
  totalKeys: number;
  missingKeys: string[];
  isComplete: boolean;
}

@Injectable()
export class LocalizationService {
  private readonly logger = new Logger(LocalizationService.name);

  // In-memory translation storage (in production, use database or i18n files)
  private translations: Map<string, Map<string, string>> = new Map();
  private supportedLocales: string[] = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'pt', 'ru', 'ar'];
  private defaultLocale = 'en';

  constructor() {
    // Initialize with default locale
    this.translations.set('en', new Map());
  }

  // Translation Management
  async getTranslation(
    key: string,
    locale: string,
    params?: Record<string, any>,
  ): Promise<string> {
    const localeTranslations = this.translations.get(locale);
    let translation = localeTranslations?.get(key);

    // Fallback to default locale
    if (!translation && locale !== this.defaultLocale) {
      const defaultTranslations = this.translations.get(this.defaultLocale);
      translation = defaultTranslations?.get(key);
    }

    // Return key if no translation found
    if (!translation) {
      this.logger.warn(`Missing translation for key: ${key} in locale: ${locale}`);
      return key;
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation!.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }

    return translation;
  }

  async setTranslation(key: string, locale: string, value: string): Promise<void> {
    if (!this.translations.has(locale)) {
      this.translations.set(locale, new Map());
    }
    this.translations.get(locale)!.set(key, value);
  }

  async getTranslationsForLocale(locale: string): Promise<Record<string, string>> {
    const localeTranslations = this.translations.get(locale);
    if (!localeTranslations) {
      return {};
    }
    return Object.fromEntries(localeTranslations);
  }

  async importTranslations(locale: string, translations: Record<string, string>): Promise<void> {
    if (!this.translations.has(locale)) {
      this.translations.set(locale, new Map());
    }
    const localeMap = this.translations.get(locale)!;
    Object.entries(translations).forEach(([key, value]) => {
      localeMap.set(key, value);
    });
    this.logger.log(`Imported ${Object.keys(translations).length} translations for locale: ${locale}`);
  }

  async exportTranslations(locale: string): Promise<Record<string, string>> {
    return this.getTranslationsForLocale(locale);
  }

  // Locale Management
  async getSupportedLocales(): Promise<string[]> {
    return this.supportedLocales;
  }

  async addLocale(locale: string): Promise<void> {
    if (!this.supportedLocales.includes(locale)) {
      this.supportedLocales.push(locale);
      this.translations.set(locale, new Map());
      this.logger.log(`Added new locale: ${locale}`);
    }
  }

  async setDefaultLocale(locale: string): Promise<void> {
    if (!this.supportedLocales.includes(locale)) {
      throw new Error(`Locale ${locale} is not supported`);
    }
    this.defaultLocale = locale;
  }

  async detectUserLocale(userId: string): Promise<string> {
    // In a real implementation, this would check user preferences from database
    // For now, return default locale
    return this.defaultLocale;
  }

  // Content Localization
  async localizeTutorial(tutorial: Tutorial, locale: string): Promise<LocalizedTutorial> {
    const nameKey = `tutorial.${tutorial.id}.name`;
    const descriptionKey = `tutorial.${tutorial.id}.description`;

    const localizedName = await this.getTranslation(nameKey, locale);
    const localizedDescription = await this.getTranslation(descriptionKey, locale);

    return {
      ...tutorial,
      name: localizedName !== nameKey ? localizedName : tutorial.name,
      description: localizedDescription !== descriptionKey ? localizedDescription : tutorial.description,
      locale,
    };
  }

  async localizeStep(step: TutorialStep, locale: string): Promise<LocalizedStep> {
    const titleKey = step.localization?.titleKey || `tutorial.step.${step.id}.title`;
    const instructionsKey = step.localization?.instructionsKey || `tutorial.step.${step.id}.instructions`;

    const localizedTitle = await this.getTranslation(titleKey, locale);
    const localizedInstructions = await this.getTranslation(instructionsKey, locale);

    // Localize additional content keys if present
    const localizedContent = { ...step.content };
    localizedContent.instructions =
      localizedInstructions !== instructionsKey ? localizedInstructions : step.content.instructions;

    if (step.localization?.contentKeys) {
      for (const [field, key] of Object.entries(step.localization.contentKeys)) {
        const localizedValue = await this.getTranslation(key, locale);
        if (localizedValue !== key) {
          (localizedContent as any)[field] = localizedValue;
        }
      }
    }

    return {
      ...step,
      title: localizedTitle !== titleKey ? localizedTitle : step.title,
      content: localizedContent,
      locale,
    };
  }

  async localizeHelp(help: ContextualHelp, locale: string): Promise<LocalizedContextualHelp> {
    const titleKey = help.localization?.titleKey || `contextual_help.${help.id}.title`;
    const bodyKey = help.localization?.bodyKey || `contextual_help.${help.id}.body`;

    const localizedTitle = await this.getTranslation(titleKey, locale);
    const localizedBody = await this.getTranslation(bodyKey, locale);

    const localizedContent = {
      ...help.content,
      title: localizedTitle !== titleKey ? localizedTitle : help.content.title,
      body: localizedBody !== bodyKey ? localizedBody : help.content.body,
    };

    // Localize action labels if present
    if (help.content.actions && help.localization?.actionsKeys) {
      localizedContent.actions = await Promise.all(
        help.content.actions.map(async (action, index) => {
          const labelKey = help.localization?.actionsKeys?.[`action_${index}_label`];
          if (labelKey) {
            const localizedLabel = await this.getTranslation(labelKey, locale);
            return {
              ...action,
              label: localizedLabel !== labelKey ? localizedLabel : action.label,
            };
          }
          return action;
        }),
      );
    }

    return {
      ...help,
      content: localizedContent,
      locale,
    };
  }

  // Validation
  async getMissingTranslations(locale: string): Promise<string[]> {
    const defaultKeys = Array.from(this.translations.get(this.defaultLocale)?.keys() || []);
    const localeKeys = Array.from(this.translations.get(locale)?.keys() || []);
    const localeKeySet = new Set(localeKeys);

    return defaultKeys.filter((key) => !localeKeySet.has(key));
  }

  async validateTranslations(locale: string): Promise<TranslationValidationResult> {
    const missingKeys = await this.getMissingTranslations(locale);
    const totalKeys = this.translations.get(this.defaultLocale)?.size || 0;

    return {
      locale,
      totalKeys,
      missingKeys,
      isComplete: missingKeys.length === 0,
    };
  }

  // Utility method to generate translation keys for a tutorial
  generateTutorialKeys(tutorialId: string): string[] {
    return [
      `tutorial.${tutorialId}.name`,
      `tutorial.${tutorialId}.description`,
    ];
  }

  generateStepKeys(stepId: string): string[] {
    return [
      `tutorial.step.${stepId}.title`,
      `tutorial.step.${stepId}.instructions`,
    ];
  }

  generateHelpKeys(helpId: string): string[] {
    return [
      `contextual_help.${helpId}.title`,
      `contextual_help.${helpId}.body`,
    ];
  }
}
