export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

export enum ExportCadence {
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export interface PlayerDataExport {
  schemaVersion: 1;
  exportedAt: string;
  player: {
    id: string;
    email: string;
    username: string;
    isActive: boolean;
    lastLoginAt: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  profile: Record<string, unknown> | null;
  progress: Array<Record<string, unknown>>;
}
