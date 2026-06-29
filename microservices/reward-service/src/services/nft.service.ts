import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NFT } from '../entities/nft.entity';
import { StellarService } from './stellar.service';
import { ConfigService } from '@nestjs/config';
import { nativeToScVal, Address } from '@stellar/stellar-sdk';

@Injectable()
export class NFTService {
  private readonly logger = new Logger(NFTService.name);
  private readonly nftContractId: string;

  constructor(
    @InjectRepository(NFT)
    private readonly nftRepository: Repository<NFT>,
    private readonly stellarService: StellarService,
    private readonly configService: ConfigService,
  ) {
    this.nftContractId = this.configService.get<string>('NFT_CONTRACT_ID');
    if (!this.nftContractId) {
      this.logger.warn('NFT_CONTRACT_ID not configured');
    }
  }

  // ─── Minting ─────────────────────────────────────────────────────────────────
  /**
   * Mint a new NFT for the given owner.
   *
   * 1. Validate inputs
   * 2. Generate next token ID
   * 3. Create DB record (pending status)
   * 4. Invoke Stellar contract
   * 5. Update with blockchain result
   */
  async mintNFT(
    ownerId: string,
    name: string,
    description: string,
    imageUrl: string,
    metadata?: Record<string, any>,
  ): Promise<NFT> {
    // Validate inputs
    this.validateAddress(ownerId);
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('NFT name is required');
    }
    if (!imageUrl || imageUrl.trim().length === 0) {
      throw new BadRequestException('NFT imageUrl is required');
    }

    // Find the next available token ID
    const lastNFT = await this.nftRepository.findOne({
      order: { tokenId: 'DESC' },
    });

    const tokenId = lastNFT ? lastNFT.tokenId + 1 : 1;

    // Create NFT record in database with pending status
    const nft = this.nftRepository.create({
      tokenId,
      ownerId,
      contractId: this.nftContractId,
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      metadata: metadata ?? {},
      status: 'active', // will be updated after blockchain confirmation
      mintedAt: new Date(),
    });

    const saved = await this.nftRepository.save(nft);

    try {
      // Mint NFT on Stellar blockchain
      const uri = `ipfs://${saved.id}`; // Use IPFS URI or other decentralized storage
      const params = [
        new Address(ownerId).toScVal(),
        nativeToScVal(tokenId, { type: 'u64' }),
        nativeToScVal(uri, { type: 'string' }),
      ];

      const result = await this.stellarService.invokeContract(
        this.nftContractId,
        'mint',
        params,
      );

      // Update NFT record with transaction details
      saved.status = result.status === 'SUCCESS' ? 'active' : 'failed';
      saved.transactionHash = result.hash;
      saved.metadataUri = uri;

      this.logger.log(
        `NFT ${tokenId} minted for ${ownerId}: ${result.status}`,
      );

      return this.nftRepository.save(saved);
    } catch (error) {
      this.logger.error(`Error minting NFT for user ${ownerId}:`, error);
      saved.status = 'failed';
      saved.metadata = { ...saved.metadata, error: error.message };
      return this.nftRepository.save(saved);
    }
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────
  async getNFT(tokenId: number): Promise<NFT> {
    if (tokenId <= 0) {
      throw new BadRequestException('Invalid token ID');
    }

    const nft = await this.nftRepository.findOne({ where: { tokenId } });
    if (!nft) {
      throw new NotFoundException(`NFT with tokenId ${tokenId} not found`);
    }
    return nft;
  }

