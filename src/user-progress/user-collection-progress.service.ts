import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { UserCollectionProgress } from './entities/user-collection-progress.entity';
import { User } from '../users/entities/user.entity'; // Adjust path if necessary
import { Collection } from '../puzzles/entities/collection.entity'; // Adjust path if necessary
import { Puzzle } from '../puzzles/entities/puzzle.entity'; // Adjust path if necessary

@Injectable()
export class UserCollectionProgressService {
  constructor(
    @InjectRepository(UserCollectionProgress)
    private readonly userProgressRepository: Repository<UserCollectionProgress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Collection)
    private readonly collectionsRepository: Repository<Collection>,
    @InjectRepository(Puzzle)
    private readonly puzzlesRepository: Repository<Puzzle>,
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
        // This might happen if the user hasn't explicitly started the collection yet.
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
}
