export interface LoadBalancerEntity {
  id: string;
  name: string;
  routes: string[];
  defaultStrategy: string;
  createdAt: Date;
}