  async getNFTsByOwner(ownerId: string): Promise<NFT[]> {
    this.validateAddress(ownerId);
    return this.nftRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Transfer ────────────────────────────────────────────────────────────────
  /**
   * Transfer NFT ownership from one address to another.
   *
   * 1. Validate both addresses
   * 2. Verify current owner
   * 3. Invoke Stellar contract
   * 4. Update ownership on success
   */
  async transferNFT(
    currentOwnerId: string,
    newOwnerId: string,
    tokenId: number,
  ): Promise<NFT> {
    // Validate inputs
    this.validateAddress(currentOwnerId);
    this.validateAddress(newOwnerId);

    if (currentOwnerId === newOwnerId) {
      throw new BadRequestException(
        'Cannot transfer NFT to the same owner',
      );
    }

    // Verify NFT exists and is owned by currentOwnerId
    const nft = await this.nftRepository.findOne({ where: { tokenId } });
    if (!nft) {
      throw new NotFoundException(`NFT with tokenId ${tokenId} not found`);
    }

    if (nft.ownerId !== currentOwnerId) {
      throw new ForbiddenException(
        `User ${currentOwnerId} does not own NFT ${tokenId}`,
      );
    }

    if (nft.status !== 'active') {
      throw new BadRequestException(
        `Cannot transfer NFT in ${nft.status} status`,
      );
    }

    try {
      const params = [
        new Address(currentOwnerId).toScVal(),
        new Address(newOwnerId).toScVal(),
        nativeToScVal(tokenId, { type: 'u64' }),
      ];

      const result = await this.stellarService.invokeContract(
        this.nftContractId,
        'transfer',
        params,
      );

      if (result.status === 'SUCCESS') {
        nft.ownerId = newOwnerId;
        nft.status = 'active';
        this.logger.log(
          `NFT ${tokenId} transferred from ${currentOwnerId} to ${newOwnerId}`,
        );
      } else {
        nft.status = 'failed';
        this.logger.warn(
          `NFT ${tokenId} transfer failed: ${result.status}`,
        );
      }

      nft.transactionHash = result.hash;
      nft.transferredAt = new Date();

      return this.nftRepository.save(nft);
    } catch (error) {
      this.logger.error(
        `Error transferring NFT ${tokenId} from ${currentOwnerId} to ${newOwnerId}:`,
        error,
      );
      nft.status = 'failed';
      nft.metadata = { ...nft.metadata, error: error.message };
      return this.nftRepository.save(nft);
    }
  }

  // ─── Burn ────────────────────────────────────────────────────────────────────
  /**
   * Burn (destroy) an NFT permanently.
   *
   * 1. Validate owner
   * 2. Verify ownership
   * 3. Invoke Stellar contract burn
   * 4. Mark as burned
   */
  async burnNFT(ownerId: string, tokenId: number): Promise<NFT> {
    // Validate inputs
    this.validateAddress(ownerId);

    // Verify NFT exists and is owned by ownerId
    const nft = await this.nftRepository.findOne({ where: { tokenId } });
    if (!nft) {
      throw new NotFoundException(`NFT with tokenId ${tokenId} not found`);
    }

    if (nft.ownerId !== ownerId) {
      throw new ForbiddenException(
        `User ${ownerId} does not own NFT ${tokenId}`,
      );
    }

    try {
      const params = [
        new Address(ownerId).toScVal(),
        nativeToScVal(tokenId, { type: 'u64' }),
      ];

      const result = await this.stellarService.invokeContract(
        this.nftContractId,
        'burn',
        params,
      );

      nft.status = result.status === 'SUCCESS' ? 'burned' : 'failed';
      nft.transactionHash = result.hash;

      this.logger.log(
        `NFT ${tokenId} burned by ${ownerId}: ${result.status}`,
      );

      return this.nftRepository.save(nft);
    } catch (error) {
      this.logger.error(
        `Error burning NFT ${tokenId} for user ${ownerId}:`,
        error,
      );
      nft.status = 'failed';
      nft.metadata = { ...nft.metadata, error: error.message };
      return this.nftRepository.save(nft);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  /**
   * Validate Stellar address format.
   * Stellar public keys start with 'G' and are 56 characters long.
   */
  private validateAddress(address: string): void {
    if (!address || !address.startsWith('G') || address.length !== 56) {
      throw new BadRequestException(
        `Invalid Stellar address format: ${address}`,
      );
    }
  }
}
