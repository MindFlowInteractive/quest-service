export interface RouteEntity {
  route: string;
  strategy: string;
  targetInstances: string[];
  cachedTarget?: string;
  cacheTtlSeconds: number;
}
