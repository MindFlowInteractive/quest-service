export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },

    services: {
        // Core Services
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
        
        // Game Services
        achievement: {
            url: process.env.ACHIEVEMENT_SERVICE_URL || 'http://localhost:3003',
            prefix: '/api/achievements',
            healthPath: '/health',
        },
        gameSession: {
            url: process.env.GAME_SESSION_SERVICE_URL || 'http://localhost:3004',
            prefix: '/api/game-sessions',
            healthPath: '/health',
        },
        puzzle: {
            url: process.env.PUZZLE_SERVICE_URL || 'http://localhost:3005',
            prefix: '/api/puzzles',
            healthPath: '/health',
        },
        
        // Content Services
        content: {
            url: process.env.CONTENT_SERVICE_URL || 'http://localhost:3006',
            prefix: '/api/content',
            healthPath: '/health',
        },
        
        // Economy Services
        economy: {
            url: process.env.ECONOMY_SERVICE_URL || 'http://localhost:3007',
            prefix: '/api/economy',
            healthPath: '/health',
        },
        reward: {
            url: process.env.REWARD_SERVICE_URL || 'http://localhost:3008',
            prefix: '/api/rewards',
            healthPath: '/health',
        },
        
        // Communication Services
        notification: {
            url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009',
            prefix: '/api/notifications',
            healthPath: '/health',
        },
        email: {
            url: process.env.EMAIL_SERVICE_URL || 'http://localhost:3010',
            prefix: '/api/emails',
            healthPath: '/health',
        },
        
        // Tournament Services
        tournament: {
            url: process.env.TOURNAMENT_SERVICE_URL || 'http://localhost:3011',
            prefix: '/api/tournaments',
            healthPath: '/health',
        },
        matchmaking: {
            url: process.env.MATCHMAKING_SERVICE_URL || 'http://localhost:3012',
            prefix: '/api/matchmaking',
            healthPath: '/health',
        },
        
        // Analytics Services
        analytics: {
            url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3013',
            prefix: '/api/analytics',
            healthPath: '/health',
        },
        recommendation: {
            url: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3014',
            prefix: '/api/recommendations',
            healthPath: '/health',
        },
        
        // Infrastructure Services
        cache: {
            url: process.env.CACHE_SERVICE_URL || 'http://localhost:3015',
            prefix: '/api/cache',
            healthPath: '/health',
        },
        websocket: {
            url: process.env.WEBSOCKET_SERVICE_URL || 'http://localhost:3016',
            prefix: '/api/websocket',
            healthPath: '/health',
        },
        moderation: {
            url: process.env.MODERATION_SERVICE_URL || 'http://localhost:3017',
            prefix: '/api/moderation',
            healthPath: '/health',
        },
        replay: {
            url: process.env.REPLAY_SERVICE_URL || 'http://localhost:3018',
            prefix: '/api/replays',
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
