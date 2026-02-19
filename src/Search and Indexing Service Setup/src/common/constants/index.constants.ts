export const INDEX_NAMES = {
  PUZZLES: process.env.PUZZLES_INDEX || "puzzles",
  PLAYERS: process.env.PLAYERS_INDEX || "players",
  ACHIEVEMENTS: process.env.ACHIEVEMENTS_INDEX || "achievements",
  ANALYTICS: process.env.ANALYTICS_INDEX || "search_analytics",
};

export const INDEX_MAPPINGS = {
  PUZZLES: {
    properties: {
      id: { type: "keyword" },
      title: {
        type: "text",
        analyzer: "standard",
        fields: {
          keyword: { type: "keyword" },
          completion: {
            type: "completion",
            analyzer: "simple",
          },
        },
      },
      description: {
        type: "text",
        analyzer: "standard",
      },
      difficulty: { type: "keyword" },
      category: {
        type: "keyword",
        fields: {
          text: { type: "text" },
        },
      },
      tags: { type: "keyword" },
      rating: { type: "float" },
      playCount: { type: "integer" },
      createdBy: { type: "keyword" },
      createdAt: { type: "date" },
      updatedAt: { type: "date" },
      isActive: { type: "boolean" },
    },
  },
  PLAYERS: {
    properties: {
      id: { type: "keyword" },
      username: {
        type: "text",
        analyzer: "standard",
        fields: {
          keyword: { type: "keyword" },
          completion: {
            type: "completion",
            analyzer: "simple",
          },
        },
      },
      email: { type: "keyword" },
      displayName: {
        type: "text",
        analyzer: "standard",
        fields: {
          keyword: { type: "keyword" },
        },
      },
      bio: { type: "text" },
      level: { type: "integer" },
      experience: { type: "long" },
      totalScore: { type: "long" },
      puzzlesSolved: { type: "integer" },
      achievements: { type: "keyword" },
      joinedAt: { type: "date" },
      lastActiveAt: { type: "date" },
      isActive: { type: "boolean" },
    },
  },
  ACHIEVEMENTS: {
    properties: {
      id: { type: "keyword" },
      title: {
        type: "text",
        analyzer: "standard",
        fields: {
          keyword: { type: "keyword" },
          completion: {
            type: "completion",
            analyzer: "simple",
          },
        },
      },
      description: {
        type: "text",
        analyzer: "standard",
      },
      category: { type: "keyword" },
      points: { type: "integer" },
      rarity: { type: "keyword" },
      iconUrl: { type: "keyword" },
      requirements: { type: "object", enabled: false },
      unlockedBy: { type: "integer" },
      createdAt: { type: "date" },
      isActive: { type: "boolean" },
    },
  },
  ANALYTICS: {
    properties: {
      id: { type: "keyword" },
      query: { type: "text" },
      index: { type: "keyword" },
      resultsCount: { type: "integer" },
      responseTime: { type: "long" },
      filters: { type: "object", enabled: false },
      userId: { type: "keyword" },
      timestamp: { type: "date" },
      clickedResults: { type: "keyword" },
    },
  },
};

export const INDEX_SETTINGS = {
  number_of_shards: 1,
  number_of_replicas: 1,
  analysis: {
    analyzer: {
      autocomplete: {
        type: 'custom' as const,
        tokenizer: "autocomplete",
        filter: ["lowercase"],
      },
      autocomplete_search: {
        type: 'custom' as const,
        tokenizer: "lowercase",
      },
    },
    tokenizer: {
      autocomplete: {
        type: "edge_ngram" as const,
        min_gram: 2,
        max_gram: 10,
        token_chars: ["letter", "digit"] as ("letter" | "digit")[],
      },
    },
  },
};
