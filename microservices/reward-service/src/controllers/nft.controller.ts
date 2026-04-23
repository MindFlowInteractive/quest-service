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
import { NFTService } from '../services/nft.service';
import { NFT } from '../entities/nft.entity';

class MintNFTDto {
  ownerId: string;
  name: string;
  description: string;
  imageUrl: string;
  metadata?: Record<string, any>;
}

class TransferNFTDto {
  currentOwnerId: string;
  newOwnerId: string;
  tokenId: number;
}

class BurnNFTDto {
  ownerId: string;
  tokenId: number;
}

@Controller('nft')
export class NFTController {
  private readonly logger = new Logger(NFTController.name);

  constructor(private readonly nftService: NFTService) {}

  // ─── Minting ──────────────────────────────────────────────────────────────────
  @Post('mint')
  @HttpCode(HttpStatus.CREATED)
  async mint(@Body() dto: MintNFTDto): Promise<NFT> {
    this.logger.log(`Minting NFT for owner ${dto.ownerId}: ${dto.name}`);
    return this.nftService.mintNFT(
      dto.ownerId,
      dto.name,
      dto.description,
      dto.imageUrl,
      dto.metadata,
    );
  }

  // ─── Queries ───────────────────────────────────────────────────────────────────
  @Get(':tokenId')
  async getNFT(@Param('tokenId') tokenId: number): Promise<NFT> {
    return this.nftService.getNFT(tokenId);
  }

  @Get('owner/:ownerId')
  async getNFTsByOwner(@Param('ownerId') ownerId: string): Promise<NFT[]> {
    return this.nftService.getNFTsByOwner(ownerId);
  }

  // ─── Transfer ──────────────────────────────────────────────────────────────────
  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transfer(@Body() dto: TransferNFTDto): Promise<NFT> {
    this.logger.log(
      `Transferring NFT ${dto.tokenId} from ${dto.currentOwnerId} to ${dto.newOwnerId}`,
    );
    return this.nftService.transferNFT(
      dto.currentOwnerId,
      dto.newOwnerId,
      dto.tokenId,
    );
  }

  // ─── Burn ──────────────────────────────────────────────────────────────────────
  @Post('burn')
  @HttpCode(HttpStatus.OK)
  async burn(@Body() dto: BurnNFTDto): Promise<NFT> {
    this.logger.log(`Burning NFT ${dto.tokenId} for owner ${dto.ownerId}`);
    return this.nftService.burnNFT(dto.ownerId, dto.tokenId);
  }
}
