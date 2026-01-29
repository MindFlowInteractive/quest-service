import { performance } from 'perf_hooks';

// Performance test utilities
global.performanceTestUtils = {
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    
    return { result, duration };
  },

  expectExecutionTime: (duration: number, maxDuration: number, operation: string) => {
    if (duration > maxDuration) {
      throw new Error(`Performance test failed: ${operation} took ${duration.toFixed(2)}ms, expected < ${maxDuration}ms`);
    }
  },

  measureMemoryUsage: () => {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed / 1024 / 1024, // MB
      heapTotal: memUsage.heapTotal / 1024 / 1024, // MB
      external: memUsage.external / 1024 / 1024, // MB
      rss: memUsage.rss / 1024 / 1024, // MB
    };
  },

  expectMemoryUsage: (memoryMB: number, maxMemoryMB: number, operation: string) => {
    if (memoryMB > maxMemoryMB) {
      throw new Error(`Memory test failed: ${operation} used ${memoryMB.toFixed(2)}MB, expected < ${maxMemoryMB}MB`);
    }
  }
};

// Performance benchmarks
global.performanceBenchmarks = {
  database: {
    simpleQuery: 50, // ms
    complexQuery: 200, // ms
    bulkInsert: 500, // ms
    bulkUpdate: 300, // ms
  },
  api: {
    simpleEndpoint: 100, // ms
    complexEndpoint: 500, // ms
    bulkOperation: 1000, // ms
  },
  memory: {
    maxHeapUsage: 100, // MB
    maxMemoryLeak: 10, // MB per operation
  }
};

declare global {
  namespace NodeJS {
    interface Global {
      performanceTestUtils: {
        measureExecutionTime: <T>(fn: () => Promise<T>) => Promise<{ result: T; duration: number }>;
        expectExecutionTime: (duration: number, maxDuration: number, operation: string) => void;
        measureMemoryUsage: () => { heapUsed: number; heapTotal: number; external: number; rss: number };
        expectMemoryUsage: (memoryMB: number, maxMemoryMB: number, operation: string) => void;
      };
      performanceBenchmarks: {
        database: {
          simpleQuery: number;
          complexQuery: number;
          bulkInsert: number;
          bulkUpdate: number;
        };
        api: {
          simpleEndpoint: number;
          complexEndpoint: number;
          bulkOperation: number;
        };
        memory: {
          maxHeapUsage: number;
          maxMemoryLeak: number;
        };
      };
    }
  }
}
