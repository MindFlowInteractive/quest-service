export interface UserDataExport {
  userId: string;
  exportDate: string;
  version: string;
  exportFormat: string;
  personalInfo: {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    country?: string;
    avatar?: string;
    createdAt: string;
    lastLoginAt?: string;
    isVerified?: boolean;
  };
  profile?: {
    bio?: string;
    website?: string;
    socialLinks?: Record<string, string>;
    level?: number;
    experience?: number;
    totalScore?: number;
    preferences?: any;
  };
  gameData?: {
    sessions: any[];
    achievements: any[];
    progress: any[];
    statistics: any;
    puzzleCompletions?: any[];
    skillRatings?: any[];
  };
  wallet?: {
    addresses: any[];
    balanceHistory?: any[];
  };
  notifications?: {
    preferences: any;
    history: any[];
  };
  socialData?: {
    friends: any[];
    friendRequests?: any[];
    activities?: any[];
  };
  privacySettings?: any;
  consentHistory?: any[];
  transactions?: any[];
}

export interface AnonymizationResult {
  userId: string;
  anonymizedUserId: string;
  entitiesProcessed: string[];
  recordsDeleted: number;
  recordsAnonymized: number;
  completedAt: Date;
}

export interface DataRetentionPolicy {
  entityType: string;
  retentionDays: number;
  anonymizeAfterDays?: number;
  deleteAfterDays?: number;
}
