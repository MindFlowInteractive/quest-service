export default () => ({
  sms: {
    provider: process.env.SMS_PROVIDER || 'console',
    defaultFrom: process.env.SMS_DEFAULT_FROM || 'Quest',
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      name: process.env.DB_NAME || 'sms_service',
      synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
      statusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL,
    },
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      senderId: process.env.AWS_SNS_SENDER_ID || 'Quest',
    },
    otp: {
      ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS || '300', 10),
      length: parseInt(process.env.OTP_LENGTH || '6', 10),
    },
    rateLimit: {
      max: parseInt(process.env.SMS_RATE_LIMIT_MAX || '5', 10),
      windowSeconds: parseInt(
        process.env.SMS_RATE_LIMIT_WINDOW_SECONDS || '60',
        10,
      ),
    },
  },
});
