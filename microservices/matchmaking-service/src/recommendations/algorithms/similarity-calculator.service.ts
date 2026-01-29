import { Injectable } from '@nestjs/common';

export interface UserSimilarity {
  userId: string;
  similarity: number;
}

@Injectable()
export class SimilarityCalculatorService {
  /**
   * Calculate Jaccard similarity between two sets of puzzle IDs
   */
  calculateJaccardSimilarity(setA: string[], setB: string[]): number {
    const intersection = setA.filter(id => setB.includes(id));
    const union = [...new Set([...setA, ...setB])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  /**
   * Calculate cosine similarity between two preference vectors
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  calculatePearsonCorrelation(ratingsA: number[], ratingsB: number[]): number {
    if (ratingsA.length !== ratingsB.length || ratingsA.length === 0) {
      return 0;
    }

    const n = ratingsA.length;
    const sumA = ratingsA.reduce((sum, rating) => sum + rating, 0);
    const sumB = ratingsB.reduce((sum, rating) => sum + rating, 0);
    const meanA = sumA / n;
    const meanB = sumB / n;

    let numerator = 0;
    let sumSquareA = 0;
    let sumSquareB = 0;

    for (let i = 0; i < n; i++) {
      const diffA = ratingsA[i] - meanA;
      const diffB = ratingsB[i] - meanB;
      numerator += diffA * diffB;
      sumSquareA += diffA * diffA;
      sumSquareB += diffB * diffB;
    }

    const denominator = Math.sqrt(sumSquareA * sumSquareB);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Find top K similar items from a list of similarities
   */
  getTopKSimilar<T extends { similarity: number }>(
    similarities: T[],
    k: number,
    minSimilarity: number = 0.1,
  ): T[] {
    return similarities
      .filter(item => item.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }
}