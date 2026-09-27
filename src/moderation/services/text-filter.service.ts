import { Injectable, Logger } from '@nestjs/common';
import { ViolationCategory, Severity } from '../enums/moderation.enums';

export interface TextFilterResult {
  passed: boolean;
  categories: ViolationCategory[];
  severity: Severity;
  matchedPatterns: string[];
  sanitizedText: string;
}

@Injectable()
export class TextFilterService {
  private readonly logger = new Logger(TextFilterService.name);

  private readonly profanityList: string[] = [
    'badword',
    'offensive',
    'slur',
    'hate',
    'racist',
    'sexist',
    'harassment',
    'threat',
    'abuse',
    'explicit',
    'nsfw',
    'vulgar',
    'obscene',
  ];

  private readonly hateSpeechPatterns: RegExp[] = [
    /\b(kill|murder|destroy)\s+(all|every|those)\b/gi,
    /\b(hate|despise)\s+(all|every|those)\b/gi,
  ];

  private readonly harassmentPatterns: RegExp[] = [
    /\b(loser|idiot|stupid|dumb|moron)\b/gi,
    /\b(worthless|garbage|trash)\b/gi,
  ];

  private readonly spamPatterns: RegExp[] = [
    /(.+)\1{5,}/i,
    /https?:\/\/[^\s]+/gi,
    /\b(buy now|click here|free money|winner|prize|congratulations)\b/gi,
  ];

  private readonly selfHarmPatterns: RegExp[] = [
    /\b(suicide|self.harm|kill myself|end my life)\b/gi,
  ];

  filterText(text: string): TextFilterResult {
    if (!text) {
      return {
        passed: true,
        categories: [],
        severity: Severity.LOW,
        matchedPatterns: [],
        sanitizedText: '',
      };
    }

    const categories: ViolationCategory[] = [];
    const matchedPatterns: string[] = [];
    const lower = text.toLowerCase();

    // Check profanity
    const hasProfanity = this.profanityList.some((w) => lower.includes(w));
    if (hasProfanity) {
      categories.push(ViolationCategory.PROFANITY);
      matchedPatterns.push('profanity_list');
    }

    // Check hate speech
    for (const pattern of this.hateSpeechPatterns) {
      if (pattern.test(text)) {
        categories.push(ViolationCategory.HATE_SPEECH);
        matchedPatterns.push(`hate_speech:${pattern.source}`);
        pattern.lastIndex = 0;
        break;
      }
      pattern.lastIndex = 0;
    }

    // Check harassment
    for (const pattern of this.harassmentPatterns) {
      if (pattern.test(text)) {
        categories.push(ViolationCategory.HARASSMENT);
        matchedPatterns.push(`harassment:${pattern.source}`);
        pattern.lastIndex = 0;
        break;
      }
      pattern.lastIndex = 0;
    }

    // Check spam
    let urlCount = 0;
    for (const pattern of this.spamPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        if (pattern.source.includes('http')) {
          urlCount += matches.length;
        } else if (matches.length > 0) {
          categories.push(ViolationCategory.SPAM);
          matchedPatterns.push(`spam:${pattern.source}`);
        }
        pattern.lastIndex = 0;
      }
    }
    if (urlCount > 3) {
      categories.push(ViolationCategory.SPAM);
      matchedPatterns.push('excessive_urls');
    }

    // Check self-harm
    for (const pattern of this.selfHarmPatterns) {
      if (pattern.test(text)) {
        categories.push(ViolationCategory.SELF_HARM);
        matchedPatterns.push(`self_harm:${pattern.source}`);
        pattern.lastIndex = 0;
        break;
      }
      pattern.lastIndex = 0;
    }

    // Check excessive length
    if (text.length > 5000) {
      categories.push(ViolationCategory.SPAM);
      matchedPatterns.push('excessive_length');
    }

    const uniqueCategories = [...new Set(categories)];
    const severity = this.calculateSeverity(uniqueCategories);
    const sanitizedText = this.sanitize(text);

    return {
      passed: uniqueCategories.length === 0,
      categories: uniqueCategories,
      severity,
      matchedPatterns: [...new Set(matchedPatterns)],
      sanitizedText,
    };
  }

  private calculateSeverity(categories: ViolationCategory[]): Severity {
    if (
      categories.includes(ViolationCategory.SELF_HARM) ||
      categories.includes(ViolationCategory.HATE_SPEECH)
    ) {
      return Severity.CRITICAL;
    }
    if (
      categories.includes(ViolationCategory.HARASSMENT) ||
      categories.includes(ViolationCategory.VIOLENCE)
    ) {
      return Severity.HIGH;
    }
    if (categories.includes(ViolationCategory.PROFANITY)) {
      return Severity.MEDIUM;
    }
    if (categories.length > 0) {
      return Severity.LOW;
    }
    return Severity.LOW;
  }

  private sanitize(text: string): string {
    let sanitized = text;
    for (const word of this.profanityList) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '*'.repeat(word.length));
    }
    return sanitized;
  }
}
