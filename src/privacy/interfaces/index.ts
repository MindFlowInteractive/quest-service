export interface UserDataExport {
  userId: string;
  exportDate: string;
  version: string;
  personalInfo: {
    email: string;
    username: string;
    createdAt: string;
    lastLoginAt?: string;
  };
  profile?: any;
  gameData?: {
    sessions: any[];
    achievements: any[];
    progress: any[];
    statistics: any;
  };
  transactions?: any[];
  socialData?: {
    friends: any[];
    messages: any[];
    activities: any[];
  };
  privacySettings?: any;
  consentHistory?: any[];
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

