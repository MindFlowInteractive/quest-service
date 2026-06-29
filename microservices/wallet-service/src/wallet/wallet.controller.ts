import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

class ConnectWalletDto {
  userId: string;
  address: string;
}

@ApiTags('wallets')
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect a Stellar wallet to a user' })
  @ApiBody({ type: ConnectWalletDto })
  async connect(@Body() data: ConnectWalletDto) {
    return this.walletService.connectWallet(data.userId, data.address);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all wallets for a user' })
  async getByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.walletService.getWalletByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wallet details by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.walletService.getWalletById(id);
  }
}
