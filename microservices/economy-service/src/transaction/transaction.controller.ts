import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  TransactionService,
  CreateTransactionDto,
  UpdateTransactionStatusDto,
} from './transaction.service';
import {
  TransactionType,
  TransactionStatus,
  CurrencyType,
} from './transaction.entity';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.createTransaction(createTransactionDto);
  }

  @Get(':id')
  async getTransactionById(@Param('id') id: string) {
    return this.transactionService.getTransactionById(id);
  }

  @Get('user/:userId')
  async getUserTransactions(
    @Param('userId') userId: string,
    @Body()
    body: {
      type?: TransactionType;
      status?: TransactionStatus;
      currency?: CurrencyType;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.transactionService.getUserTransactions(userId, body);
  }

  @Get('user/:userId/balance/:currency')
  async getUserBalance(
    @Param('userId') userId: string,
    @Param('currency') currency: CurrencyType,
  ) {
    const balance = await this.transactionService.getUserBalance(
      userId,
      currency,
    );
    return { userId, currency, balance };
  }

  @Get('user/:userId/history')
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Body() body: { startDate?: Date; endDate?: Date },
  ) {
    return this.transactionService.getTransactionHistory(
      userId,
      body.startDate,
      body.endDate,
    );
  }

  @Put(':id/status')
  async updateTransactionStatus(
    @Param('id') id: string,
    @Body() updateTransactionStatusDto: UpdateTransactionStatusDto,
  ) {
    return this.transactionService.updateTransactionStatus(
      id,
      updateTransactionStatusDto,
    );
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async completeTransaction(
    @Param('id') id: string,
    @Body() body: { externalTransactionId?: string },
  ) {
    return this.transactionService.completeTransaction(
      id,
      body.externalTransactionId,
    );
  }

  @Post(':id/fail')
  @HttpCode(HttpStatus.OK)
  async failTransaction(
    @Param('id') id: string,
    @Body() body: { failureReason: string },
  ) {
    return this.transactionService.failTransaction(id, body.failureReason);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  async refundTransaction(@Param('id') id: string) {
    return this.transactionService.refundTransaction(id);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  async createPurchaseTransaction(
    @Body()
    body: {
      userId: string;
      shopItemId: string;
      amount: number;
      currency: CurrencyType;
      description?: string;
    },
  ) {
    return this.transactionService.createPurchaseTransaction(
      body.userId,
      body.shopItemId,
      body.amount,
      body.currency,
      body.description,
    );
  }

  @Post('energy-refill')
  @HttpCode(HttpStatus.OK)
  async createEnergyRefillTransaction(
    @Body()
    body: {
      userId: string;
      amount: number;
      currency: CurrencyType;
      description?: string;
    },
  ) {
    return this.transactionService.createEnergyRefillTransaction(
      body.userId,
      body.amount,
      body.currency,
      body.description,
    );
  }

  @Post('bonus')
  @HttpCode(HttpStatus.OK)
  async createBonusTransaction(
    @Body()
    body: {
      userId: string;
      amount: number;
      currency: CurrencyType;
      description?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.transactionService.createBonusTransaction(
      body.userId,
      body.amount,
      body.currency,
      body.description,
      body.metadata,
    );
  }
}
