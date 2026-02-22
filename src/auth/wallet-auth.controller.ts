import { Controller, Post, Body } from '@nestjs/common';
import { WalletAuthService } from './wallet-auth.service';

@Controller('auth/wallet')
export class WalletAuthController {
  constructor(private readonly authService: WalletAuthService) {}

  @Post('challenge')
  getChallenge(@Body('walletAddress') walletAddress: string) {
    return { challenge: this.authService.generateChallenge(walletAddress) };
  }

  @Post('verify')
  async verify(
    @Body('walletAddress') walletAddress: string,
    @Body('signature') signature: string,
    @Body('challenge') challenge: string,
  ) {
    return this.authService.verifySignature(walletAddress, signature, challenge);
  }
}
