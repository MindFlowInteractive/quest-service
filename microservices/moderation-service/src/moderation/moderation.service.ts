import { Injectable } from '@nestjs/common';

@Injectable()
export class ModerationService {
    // Common profanity words (in production, use a comprehensive library like bad-words)
    private readonly profanityList = [
        'badword', 'offensive', 'slur', 'hate', 'racist',
        'sexist', 'harassment', 'threat', 'abuse',
    ];

    // Spam indicators
    private readonly spamPatterns = [
        /(.)\1{10,}/,                           // Repeated characters (aaaaaaaaaa)
        /https?:\/\/[^\s]+/gi,                  // URLs (multiple links = likely spam)
        /\b(buy|free|click|winner|prize)\b/gi,  // Common spam words
        /[\u{1F300}-\u{1F9FF}]{5,}/u,           // Excessive emojis
    ];

    containsProfanity(text: string): boolean {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return this.profanityList.some((word) => lowerText.includes(word));
    }

    isSpam(text: string): boolean {
        if (!text) return false;

        // Check for excessive length
        if (text.length > 5000) {
            return true;
        }

        // Check for repeated content
        const words = text.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        if (words.length > 20 && uniqueWords.size / words.length < 0.3) {
            return true; // More than 70% duplicate words
        }

        // Count URL matches
        const urlMatches = text.match(/https?:\/\/[^\s]+/gi) || [];
        if (urlMatches.length > 3) {
            return true; // Too many URLs
        }

        // Check spam patterns
        for (const pattern of this.spamPatterns) {
            if (pattern.test(text)) {
                // Reset lastIndex for global patterns
                pattern.lastIndex = 0;

                // URLs alone don't make it spam, need multiple
                if (pattern.source.includes('http') && urlMatches.length <= 1) {
                    continue;
                }

                // Spam keywords need multiple occurrences
                const matches = text.match(pattern);
                if (matches && matches.length >= 3) {
                    return true;
                }
            }
        }

        return false;
    }

    analyzeContent(text: string): {
        hasProfanity: boolean;
        isSpam: boolean;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE';
        reasons: string[];
    } {
        const reasons: string[] = [];
        const hasProfanity = this.containsProfanity(text);
        const isSpam = this.isSpam(text);

        if (hasProfanity) {
            reasons.push('Contains profanity or offensive language');
        }
        if (isSpam) {
            reasons.push('Detected as spam');
        }

        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE' = 'NONE';
        if (hasProfanity && isSpam) {
            severity = 'HIGH';
        } else if (hasProfanity) {
            severity = 'MEDIUM';
        } else if (isSpam) {
            severity = 'LOW';
        }

        return { hasProfanity, isSpam, severity, reasons };
    }
}
