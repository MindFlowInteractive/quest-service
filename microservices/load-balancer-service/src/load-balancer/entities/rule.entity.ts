export interface RuleEntity {
  ruleId: string;
  route: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}
