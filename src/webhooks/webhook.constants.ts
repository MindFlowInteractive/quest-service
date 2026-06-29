export const SUPPORTED_WEBHOOK_EVENTS = [
  'puzzle.solved',
  'achievement.unlocked',
  'session.ended',
  'user.registered',
  'leaderboard.updated',
] as const;

export type WebhookEvent = (typeof SUPPORTED_WEBHOOK_EVENTS)[number];

export const WEBHOOK_INTERNAL_EVENTS = {
  puzzleSolved: 'webhook.puzzle.solved',
  achievementUnlocked: 'webhook.achievement.unlocked',
  sessionEnded: 'webhook.session.ended',
  userRegistered: 'webhook.user.registered',
  leaderboardUpdated: 'webhook.leaderboard.updated',
} as const;

export const WEBHOOK_QUEUE = 'webhook-delivery';
export const WEBHOOK_JOB = 'deliver-webhook';
export const WEBHOOK_MAX_RETRIES = 3;
export const WEBHOOK_TOTAL_ATTEMPTS = WEBHOOK_MAX_RETRIES + 1;
export const WEBHOOK_INITIAL_RETRY_DELAY_MS = 1000;
export const WEBHOOK_DELIVERY_RETENTION_LIMIT = 100;
export const WEBHOOK_DELIVERY_TTL_DAYS = 30;