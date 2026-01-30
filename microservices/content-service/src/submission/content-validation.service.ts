import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Content, ContentType } from '../entities/content.entity.js';
import { ValidationResults } from '../entities/submission.entity.js';

@Injectable()
export class ContentValidationService {
  private readonly logger = new Logger(ContentValidationService.name);
  private readonly autoApprovalThreshold: number;

  private readonly profanityList = [
    'spam', 'scam', 'fake',
  ];

  constructor(private readonly configService: ConfigService) {
    this.autoApprovalThreshold = this.configService.get<number>('AUTO_APPROVAL_THRESHOLD', 85);
  }

  async validateContent(content: Content): Promise<ValidationResults> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const automatedChecks = {
      hasValidContent: this.validateContentData(content, errors),
      hasDescription: this.validateDescription(content, warnings),
      hasValidCategory: this.validateCategory(content, warnings),
      passesQualityCheck: false,
      hasValidMedia: true,
      hasCompleteMetadata: this.validateMetadata(content, warnings),
      noProfanity: this.checkProfanity(content),
      notSpam: this.checkSpam(content),
      notDuplicate: true,
    };

    if (automatedChecks.hasValidContent) score += 30;
    if (automatedChecks.hasDescription) score += 15;
    if (automatedChecks.hasValidCategory) score += 15;
    if (automatedChecks.hasCompleteMetadata) score += 5;

    const qualityScore = this.calculateQualityScore(content);
    automatedChecks.passesQualityCheck = qualityScore >= 60;
    if (automatedChecks.passesQualityCheck) {
      score += Math.min(25, Math.floor(qualityScore * 0.25));
    }

    if (automatedChecks.hasValidMedia) score += 10;

    if (!automatedChecks.noProfanity) {
      errors.push('Content contains inappropriate language');
      score -= 20;
    }

    if (!automatedChecks.notSpam) {
      errors.push('Content flagged as potential spam');
      score -= 30;
    }

    score = Math.max(0, Math.min(100, score));

    const autoApprovalEligible =
      score >= this.autoApprovalThreshold &&
      automatedChecks.noProfanity &&
      automatedChecks.notSpam &&
      automatedChecks.notDuplicate &&
      errors.length === 0;

    this.logger.log(
      `Validation complete for content ${content.id}: score=${score}, autoApprovalEligible=${autoApprovalEligible}`,
    );

    return {
      isValid: errors.length === 0 && score >= 50,
      score,
      errors,
      warnings,
      autoApprovalEligible,
      automatedChecks,
    };
  }

  private validateContentData(content: Content, errors: string[]): boolean {
    if (!content.title || content.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
      return false;
    }

    if (!content.content || Object.keys(content.content).length === 0) {
      errors.push('Content body is required');
      return false;
    }

    switch (content.contentType) {
      case ContentType.PUZZLE:
        return this.validatePuzzleContent(content, errors);
      case ContentType.ARTICLE:
        return this.validateArticleContent(content, errors);
      case ContentType.TUTORIAL:
        return this.validateTutorialContent(content, errors);
      case ContentType.CHALLENGE:
        return this.validateChallengeContent(content, errors);
      default:
        return true;
    }
  }

  private validatePuzzleContent(content: Content, errors: string[]): boolean {
    const puzzleContent = content.content;
    if (!puzzleContent.question) {
      errors.push('Puzzle must have a question');
      return false;
    }
    if (!puzzleContent.answer && !puzzleContent.solution) {
      errors.push('Puzzle must have an answer or solution');
      return false;
    }
    return true;
  }

  private validateArticleContent(content: Content, errors: string[]): boolean {
    const articleContent = content.content;
    if (!articleContent.body || articleContent.body.length < 100) {
      errors.push('Article body must be at least 100 characters');
      return false;
    }
    return true;
  }

  private validateTutorialContent(content: Content, errors: string[]): boolean {
    const tutorialContent = content.content;
    if (!tutorialContent.steps || !Array.isArray(tutorialContent.steps) || tutorialContent.steps.length < 2) {
      errors.push('Tutorial must have at least 2 steps');
      return false;
    }
    return true;
  }

  private validateChallengeContent(content: Content, errors: string[]): boolean {
    const challengeContent = content.content;
    if (!challengeContent.objective) {
      errors.push('Challenge must have an objective');
      return false;
    }
    if (!challengeContent.criteria || !Array.isArray(challengeContent.criteria)) {
      errors.push('Challenge must have success criteria');
      return false;
    }
    return true;
  }

  private validateDescription(content: Content, warnings: string[]): boolean {
    if (!content.description || content.description.length < 50) {
      warnings.push('Description should be at least 50 characters for better discoverability');
      return false;
    }
    return true;
  }

  private validateCategory(content: Content, warnings: string[]): boolean {
    if (!content.category) {
      warnings.push('Adding a category improves content organization');
      return false;
    }
    return true;
  }

  private validateMetadata(content: Content, warnings: string[]): boolean {
    if (!content.metadata) {
      warnings.push('Adding metadata (like difficulty level) improves user experience');
      return false;
    }
    return true;
  }

  private checkProfanity(content: Content): boolean {
    const textToCheck = `${content.title} ${content.description || ''} ${JSON.stringify(content.content)}`.toLowerCase();

    for (const word of this.profanityList) {
      if (textToCheck.includes(word)) {
        return false;
      }
    }
    return true;
  }

  private checkSpam(content: Content): boolean {
    const textToCheck = `${content.title} ${content.description || ''}`;

    const urlCount = (textToCheck.match(/https?:\/\//g) || []).length;
    if (urlCount > 5) return false;

    const repeatedChars = /(.)\1{10,}/;
    if (repeatedChars.test(textToCheck)) return false;

    const capsRatio = (textToCheck.match(/[A-Z]/g) || []).length / textToCheck.length;
    if (capsRatio > 0.7 && textToCheck.length > 20) return false;

    return true;
  }

  private calculateQualityScore(content: Content): number {
    let score = 0;

    if (content.title.length >= 10) score += 10;
    if (content.title.length >= 30) score += 5;

    if (content.description) {
      if (content.description.length >= 100) score += 15;
      if (content.description.length >= 300) score += 10;
    }

    if (content.tags && content.tags.length >= 3) score += 10;

    if (content.category) score += 10;

    if (content.metadata) {
      const metadataKeys = Object.keys(content.metadata);
      score += Math.min(20, metadataKeys.length * 5);
    }

    if (content.content) {
      const contentStr = JSON.stringify(content.content);
      if (contentStr.length >= 500) score += 10;
      if (contentStr.length >= 2000) score += 10;
    }

    return Math.min(100, score);
  }
}
