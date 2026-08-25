export interface ServiceDefinition {
  name: string;
  baseUrl: string;
  timeout: number;
  enabled: boolean;
}

export const SERVICE_REGISTRY: Record<string, ServiceDefinition> = {
  auth: {
    name: 'Authentication Service',
    baseUrl: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001',
    timeout: 5000,
    enabled: true,
  },

  quest: {
    name: 'Quest Service',
    baseUrl: process.env.QUEST_SERVICE_URL ?? 'http://localhost:3002',
    timeout: 5000,
    enabled: true,
  },

  analytics: {
    name: 'Analytics Service',
    baseUrl: process.env.ANALYTICS_SERVICE_URL ?? 'http://localhost:3003',
    timeout: 5000,
    enabled: true,
  },
};
