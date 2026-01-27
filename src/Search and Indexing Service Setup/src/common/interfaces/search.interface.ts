export interface Puzzle {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  category: string;
  tags: string[];
  rating: number;
  playCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Player {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  level: number;
  experience: number;
  totalScore: number;
  puzzlesSolved: number;
  achievements: string[];
  joinedAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  iconUrl?: string;
  requirements: Record<string, any>;
  unlockedBy: number;
  createdAt: Date;
  isActive: boolean;
}

export interface SearchResult<T> {
  hits: SearchHit<T>[];
  total: number;
  took: number;
  aggregations?: Record<string, any>;
}

export interface SearchHit<T> {
  id: string;
  score: number;
  source: T;
  highlight?: Record<string, string[]>;
}

export interface SearchQuery {
  query?: string;
  filters?: Record<string, any>;
  page?: number;
  size?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface AutocompleteResult {
  text: string;
  score: number;
  category?: string;
}

export interface IndexingResult {
  success: boolean;
  indexed: number;
  failed: number;
  errors?: string[];
}
