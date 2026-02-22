import { Injectable, Inject } from '@nestjs/common';
import {
  IFriendshipRepository,
  IUserService,
  ILeaderboardService,
} from '../../domain/repositories/repository-interfaces';

export interface RecommendationCandidate {
  userId: string;
  displayName: string;
  avatar?: string;
  mutualFriendsCount: number;
  sharedInterestsCount: number;
  skillProximity: number;
  interactionScore: number;
  recommendationScore: number;
  reason: string;
}

@Injectable()
export class RecommendationService {
  // Recommendation weights (tunable)
  private readonly WEIGHTS = {
    mutualFriends: 0.35,
    sharedInterests: 0.2,
    skillProximity: 0.2,
    interactionRecency: 0.15,
    socialDistance: 0.1,
  };

  constructor(
    @Inject('IFriendshipRepository')
    private friendshipRepo: IFriendshipRepository,
    @Inject('IUserService')
    private userService: IUserService,
    @Inject('ILeaderboardService')
    private leaderboardService: ILeaderboardService,
  ) {}

  /**
   * Generate friend recommendations for a user.
   * Uses multi-signal scoring: mutual friends, shared interests, skill proximity, interaction history.
   */
  async generateRecommendations(
    userId: string,
    limit: number = 10,
  ): Promise<RecommendationCandidate[]> {
    // Get user's current friends
    const friendships = await this.friendshipRepo.findFriendsOfUser(
      userId,
      10000,
    );
    const directFriendIds = new Set(friendships.map((f) => f.friendId.value));

    // Get candidates: friends of friends (2-hop)
    const candidates = new Set<string>();
    const secondHopDistances = new Map<string, number>();

    for (const friend of friendships) {
      const friendsOfFriend = await this.friendshipRepo.findFriendsOfUser(
        friend.friendId.value,
        1000,
      );

      for (const fof of friendsOfFriend) {
        const candidateId = fof.friendId.value;

        // Skip if already friend or self
        if (candidateId === userId || directFriendIds.has(candidateId)) {
          continue;
        }

        candidates.add(candidateId);

        // Track social distance for secondary ranking
        const currentDistance = secondHopDistances.get(candidateId) || 0;
        secondHopDistances.set(
          candidateId,
          currentDistance + 1,
        );
      }
    }

    if (candidates.size === 0) {
      return [];
    }

    // Score candidates
    const scoredCandidates: RecommendationCandidate[] = [];

    for (const candidateId of Array.from(candidates).slice(0, limit * 5)) {
      // Fetch candidate details
      const candidate = await this.userService.getUserById(candidateId);
      if (!candidate) continue;

      // Calculate signals
      const mutualFriendsCount = await this.friendshipRepo.getMutualFriendsCount(
        userId,
        candidateId,
      );

      const sharedInterestsCount = await this.calculateSharedInterests(
        userId,
        candidateId,
      ); // Mock implementation

      const skillProximity = await this.calculateSkillProximity(
        userId,
        candidateId,
      ); // Mock implementation

      const interactionScore = 0; // Would use interaction history

      // Calculate composite score
      const normalizedMutualFriends = Math.min(mutualFriendsCount / 10, 1);
      const normalizedSharedInterests = Math.min(sharedInterestsCount / 5, 1);
      const socialDistancePenalty =
        1 / (secondHopDistances.get(candidateId) || 1);

      const score =
        this.WEIGHTS.mutualFriends * normalizedMutualFriends +
        this.WEIGHTS.sharedInterests * normalizedSharedInterests +
        this.WEIGHTS.skillProximity * skillProximity +
        this.WEIGHTS.interactionRecency * interactionScore +
        this.WEIGHTS.socialDistance * socialDistancePenalty;

      // Determine reason (primary signal)
      let reason = 'mutual_friends';
      if (normalizedSharedInterests > normalizedMutualFriends) {
        reason = 'shared_interests';
      } else if (skillProximity > 0.7) {
        reason = 'skill_proximity';
      }

      scoredCandidates.push({
        userId: candidateId,
        displayName: candidate.displayName,
        avatar: candidate.avatar,
        mutualFriendsCount,
        sharedInterestsCount,
        skillProximity,
        interactionScore,
        recommendationScore: score,
        reason,
      });
    }

    // Sort by score descending
    scoredCandidates.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return scoredCandidates.slice(0, limit);
  }

  /**
   * Calculate shared interests between two users.
   * Mock implementation – in production, fetch from user profile service.
   */
  private async calculateSharedInterests(
    userId1: string,
    userId2: string,
  ): Promise<number> {
    // TODO: Call user service to get interests/tags, calculate overlap
    // For now, return a mock value
    return Math.random() * 5;
  }

  /**
   * Calculate skill proximity between two users.
   * Based on leaderboard position proximity.
   */
  private async calculateSkillProximity(
    userId1: string,
    userId2: string,
  ): Promise<number> {
    try {
      const [score1, score2] = await Promise.all([
        this.leaderboardService.getUserScore(userId1, 'elo'),
        this.leaderboardService.getUserScore(userId2, 'elo'),
      ]);

      if (!score1 || !score2) {
        return 0.5;
      }

      // Normalize proximity: max diff is assumed ~1000 elo
      const diff = Math.abs(score1.score - score2.score);
      const proximity = Math.max(0, 1 - diff / 1000);

      return proximity;
    } catch (error) {
      // Fallback if leaderboard not available
      return 0.5;
    }
  }

  /**
   * Batch generate recommendations for multiple users.
   * Useful for offline/nearline computation.
   */
  async generateRecommendationsBatch(
    userIds: string[],
    limit: number = 10,
  ): Promise<Map<string, RecommendationCandidate[]>> {
    const results = new Map<string, RecommendationCandidate[]>();

    for (const userId of userIds) {
      const recommendations = await this.generateRecommendations(userId, limit);
      results.set(userId, recommendations);
    }

    return results;
  }

  /**
   * Cache recommendations for faster serving.
   * Called periodically.
   */
  async cacheRecommendations(userId: string): Promise<void> {
    const recommendations = await this.generateRecommendations(userId, 20);
    // Store in cache (implement with ICacheService)
    // await this.cacheService.set(`recommendations:${userId}`, recommendations, 3600);
  }
}
