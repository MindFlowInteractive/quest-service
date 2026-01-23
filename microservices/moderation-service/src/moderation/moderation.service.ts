import { Injectable } from '@nestjs/common';

@Injectable()
export class ModerationService {
    private readonly profanityList = ['badword', 'offensive']; // Example list

    containsProfanity(text: string): boolean {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return this.profanityList.some((word) => lowerText.includes(word));
    }

    // Placeholder for spam detection
    isSpam(text: string): boolean {
        // Simple length check or pattern match
        return text.length > 10000;
    }
}
