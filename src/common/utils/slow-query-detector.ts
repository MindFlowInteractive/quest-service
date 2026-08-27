/**
 * Detect slow database queries from profiling logs and suggest an
 * actionable index recommendation. (#412)
 */
export interface QueryLogEntry {
  sql: string;
  durationMs: number;
  table?: string;
}

export interface SlowQueryReport {
  sql: string;
  durationMs: number;
  recommendation: string;
}

export function detectSlowQueries(
  logs: QueryLogEntry[],
  thresholdMs = 200,
): SlowQueryReport[] {
  return logs
    .filter((log) => log.durationMs >= thresholdMs)
    .map((log) => ({
      sql: log.sql,
      durationMs: log.durationMs,
      recommendation: log.table
        ? `Consider adding an index on frequently filtered columns of "${log.table}"`
        : "Run EXPLAIN ANALYZE to identify missing indexes",
    }));
}

export function averageQueryDuration(logs: QueryLogEntry[]): number {
  if (logs.length === 0) return 0;
  return logs.reduce((sum, log) => sum + log.durationMs, 0) / logs.length;
}
