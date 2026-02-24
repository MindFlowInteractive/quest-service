import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BlockchainTransactionService } from './blockchain-transaction.service';
import { TransactionQueryDto, TransactionAnalyticsQueryDto } from './dto';
import { TransactionRetryService } from './services/transaction-retry.service';
import { TransactionAnalyticsService } from './services/transaction-analytics.service';
import { TransactionMonitorService } from './services/transaction-monitor.service';

@ApiTags('Blockchain Transactions')
@Controller('blockchain-transactions')
export class BlockchainTransactionController {
  private readonly logger = new Logger(BlockchainTransactionController.name);

  constructor(
    private readonly transactionService: BlockchainTransactionService,
    private readonly retryService: TransactionRetryService,
    private readonly analyticsService: TransactionAnalyticsService,
    private readonly monitorService: TransactionMonitorService,
  ) {}

  /**
   * Get all transactions with filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all blockchain transactions with filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated transactions' })
  async findAll(@Query() query: TransactionQueryDto) {
    return this.transactionService.findAll(query);
  }

  /**
   * Get transaction by hash
   */
  @Get(':hash')
  @ApiOperation({ summary: 'Get transaction by hash' })
  @ApiResponse({ status: 200, description: 'Returns transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Param('hash') hash: string) {
    return this.transactionService.findByHash(hash);
  }

  /**
   * Get transactions for a specific user
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get transactions for a specific user' })
  @ApiResponse({ status: 200, description: 'Returns user transactions' })
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.transactionService.findByUser(userId, query);
  }

  /**
   * Get transaction analytics
   */
  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get transaction analytics' })
  @ApiResponse({ status: 200, description: 'Returns analytics data' })
  async getAnalytics(@Query() query: TransactionAnalyticsQueryDto) {
    return this.analyticsService.getAnalytics(query);
  }

  /**
   * Get dashboard metrics
   */
  @Get('analytics/dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard metrics' })
  async getDashboardMetrics() {
    return this.analyticsService.getDashboardMetrics();
  }

  /**
   * Get user analytics
   */
  @Get('analytics/user/:userId')
  @ApiOperation({ summary: 'Get analytics for a specific user' })
  @ApiResponse({ status: 200, description: 'Returns user analytics' })
  async getUserAnalytics(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.analyticsService.getUserAnalytics(userId);
  }

  /**
   * Get transaction type distribution
   */
  @Get('analytics/type-distribution')
  @ApiOperation({ summary: 'Get transaction type distribution' })
  @ApiResponse({ status: 200, description: 'Returns type distribution' })
  async getTypeDistribution(@Query('days') days?: number) {
    return this.analyticsService.getTypeDistribution(days);
  }

  /**
   * Retry a failed transaction
   */
  @Post(':hash/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually retry a failed transaction' })
  @ApiResponse({ status: 200, description: 'Transaction retry initiated' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async retryTransaction(@Param('hash') hash: string) {
    const result = await this.retryService.manualRetry(hash);
    if (!result) {
      return { status: 'error', message: 'Transaction not found' };
    }
    return {
      status: 'success',
      message: 'Transaction retry initiated',
      transaction: result,
    };
  }

  /**
   * Cancel a transaction
   */
  @Post(':hash/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending or failed transaction' })
  @ApiResponse({ status: 200, description: 'Transaction cancelled' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async cancelTransaction(@Param('hash') hash: string) {
    const result = await this.retryService.cancelTransaction(hash);
    if (!result) {
      return { status: 'error', message: 'Transaction not found' };
    }
    return {
      status: 'success',
      message: 'Transaction cancelled',
      transaction: result,
    };
  }

  /**
   * Get retry statistics
   */
  @Get('system/retry-stats')
  @ApiOperation({ summary: 'Get transaction retry statistics' })
  @ApiResponse({ status: 200, description: 'Returns retry statistics' })
  async getRetryStats() {
    return this.retryService.getRetryStats();
  }

  /**
   * Get monitoring status
   */
  @Get('system/monitoring-status')
  @ApiOperation({ summary: 'Get transaction monitoring status' })
  @ApiResponse({ status: 200, description: 'Returns monitoring status' })
  async getMonitoringStatus() {
    return this.monitorService.getStatus();
  }

  /**
   * Start real-time monitoring
   */
  @Post('system/start-monitoring')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start real-time transaction monitoring' })
  @ApiBearerAuth()
  async startMonitoring() {
    this.monitorService.startRealTimeMonitoring();
    return { status: 'success', message: 'Real-time monitoring started' };
  }

  /**
   * Stop real-time monitoring
   */
  @Post('system/stop-monitoring')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop real-time transaction monitoring' })
  @ApiBearerAuth()
  async stopMonitoring() {
    this.monitorService.stopRealTimeMonitoring();
    return { status: 'success', message: 'Real-time monitoring stopped' };
  }

  /**
   * Sync transactions for an account
   */
  @Post('sync/:accountId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync transactions for a Stellar account' })
  @ApiResponse({ status: 200, description: 'Sync completed' })
  async syncAccountTransactions(@Param('accountId') accountId: string) {
    const result = await this.transactionService.syncAccountTransactions(accountId);
    return {
      status: 'success',
      message: `Synced ${result.count} transactions for account ${accountId}`,
      count: result.count,
    };
  }
}
