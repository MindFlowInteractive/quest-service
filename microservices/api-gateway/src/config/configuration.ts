export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },

    services: {
        social: {
            url: process.env.SOCIAL_SERVICE_URL || 'http://localhost:3001',
            prefix: '/api/social',
            healthPath: '/health',
        },
        quest: {
            url: process.env.QUEST_SERVICE_URL || 'http://localhost:3002',
            prefix: '/api/quest',
            healthPath: '/health',
        },
    },

    rateLimit: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
        limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
        limitAuthenticated:
            parseInt(process.env.RATE_LIMIT_MAX_AUTHENTICATED, 10) || 200,
    },

    circuitBreaker: {
        timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT, 10) || 5000,
        errorThresholdPercentage:
            parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD, 10) || 50,
        resetTimeout:
            parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT, 10) || 30000,
        volumeThreshold:
            parseInt(process.env.CIRCUIT_BREAKER_MIN_REQUESTS, 10) || 10,
    },

    cors: {
        origins: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',')
            : ['http://localhost:3000'],
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        fileEnabled: process.env.LOG_FILE_ENABLED === 'true',
    },

    healthCheck: {
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000,
    },
});
