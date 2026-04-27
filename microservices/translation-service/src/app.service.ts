import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language, TranslationEntry, TranslationKey, TranslationContribution } from './entities';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    @InjectRepository(TranslationKey)
    private readonly keyRepository: Repository<TranslationKey>,
    @InjectRepository(TranslationEntry)
    private readonly entryRepository: Repository<TranslationEntry>,
    @InjectRepository(TranslationContribution)
    private readonly contributionRepository: Repository<TranslationContribution>,
  ) {}

  async getLanguages() {
    return this.languageRepository.find();
  }

  async getTranslationKeys() {
    return this.keyRepository.find({ relations: ['entries'] });
  }

  async translate(key: string, language: string, fallback: string) {
    if (!key || !language) {
      throw new NotFoundException('Missing key or language');
    }

    const translationKey = await this.keyRepository.findOne({ where: { key }, relations: ['entries'] });
    if (!translationKey) {
      throw new NotFoundException(`Translation key ${key} not found`);
    }

    const entry = translationKey.entries.find((item) => item.language === language);
    if (entry) {
      return { key, language, text: entry.text, fallbackUsed: false };
    }

    const fallbackEntry = translationKey.entries.find((item) => item.language === fallback);
    if (fallbackEntry) {
      return { key, language, text: fallbackEntry.text, fallbackUsed: true };
    }

    throw new NotFoundException(`No translation available for ${key} in ${language} or fallback ${fallback}`);
  }

  async addTranslation(key: string, language: string, text: string) {
    if (!key || !language || !text) {
      throw new NotFoundException('Missing translation payload');
    }

    let translationKey = await this.keyRepository.findOne({ where: { key } });
    if (!translationKey) {
      translationKey = this.keyRepository.create({ key });
      await this.keyRepository.save(translationKey);
    }

    let languageEntity = await this.languageRepository.findOne({ where: { code: language } });
    if (!languageEntity) {
      languageEntity = this.languageRepository.create({ code: language, name: language });
      await this.languageRepository.save(languageEntity);
    }

    const entry = this.entryRepository.create({ key: translationKey, language, text });
    await this.entryRepository.save(entry);
    return entry;
  }

  async contributeTranslation(key: string, language: string, text: string, contributor: string) {
    const contribution = this.contributionRepository.create({ key, language, text, contributor, status: 'pending' });
    return this.contributionRepository.save(contribution);
  }
}
