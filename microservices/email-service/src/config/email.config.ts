import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  provider: process.env.EMAIL_PROVIDER || 'sendgrid',

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@questservice.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Quest Service',
  },

  ses: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    fromEmail: process.env.SES_FROM_EMAIL || 'noreply@questservice.com',
    fromName: process.env.SES_FROM_NAME || 'Quest Service',
  },

  queue: {
    maxRetries: parseInt(process.env.EMAIL_QUEUE_MAX_RETRIES || '5', 10),
    initialDelay: parseInt(process.env.EMAIL_QUEUE_INITIAL_DELAY || '1000', 10),
    maxDelay: parseInt(process.env.EMAIL_QUEUE_MAX_DELAY || '300000', 10),
    backoffMultiplier: parseInt(process.env.EMAIL_QUEUE_BACKOFF_MULTIPLIER || '2', 10),
  },

  tracking: {
    enabled: process.env.TRACKING_ENABLED === 'true',
    pixelUrl: process.env.TRACKING_PIXEL_URL,
  },

  unsubscribe: {
    baseUrl: process.env.UNSUBSCRIBE_BASE_URL,
    tokenExpiry: process.env.UNSUBSCRIBE_TOKEN_EXPIRY || '30d',
  },

  rateLimit: {
    maxPerMinute: parseInt(process.env.RATE_LIMIT_MAX_EMAILS_PER_MINUTE || '100', 10),
    maxPerHour: parseInt(process.env.RATE_LIMIT_MAX_EMAILS_PER_HOUR || '1000', 10),
  },

  webhook: {
    secret: process.env.WEBHOOK_SECRET,
  },
}));
