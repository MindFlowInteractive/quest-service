import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { NFTService } from './nft.service';

@Controller('nft')
export class NFTController {
  constructor(private readonly nftService: NFTService) {}

  @Post('mint')
  async mint(@Body() body: { userAddress: string; tokenId: number; uri: string }) {
    return this.nftService.mintNFT(body.userAddress, body.tokenId, body.uri);
  }

  @Get(':tokenId')
  async getNFT(@Param('tokenId') tokenId: string) {
    return this.nftService.getNFT(parseInt(tokenId, 10));
  }

  @Post('transfer')
  async transfer(@Body() body: { from: string; to: string; tokenId: number }) {
    return this.nftService.transferNFT(body.from, body.to, body.tokenId);
  }
}
