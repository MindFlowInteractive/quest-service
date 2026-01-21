/**
 * Social Service Database Schema
 *
 * This file documents the database schema for the social service microservice.
 * The schema is isolated in the 'social' PostgreSQL schema.
 *
 * Tables:
 * - friends: Bidirectional friend relationships
 * - friend_requests: Pending, accepted, or declined friend requests
 * - leaderboard_entries: Player rankings and scores per season
 * - multiplayer_rooms: Multiplayer game sessions
 */

export const SOCIAL_DB_SCHEMA = {
  tables: {
    friends: {
      description: 'Bidirectional friend relationships between users',
      columns: {
        id: 'UUID primary key',
        userId: 'UUID - user who has the friend',
        friendId: 'UUID - the friend being added',
        nickname: 'Optional nickname for the friend',
        isBlocked: 'Boolean indicating if friend is blocked',
        createdAt: 'Timestamp when friendship was established',
      },
      indices: ['userId', 'userId + friendId'],
    },

    friend_requests: {
      description: 'Pending, accepted, or declined friend requests',
      columns: {
        id: 'UUID primary key',
        requesterId: 'UUID - user sending the request',
        recipientId: 'UUID - user receiving the request',
        status: "ENUM: 'pending', 'accepted', 'declined'",
        createdAt: 'Timestamp when request was created',
        updatedAt: 'Timestamp when request status was updated',
      },
      indices: ['requesterId + recipientId', 'recipientId'],
    },

    leaderboard_entries: {
      description: 'Player rankings and scores per season',
      columns: {
        id: 'UUID primary key',
        userId: 'UUID - player user ID',
        seasonId: "String - season identifier (default: 'current')",
        score: 'BIGINT - player score in the season',
        rank: 'INTEGER - current rank in the season',
        wins: 'INTEGER - number of wins in season',
        losses: 'INTEGER - number of losses in season',
        displayName: 'Optional custom display name',
        createdAt: 'Timestamp when entry was created',
        updatedAt: 'Timestamp when entry was last updated',
      },
      indices: ['seasonId + rank', 'userId'],
    },

    multiplayer_rooms: {
      description: 'Multiplayer game session rooms',
      columns: {
        id: 'UUID primary key',
        ownerId: 'UUID - user who created/owns the room',
        name: 'VARCHAR - room display name',
        description: 'Optional room description',
        status: "ENUM: 'waiting', 'in_progress', 'completed', 'cancelled'",
        participants: 'UUID array - list of participant user IDs',
        maxPlayers: 'INTEGER - maximum number of players allowed',
        isPrivate: 'BOOLEAN - whether room is private',
        password: 'VARCHAR - optional password for private rooms',
        puzzleId: 'Optional UUID - associated puzzle',
        metadata: 'JSONB - custom metadata for the room',
        createdAt: 'Timestamp when room was created',
        updatedAt: 'Timestamp when room was last updated',
      },
      indices: ['ownerId', 'status'],
    },
  },

  relationships: {
    friends: {
      description: 'Bidirectional friendship between two users',
      cardinality: 'Many-to-many through userId/friendId',
    },
    friend_requests: {
      description:
        'One-way request from requester to recipient, can be accepted to create friendship',
      cardinality: 'One-to-one relationship',
    },
    leaderboard_entries: {
      description: 'Per-user, per-season ranking',
      cardinality: 'One entry per user per season',
    },
    multiplayer_rooms: {
      description: 'One owner, multiple participants',
      cardinality: 'One-to-many (owner to participants)',
    },
  },
};
