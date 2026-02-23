import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { RecordTransactionDto } from './dto/record-transaction.dto';
import {
  WalletSessionGuard,
  type WalletRequest,
} from './guards/wallet-session.guard';
import { WalletService } from './wallet.service';
import { WalletSyncService } from './wallet-sync.service';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
 constructor(
  private readonly walletService: WalletService,
  private readonly walletSyncService: WalletSyncService,
) {}

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  connect(@Body() body: ConnectWalletDto) {
    if ((body.signature && !body.nonce) || (!body.signature && body.nonce)) {
      return {
        status: 'error',
        message: 'Signature and nonce must be provided together',
      };
    }

    if (!body.signature || !body.nonce) {
      return this.walletService.createChallenge(body.publicKey, body.network);
    }

    return this.walletService.verifyChallenge(
      body.publicKey,
      body.network,
      body.nonce,
      body.signature,
    );
  }

  @Get('session')
  @UseGuards(WalletSessionGuard)
  @HttpCode(HttpStatus.OK)
  getSession(@Req() req: WalletRequest) {
    const session = req.walletSession!;
    return {
      publicKey: session.publicKey,
      network: session.network,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  @Post('disconnect')
  @UseGuards(WalletSessionGuard)
  @HttpCode(HttpStatus.OK)
  disconnect(@Req() req: WalletRequest) {
    const session = req.walletSession!;
    return this.walletService.disconnect(session.sessionToken);
  }

  @Get('balances')
  @UseGuards(WalletSessionGuard)
  @HttpCode(HttpStatus.OK)
  getBalances(@Req() req: WalletRequest) {
    return this.walletService.getBalances(req.walletSession!);
  }

  @Post('refresh')
@UseGuards(WalletSessionGuard)
@HttpCode(HttpStatus.OK)
refresh(@Req() req: WalletRequest) {
  return this.walletSyncService.syncBalances(req.walletSession!);
}



  @Get('transactions')
  @UseGuards(WalletSessionGuard)
  @HttpCode(HttpStatus.OK)
  getTransactions(
    @Req() req: WalletRequest,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const safeLimit =
      parsedLimit !== undefined && !Number.isNaN(parsedLimit)
        ? parsedLimit
        : undefined;
    return this.walletService.getTransactionHistory(
      req.walletSession!,
      safeLimit,
      cursor,
    );
  }

  @Post('purchase')
  @UseGuards(WalletSessionGuard)
  @HttpCode(HttpStatus.OK)
  recordPurchase(@Req() req: WalletRequest, @Body() body: RecordTransactionDto) {
    return this.walletService.recordPurchase(req.walletSession!, body);
  }

  @Post('spend')
  @UseGuards(WalletSessionGuard)
  @HttpCode(HttpStatus.OK)
  recordSpend(@Req() req: WalletRequest, @Body() body: RecordTransactionDto) {
    return this.walletService.recordSpend(req.walletSession!, body);
  }
}
