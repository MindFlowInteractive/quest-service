import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { UserCollectionProgress } from './entities/user-collection-progress.entity';
import { User } from '../users/entities/user.entity'; // Adjust path if necessary
import { Collection } from '../puzzles/entities/collection.entity'; // Adjust path if necessary
import { Puzzle } from '../puzzles/entities/puzzle.entity'; // Adjust path if necessary
import { UserPuzzleCompletion } from '../users/entities/user-puzzle-completion.entity'; // Added import
import { UserStats } from '../users/entities/user-stats.entity'; // Added import

@Injectable()
export class UserCollectionProgressService {
  private readonly logger = new Logger(UserCollectionProgressService.name); // Added logger

  constructor(
    @InjectRepository(UserCollectionProgress)
    private readonly userProgressRepository: Repository<UserCollectionProgress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Collection)
    private readonly collectionsRepository: Repository<Collection>,
    @InjectRepository(Puzzle)
    private readonly puzzlesRepository: Repository<Puzzle>,
    @InjectRepository(UserPuzzleCompletion) // Added injection
    private readonly userPuzzleCompletionRepository: Repository<UserPuzzleCompletion>,
    @InjectRepository(UserStats) // Added injection
    private readonly userStatsRepository: Repository<UserStats>,
  ) {}

  async findAllForUser(userId: string): Promise<UserCollectionProgress[]> {
    // Ensure user exists
    await this.userRepository.findOneByOrFail({ id: userId });

    return this.userProgressRepository.find({
      where: { userId },
      relations: ['collection', 'completedPuzzles'], // Load related data
    });
  }

  async findOneForUser(userId: string, collectionId: string): Promise<UserCollectionProgress> {
    // Ensure user and collection exist
    await this.userRepository.findOneByOrFail({ id: userId });
    await this.collectionsRepository.findOneByOrFail({ id: collectionId });

    const progress = await this.userProgressRepository.findOne({
      where: { userId, collectionId },
      relations: ['collection', 'completedPuzzles'],
    });

    if (!progress) {
      // If no progress record exists, it means the user hasn't started this collection.
      // We can either return null/undefined or create a new progress record.
      // For now, let's return null if not found, and let the controllers handle display.
      // Or, we can create it implicitly here if needed:
      // return this.createInitialProgress(userId, collectionId);
      throw new NotFoundException(`User progress for collection "${collectionId}" not found for user "${userId}"`);
    }
    return progress;
  }

  // --- Core logic for updating progress ---

  /**
   * Initializes a new progress record for a user and collection when they start it.
   * This might be called implicitly when a user interacts with a collection for the first time.
   */
  async createInitialProgress(userId: string, collectionId: string): Promise<UserCollectionProgress> {
    const existingProgress = await this.userProgressRepository.findOne({ where: { userId, collectionId } });
    if (existingProgress) {
      return existingProgress; // Return existing if already started
    }

    const user = await this.userRepository.findOneByOrFail({ id: userId });
    const collection = await this.collectionsRepository.findOneByOrFail({ id: collectionId });

    // Load puzzles associated with the collection
    const collectionWithPuzzles = await this.collectionsRepository.findOne({
      where: { id: collectionId },
      relations: ['puzzles'],
    });

    const newProgress = this.userProgressRepository.create({
      user,
      collection: collectionWithPuzzles, // Assign the collection entity with puzzles
      userId: user.id,
      collectionId: collection.id,
      completedPuzzles: [],
      percentageComplete: 0,
      isCompleted: false,
    });

    return this.userProgressRepository.save(newProgress);
  }

  /**
   * Updates the user's progress for a specific collection when a puzzle is completed.
   * This is the crucial method that should be called by a puzzle completion handler.
   */
  async updateProgressOnPuzzleCompletion(userId: string, puzzleId: string): Promise<UserCollectionProgress | null> {
    // Find all collections this puzzle belongs to
    const collections = await this.collectionsRepository.find({
      where: { puzzles: { id: puzzleId } }, // Find collections where this puzzle is associated
      relations: ['puzzles', 'userProgress'], // Load associated puzzles and userProgress
    });

    if (!collections || collections.length === 0) {
      return null; // Puzzle not part of any tracked collection
    }

    let updatedProgress: UserCollectionProgress | null = null;

    for (const collection of collections) {
      // Find or create the user's progress for this specific collection
      let progress = await this.userProgressRepository.findOne({
        where: { userId, collectionId: collection.id },
        relations: ['collection', 'completedPuzzles'],
      });

      if (!progress) {
        // If no progress record, initialize it.
        progress = await this.createInitialProgress(userId, collection.id);
        // Re-fetch relations to ensure puzzles are loaded for this new progress record
        progress = await this.userProgressRepository.findOne({
          where: { id: progress.id },
          relations: ['collection', 'completedPuzzles'],
        });
      }

      // Check if this puzzle is already marked as completed for this progress record
      const isAlreadyCompleted = progress.completedPuzzles.some(p => p.id === puzzleId);

      if (!isAlreadyCompleted) {
        // Add the puzzle to the completed list
        progress.completedPuzzles.push(await this.puzzlesRepository.findOneByOrFail({ id: puzzleId }));

        // --- START: Record Puzzle Completion for Streak Tracking ---
        let newCompletion: UserPuzzleCompletion | null = null;
        try {
          const user = await this.userRepository.findOneByOrFail({ id: userId });
          const puzzleEntity = await this.puzzlesRepository.findOneByOrFail({ id: puzzleId });
          
          const completionRecord = this.userPuzzleCompletionRepository.create({
            user: user,
            puzzle: puzzleEntity,
            completedAt: new Date(),
            comboMultiplier: 1, // Placeholder, actual calculation for combos is deferred
          });
          newCompletion = await this.userPuzzleCompletionRepository.save(completionRecord);
        } catch (error) {
          this.logError('Failed to record user puzzle completion for streak tracking', error);
          // Continue with other progress updates even if streak recording fails
        }
        // --- END: Record Puzzle Completion for Streak Tracking ---

        // --- START: Update User Streak ---
        try {
          let userStats = await this.userStatsRepository.findOne({ where: { userId } });

          // If UserStats don't exist, create them.
          if (!userStats) {
            userStats = this.userStatsRepository.create({
              userId: userId, // Ensure userId is set
            });
            userStats = await this.userStatsRepository.save(userStats);
          }

          // Check if the current completion is consecutive
          const completionTime = newCompletion ? newCompletion.completedAt.getTime() : Date.now(); // Use now if newCompletion failed to save
          const lastActivityTime = userStats.lastActivityAt ? userStats.lastActivityAt.getTime() : 0;
          const timeDifferenceMillis = completionTime - lastActivityTime;

          const CONSECUTIVE_WINDOW_MILLIS = 5 * 60 * 1000; // 5 minutes

          if (userStats.lastActivityAt && timeDifferenceMillis < CONSECUTIVE_WINDOW_MILLIS) {
            userStats.currentStreak++;
          } else {
            userStats.currentStreak = 1; // Reset streak if not consecutive
          }

          if (userStats.currentStreak > userStats.longestStreak) {
            userStats.longestStreak = userStats.currentStreak;
          }

          userStats.lastActivityAt = new Date(completionTime); // Update last activity time to the actual completion time
          userStats.lastCalculatedAt = new Date(); // Update last calculated time

          await this.userStatsRepository.save(userStats);
        } catch (error) {
          this.logError('Failed to update user streak stats', error);
        }
        // --- END: Update User Streak ---


        // Recalculate completion percentage
        const totalPuzzlesInCollection = collection.puzzles.length;
        const completedCount = progress.completedPuzzles.length;
        progress.percentageComplete = Math.round((completedCount / totalPuzzlesInCollection) * 100);
        progress.isCompleted = progress.percentageComplete === 100;

        // Save the updated progress
        updatedProgress = await this.userProgressRepository.save(progress);
      }
    }
    return updatedProgress;
  }

  // Method to calculate percentage based on current completed puzzles and total puzzles in collection
  private calculatePercentage(
    completedPuzzlesCount: number,
    totalPuzzlesInCollection: number,
  ): number {
    if (totalPuzzlesInCollection === 0) return 0;
    return Math.round((completedPuzzlesCount / totalPuzzlesInCollection) * 100);
  }

  // You might need methods to get collection details, puzzle details etc.
  // For example, to get total puzzles in a collection:
  async getTotalPuzzlesForCollection(collectionId: string): Promise<number> {
    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId },
      relations: ['puzzles'],
    });
    return collection?.puzzles?.length || 0;
  }

  private logError(message: string, error: any): void {
    this.logger.error(message, error.stack, error.constructor.name);
  }
}
