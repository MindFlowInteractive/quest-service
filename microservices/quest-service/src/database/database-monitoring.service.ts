import { Injectable, Logger } from '@nestjs/common';
import { PerformanceService } from '../performance/performance.service';

@Injectable()
export class DatabaseMonitoringService {
  private readonly logger = new Logger(DatabaseMonitoringService.name);

  constructor(private performanceService: PerformanceService) {}

  /**
   * Monitor a database query execution
   */
  async monitorQuery<T>(
    operation: string,
    table: string,
    queryFn: () => Promise<T>,
    thresholdMs = 100,
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;

    try {
      const result = await queryFn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      
      // Record the query time
      this.performanceService.recordDbQueryTime(
        operation,
        table,
        success,
        duration,
        thresholdMs,
      );

      // Log slow queries
      if (duration > thresholdMs) {
        this.logger.warn(
          `Slow database query detected: ${operation} on ${table} took ${duration}ms`,
        );
        
        // Provide query optimization suggestions
        this.provideOptimizationSuggestions(operation, table, duration);
      }
    }
  }

  /**
   * Provide query optimization suggestions
   */
  private provideOptimizationSuggestions(
    operation: string,
    table: string,
    duration: number,
  ): void {
    const suggestions = [];

    // General suggestions based on operation type
    switch (operation.toLowerCase()) {
      case 'select':
        suggestions.push(
          'Consider adding indexes on frequently queried columns',
          'Review the WHERE clause for potential optimizations',
          'Check if you can limit the result set size',
        );
        break;
      case 'insert':
        suggestions.push(
          'Batch multiple inserts together if possible',
          'Ensure auto-increment fields are properly indexed',
        );
        break;
      case 'update':
        suggestions.push(
          'Verify that the WHERE clause uses indexed columns',
          'Consider breaking large updates into smaller batches',
        );
        break;
      case 'delete':
        suggestions.push(
          'Ensure the WHERE clause uses indexed columns',
          'Consider soft deletes if applicable',
        );
        break;
    }

    // Duration-based suggestions
    if (duration > 1000) {
      suggestions.push(
        'Query is taking more than 1 second - consider optimization urgently',
        'Check for missing indexes or table locks',
      );
    } else if (duration > 500) {
      suggestions.push(
        'Query is taking more than 500ms - consider optimization',
        'Review the query execution plan',
      );
    }

    this.logger.log(
      `Query optimization suggestions for ${operation} on ${table}: ${suggestions.join('; ')}`,
    );
  }

  /**
   * Monitor raw SQL query
   */
  async monitorRawQuery<T>(
    sql: string,
    params: any[],
    queryFn: () => Promise<T>,
    thresholdMs = 100,
  ): Promise<T> {
    const operation = this.extractOperationFromSQL(sql);
    const table = this.extractTableFromSQL(sql);

    return this.monitorQuery(
      operation || 'unknown',
      table || 'unknown',
      queryFn,
      thresholdMs,
    );
  }

  /**
   * Extract operation type from SQL query
   */
  private extractOperationFromSQL(sql: string): string {
    const trimmedSql = sql.trim().toUpperCase();
    
    if (trimmedSql.startsWith('SELECT')) return 'SELECT';
    if (trimmedSql.startsWith('INSERT')) return 'INSERT';
    if (trimmedSql.startsWith('UPDATE')) return 'UPDATE';
    if (trimmedSql.startsWith('DELETE')) return 'DELETE';
    if (trimmedSql.startsWith('CREATE')) return 'CREATE';
    if (trimmedSql.startsWith('ALTER')) return 'ALTER';
    if (trimmedSql.startsWith('DROP')) return 'DROP';
    
    return 'UNKNOWN';
  }

  /**
   * Extract table name from SQL query
   */
  private extractTableFromSQL(sql: string): string | null {
    const upperSql = sql.toUpperCase();
    
    // Match various patterns for table names
    const patterns = [
      /FROM\s+(\w+)/i,
      /INTO\s+(\w+)/i,
      /UPDATE\s+(\w+)/i,
      /DELETE\s+FROM\s+(\w+)/i,
      /TABLE\s+(\w+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = sql.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }
}