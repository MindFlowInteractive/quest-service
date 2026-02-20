import { Injectable } from '@nestjs/common';
import { DatabaseMonitoringService } from '../database/database-monitoring.service';

export function MonitorQuery(operation: string, table: string, thresholdMs?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const dbMonitor = this.databaseMonitoringService as DatabaseMonitoringService;
      
      if (!dbMonitor) {
        // If database monitoring service isn't available, just run the original method
        return await method.apply(this, args);
      }

      return await dbMonitor.monitorQuery(
        operation,
        table,
        async () => await method.apply(this, args),
        thresholdMs || 100,
      );
    };

    return descriptor;
  };
}

/**
 * Decorator factory to monitor database queries automatically
 */
export function AutoMonitorQuery(thresholdMs: number = 100) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const dbMonitor = this.databaseMonitoringService as DatabaseMonitoringService;
      
      if (!dbMonitor) {
        return await method.apply(this, args);
      }

      // Try to infer operation and table from method name
      const methodName = propertyName.toLowerCase();
      let operation = 'UNKNOWN';
      let table = 'UNKNOWN';

      if (methodName.includes('find') || methodName.includes('get') || methodName.includes('select')) {
        operation = 'SELECT';
      } else if (methodName.includes('create') || methodName.includes('insert') || methodName.includes('add')) {
        operation = 'INSERT';
      } else if (methodName.includes('update') || methodName.includes('modify')) {
        operation = 'UPDATE';
      } else if (methodName.includes('delete') || methodName.includes('remove')) {
        operation = 'DELETE';
      }

      // Extract table name from service name or method
      const serviceName = target.constructor.name;
      if (serviceName.toLowerCase().includes('user')) {
        table = 'users';
      } else if (serviceName.toLowerCase().includes('quest')) {
        table = 'quests';
      } else if (serviceName.toLowerCase().includes('energy')) {
        table = 'energy';
      } else if (serviceName.toLowerCase().includes('streak')) {
        table = 'streaks';
      }

      return await dbMonitor.monitorQuery(
        operation,
        table,
        async () => await method.apply(this, args),
        thresholdMs,
      );
    };

    return descriptor;
  };
}