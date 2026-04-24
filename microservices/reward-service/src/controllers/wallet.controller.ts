import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WalletService } from '../services/wallet.service';

class CreateChallengeDto {
  publicKey: string;
  network: string;
}

class VerifyChallengeDto {
  publicKey: string;
  network: string;
  nonce: string;
  signature: string;
}

class DisconnectDto {
  sessionToken: string;
}

@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  // ─── Authentication ───────────────────────────────────────────────────────────
  @Post('challenge')
  @HttpCode(HttpStatus.CREATED)
  async createChallenge(@Body() dto: CreateChallengeDto) {
    this.logger.log(`Creating challenge for wallet ${dto.publicKey}`);
    return this.walletService.createChallenge(dto.publicKey, dto.network);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyChallenge(@Body() dto: VerifyChallengeDto) {
    this.logger.log(`Verifying challenge for wallet ${dto.publicKey}`);
    return this.walletService.verifyChallenge(
      dto.publicKey,
      dto.network,
      dto.nonce,
      dto.signature,
    );
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect(@Body() dto: DisconnectDto) {
    this.logger.log(`Disconnecting wallet session`);
    return this.walletService.disconnect(dto.sessionToken);
  }

  // ─── Wallet Queries ───────────────────────────────────────────────────────────
  @Get('balance/:sessionToken')
  async getBalance(@Param('sessionToken') sessionToken: string) {
    return this.walletService.getWalletBalance(sessionToken);
  }

  @Get('transactions/:sessionToken')
  async getTransactions(@Param('sessionToken') sessionToken: string) {
    return this.walletService.getWalletTransactions(sessionToken);
  }
}
