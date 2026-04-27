export class ReportStatsDto {
  openCount: number;
  averageResolutionTime: number;
  reportsByType: Record<string, number>;
  totalReports: number;
  resolvedToday: number;
  escalatedReports: number;
}
