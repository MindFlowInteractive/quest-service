import * as request from 'supertest';

// Smoke test utilities
global.smokeTestUtils = {
  checkEndpointHealth: async (app: any, endpoint: string, expectedStatus: number = 200) => {
    const response = await request(app)
      .get(endpoint)
      .expect(expectedStatus);
    
    return response;
  },

  checkDatabaseConnection: async (dataSource: any) => {
    try {
      await dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  },

  checkRedisConnection: async (redisClient: any) => {
    try {
      await redisClient.ping();
      return true;
    } catch (error) {
      console.error('Redis connection failed:', error);
      return false;
    }
  },

  checkEnvironmentVariables: (requiredVars: string[]) => {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    return true;
  },

  checkApiResponse: (response: any, expectedFields: string[]) => {
    const missingFields = expectedFields.filter(field => !(field in response.body));
    
    if (missingFields.length > 0) {
      throw new Error(`API response missing required fields: ${missingFields.join(', ')}`);
    }
    
    return true;
  }
};

// Common smoke test configurations
global.smokeTestConfig = {
  endpoints: {
    health: '/health',
    api: '/api',
    puzzles: '/puzzles',
    users: '/users',
    auth: '/auth'
  },
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000
  },
  requiredEnvVars: [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'JWT_SECRET'
  ]
};

declare global {
  namespace NodeJS {
    interface Global {
      smokeTestUtils: {
        checkEndpointHealth: (app: any, endpoint: string, expectedStatus?: number) => Promise<any>;
        checkDatabaseConnection: (dataSource: any) => Promise<boolean>;
        checkRedisConnection: (redisClient: any) => Promise<boolean>;
        checkEnvironmentVariables: (requiredVars: string[]) => boolean;
        checkApiResponse: (response: any, expectedFields: string[]) => boolean;
      };
      smokeTestConfig: {
        endpoints: {
          health: string;
          api: string;
          puzzles: string;
          users: string;
          auth: string;
        };
        timeouts: {
          short: number;
          medium: number;
          long: number;
        };
        requiredEnvVars: string[];
      };
    }
  }
}
