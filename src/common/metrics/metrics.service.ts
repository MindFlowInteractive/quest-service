import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private registry: Registry;

  // HTTP Metrics
  private httpRequestsTotal: Counter<string>;
  private httpRequestDuration: Histogram<string>;

  // Business Metrics
  private gameSessionsTotal: Counter<string>;
  private gameSessionsActive: Gauge<string>;
  private puzzleCompletions: Counter<string>;
  private economyTransactions: Counter<string>;

  constructor() {
    this.registry = new Registry();
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // HTTP Request Metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });

    // Game Session Metrics
    this.gameSessionsTotal = new Counter({
      name: 'game_sessions_total',
      help: 'Total number of game sessions created',
      labelNames: ['user_id', 'puzzle_type'],
      registers: [this.registry],
    });

    this.gameSessionsActive = new Gauge({
      name: 'game_sessions_active',
      help: 'Number of active game sessions',
      labelNames: ['puzzle_type'],
      registers: [this.registry],
    });

    // Puzzle Completion Metrics
    this.puzzleCompletions = new Counter({
      name: 'puzzle_completions_total',
      help: 'Total number of puzzle completions',
      labelNames: ['puzzle_type', 'difficulty', 'user_id'],
      registers: [this.registry],
    });

    // Economy Transaction Metrics
    this.economyTransactions = new Counter({
      name: 'economy_transactions_total',
      help: 'Total number of economy transactions',
      labelNames: ['transaction_type', 'status', 'user_id'],
      registers: [this.registry],
    });
  }

  // HTTP Metrics Methods
  incrementHttpRequests(method: string, route: string, statusCode: string) {
    this.httpRequestsTotal
      .labels(method, route, statusCode)
      .inc();
  }

  recordHttpRequestDuration(method: string, route: string, statusCode: string, duration: number) {
    this.httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration);
  }

  // Game Session Metrics Methods
  incrementGameSessions(userId: string, puzzleType: string) {
    this.gameSessionsTotal
      .labels(userId, puzzleType)
      .inc();
  }

  setActiveGameSessions(puzzleType: string, count: number) {
    this.gameSessionsActive
      .labels(puzzleType)
      .set(count);
  }

  incrementPuzzleCompletions(puzzleType: string, difficulty: string, userId: string) {
    this.puzzleCompletions
      .labels(puzzleType, difficulty, userId)
      .inc();
  }

  // Economy Metrics Methods
  incrementEconomyTransactions(transactionType: string, status: string, userId: string) {
    this.economyTransactions
      .labels(transactionType, status, userId)
      .inc();
  }

  getRegistry(): Registry {
    return this.registry;
  }
}
