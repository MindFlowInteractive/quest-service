import { Injectable, Logger } from '@nestjs/common';
import { ViolationCategory, Severity } from '../enums/moderation.enums';

export interface MLClassificationResult {
  toxicityScore: number;
  categories: Array<{ category: ViolationCategory; confidence: number }>;
  severity: Severity;
  requiresHumanReview: boolean;
}

@Injectable()
export class MLClassificationService {
  private readonly logger = new Logger(MLClassificationService.name);

  // Thresholds for automated decisions
  private readonly AUTO_REJECT_THRESHOLD = 0.9;
  private readonly AUTO_APPROVE_THRESHOLD = 0.1;
  private readonly HUMAN_REVIEW_THRESHOLD = 0.5;

  async classifyContent(
    content: string,
    contentType: string,
  ): Promise<MLClassificationResult> {
    // Heuristic-based ML simulation (in production, integrate with an actual ML API)
    const toxicityScore = this.computeToxicityScore(content);
    const categories = this.detectCategories(content, toxicityScore);
    const severity = this.scoresToSeverity(toxicityScore, categories);
    const requiresHumanReview = this.needsHumanReview(toxicityScore, categories);

    this.logger.debug(
      `Classified content type=${contentType} toxicity=${toxicityScore.toFixed(2)} categories=${categories.map((c) => c.category).join(',')}`,
    );

    return { toxicityScore, categories, severity, requiresHumanReview };
  }

  private computeToxicityScore(text: string): number {
    if (!text) return 0;
    let score = 0;
    const lower = text.toLowerCase();

    const highToxicTerms = ['hate', 'kill', 'murder', 'racist', 'slur', 'threat', 'abuse', 'suicide', 'self.harm'];
    const mediumToxicTerms = ['offensive', 'harassment', 'explicit', 'nsfw', 'vulgar', 'idiot', 'loser', 'stupid'];
    const lowToxicTerms = ['spam', 'scam', 'buy now', 'free money'];

    for (const term of highToxicTerms) {
      if (lower.includes(term)) score += 0.3;
    }
    for (const term of mediumToxicTerms) {
      if (lower.includes(term)) score += 0.15;
    }
    for (const term of lowToxicTerms) {
      if (lower.includes(term)) score += 0.05;
    }

    // Caps at 1.0
    return Math.min(1.0, score);
  }

  private detectCategories(
    text: string,
    toxicityScore: number,
  ): Array<{ category: ViolationCategory; confidence: number }> {
    const results: Array<{ category: ViolationCategory; confidence: number }> = [];
    const lower = text.toLowerCase();

    if (/\b(hate|racist|slur)\b/i.test(lower))
      results.push({ category: ViolationCategory.HATE_SPEECH, confidence: 0.85 });
    if (/\b(kill|murder|violence)\b/i.test(lower))
      results.push({ category: ViolationCategory.VIOLENCE, confidence: 0.8 });
    if (/\b(harassment|threat|abuse|bully)\b/i.test(lower))
      results.push({ category: ViolationCategory.HARASSMENT, confidence: 0.75 });
    if (/\b(suicide|self.harm|kill myself)\b/i.test(lower))
      results.push({ category: ViolationCategory.SELF_HARM, confidence: 0.95 });
    if (/\b(buy now|click here|free money|winner)\b/i.test(lower))
      results.push({ category: ViolationCategory.SPAM, confidence: 0.7 });
    if (/\b(offensive|explicit|nsfw|vulgar|obscene)\b/i.test(lower))
      results.push({ category: ViolationCategory.INAPPROPRIATE, confidence: 0.65 });
    if (/\b(badword|profanity|curse)\b/i.test(lower))
      results.push({ category: ViolationCategory.PROFANITY, confidence: 0.8 });

    // Add misinformation detection for low toxicity high confidence content with suspicious claims
    if (toxicityScore < 0.3 && /\b(fake|lie|hoax|conspiracy)\b/i.test(lower))
      results.push({ category: ViolationCategory.MISINFORMATION, confidence: 0.5 });

    return results;
  }

  private scoresToSeverity(
    score: number,
    categories: Array<{ category: ViolationCategory; confidence: number }>,
  ): Severity {
    const hasCritical = categories.some(
      (c) =>
        (c.category === ViolationCategory.SELF_HARM ||
          c.category === ViolationCategory.HATE_SPEECH) &&
        c.confidence > 0.7,
    );
    if (hasCritical || score >= 0.85) return Severity.CRITICAL;
    if (score >= 0.6) return Severity.HIGH;
    if (score >= 0.35) return Severity.MEDIUM;
    return Severity.LOW;
  }

  private needsHumanReview(
    score: number,
    categories: Array<{ category: ViolationCategory; confidence: number }>,
  ): boolean {
    if (score >= this.AUTO_REJECT_THRESHOLD) return false; // auto-reject
    if (score <= this.AUTO_APPROVE_THRESHOLD) return false; // auto-approve
    return score >= this.HUMAN_REVIEW_THRESHOLD || categories.length > 0;
  }

  shouldAutoReject(score: number): boolean {
    return score >= this.AUTO_REJECT_THRESHOLD;
  }

  shouldAutoApprove(score: number): boolean {
    return score <= this.AUTO_APPROVE_THRESHOLD;
  }
}
