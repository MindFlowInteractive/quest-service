import { registerAs } from '@nestjs/config';

export default registerAs('energy', () => ({
  // Default energy settings
  defaultMaxEnergy: parseInt(process.env.ENERGY_DEFAULT_MAX || '100', 10),
  defaultCurrentEnergy: parseInt(process.env.ENERGY_DEFAULT_CURRENT || '100', 10),
  
  // Regeneration settings
  defaultRegenerationRate: parseInt(process.env.ENERGY_REGEN_RATE || '1', 10),
  defaultRegenerationIntervalMinutes: parseInt(process.env.ENERGY_REGEN_INTERVAL_MINUTES || '30', 10),
  
  // Gift system settings
  maxGiftsSentPerDay: parseInt(process.env.ENERGY_MAX_GIFTS_SENT_PER_DAY || '5', 10),
  maxGiftsReceivedPerDay: parseInt(process.env.ENERGY_MAX_GIFTS_RECEIVED_PER_DAY || '10', 10),
  defaultGiftAmount: parseInt(process.env.ENERGY_DEFAULT_GIFT_AMOUNT || '10', 10),
  maxGiftAmount: parseInt(process.env.ENERGY_MAX_GIFT_AMOUNT || '50', 10),
  giftExpirationHours: parseInt(process.env.ENERGY_GIFT_EXPIRATION_HOURS || '24', 10),
  
  // Token refill settings
  energyPerToken: parseInt(process.env.ENERGY_PER_TOKEN || '10', 10),
  maxEnergyPerRefill: parseInt(process.env.ENERGY_MAX_PER_REFILL || '50', 10),
  maxTokensPerRefill: parseInt(process.env.ENERGY_MAX_TOKENS_PER_REFILL || '10', 10),
  
  // Puzzle energy costs
  puzzleEnergyCosts: {
    wordPuzzle: parseInt(process.env.ENERGY_COST_WORD_PUZZLE || '5', 10),
    patternMatching: parseInt(process.env.ENERGY_COST_PATTERN_MATCHING || '8', 10),
    spatial: parseInt(process.env.ENERGY_COST_SPATIAL || '10', 10),
    mathematical: parseInt(process.env.ENERGY_COST_MATHEMATICAL || '12', 10),
    sequence: parseInt(process.env.ENERGY_COST_SEQUENCE || '15', 10),
    logicGrid: parseInt(process.env.ENERGY_COST_LOGIC_GRID || '20', 10),
    custom: parseInt(process.env.ENERGY_COST_CUSTOM || '15', 10),
  },
  
  // Difficulty multipliers
  difficultyMultipliers: {
    beginner: parseFloat(process.env.ENERGY_DIFFICULTY_BEGINNER_MULTIPLIER || '0.6'),
    easy: parseFloat(process.env.ENERGY_DIFFICULTY_EASY_MULTIPLIER || '0.8'),
    medium: parseFloat(process.env.ENERGY_DIFFICULTY_MEDIUM_MULTIPLIER || '1.0'),
    hard: parseFloat(process.env.ENERGY_DIFFICULTY_HARD_MULTIPLIER || '1.3'),
    expert: parseFloat(process.env.ENERGY_DIFFICULTY_EXPERT_MULTIPLIER || '1.6'),
    master: parseFloat(process.env.ENERGY_DIFFICULTY_MASTER_MULTIPLIER || '2.0'),
    legendary: parseFloat(process.env.ENERGY_DIFFICULTY_LEGENDARY_MULTIPLIER || '2.5'),
    impossible: parseFloat(process.env.ENERGY_DIFFICULTY_IMPOSSIBLE_MULTIPLIER || '3.0'),
  },
  
  // Notification settings
  enableEnergyNotifications: process.env.ENERGY_ENABLE_NOTIFICATIONS !== 'false',
  notifyWhenFull: process.env.ENERGY_NOTIFY_WHEN_FULL !== 'false',
  notifyWhenLow: process.env.ENERGY_NOTIFY_WHEN_LOW !== 'false',
  lowEnergyThreshold: parseInt(process.env.ENERGY_LOW_THRESHOLD || '20', 10),
  
  // Cron job settings
  regenerationCronInterval: process.env.ENERGY_REGEN_CRON_INTERVAL || '*/5 * * * *', // Every 5 minutes
  cleanupCronInterval: process.env.ENERGY_CLEANUP_CRON_INTERVAL || '0 0 * * *', // Daily at midnight
}));