import { registerAs } from '@nestjs/config';

export default registerAs('sms', () => ({
  provider: process.env.SMS_PROVIDER || 'mock',
  defaultCountry: process.env.SMS_DEFAULT_COUNTRY || 'US',
  senderId: process.env.SMS_SENDER_ID || 'Quest',
  statusCallbackUrl: process.env.SMS_STATUS_CALLBACK_URL,
  debugExposeCodes: process.env.SMS_DEBUG_EXPOSE_CODES === 'true',

  rateLimit: {
    windowMinutes: parseInt(process.env.SMS_RATE_LIMIT_WINDOW_MINUTES || '10', 10),
    maxPerWindow: parseInt(process.env.SMS_RATE_LIMIT_MAX_PER_WINDOW || '20', 10),
    otpWindowMinutes: parseInt(
      process.env.SMS_OTP_RATE_LIMIT_WINDOW_MINUTES || '10',
      10,
    ),
    otpMaxPerWindow: parseInt(
      process.env.SMS_OTP_RATE_LIMIT_MAX_PER_WINDOW || '3',
      10,
    ),
  },

  dispatch: {
    intervalMs: parseInt(process.env.SMS_DISPATCH_INTERVAL_MS || '5000', 10),
    batchSize: parseInt(process.env.SMS_DISPATCH_BATCH_SIZE || '25', 10),
    retryBaseDelayMs: parseInt(process.env.SMS_RETRY_BASE_DELAY_MS || '60000', 10),
    maxRetries: parseInt(process.env.SMS_MAX_RETRIES || '3', 10),
  },

  otp: {
    length: parseInt(process.env.SMS_OTP_LENGTH || '6', 10),
    expiryMinutes: parseInt(process.env.SMS_OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.SMS_OTP_MAX_ATTEMPTS || '5', 10),
    secret: process.env.SMS_OTP_SECRET || 'sms-otp-secret',
    templateName: process.env.SMS_OTP_TEMPLATE_NAME || 'otp-verification',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  },

  sns: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    senderId: process.env.AWS_SNS_SENDER_ID || process.env.SMS_SENDER_ID || 'Quest',
  },
}));
