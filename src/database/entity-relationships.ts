// This file contains relationship configurations that need to be loaded after all entities
// It helps avoid circular dependency issues between entities

import { User } from '../users/entities/user.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { PuzzleProgress } from '../game-logic/entities/puzzle-progress.entity';

// This will be used by the ORM to establish relationships
// The actual relationships are defined in the individual entity files
// This file serves as documentation and type checking for relationships

export const EntityRelationships = {
  User: {
    achievements: 'OneToMany:UserAchievement',
    gameSessions: 'OneToMany:GameSession',
    puzzleProgress: 'OneToMany:PuzzleProgress',
    stats: 'OneToOne:UserStats',
    ratings: 'OneToMany:PuzzleRating'
  },
  
  Puzzle: {
    progress: 'OneToMany:PuzzleProgress',
    ratings: 'OneToMany:PuzzleRating',
    parentPuzzle: 'ManyToOne:Puzzle',
    childPuzzles: 'OneToMany:Puzzle',
    creator: 'ManyToOne:User'
  },
  
  PuzzleProgress: {
    user: 'ManyToOne:User',
    puzzle: 'ManyToOne:Puzzle'
  },
  
  Achievement: {
    userAchievements: 'OneToMany:UserAchievement'
  },
  
  UserAchievement: {
    user: 'ManyToOne:User',
    achievement: 'ManyToOne:Achievement'
  },
  
  GameSession: {
    user: 'ManyToOne:User'
  },
  
  PuzzleRating: {
    user: 'ManyToOne:User',
    puzzle: 'ManyToOne:Puzzle'
  },
  
  UserStats: {
    user: 'OneToOne:User'
  }
};
