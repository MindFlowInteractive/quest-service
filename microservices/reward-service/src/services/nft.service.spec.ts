import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NFTService } from './nft.service';
import { StellarService } from './stellar.service';
import { NFT } from '../entities/nft.entity';
import { ConfigService } from '@nestjs/config';
import { Keypair } from '@stellar/stellar-sdk';

describe('NFTService', () => {
  let service: NFTService;
  let mockNFTRepository: any;
  let mockStellarService: any;
  let mockConfigService: any;

  const validAddress = Keypair.random().publicKey();
  const validAddress2 = Keypair.random().publicKey();
  const validContractId = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';

  beforeEach(async () => {
    mockNFTRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockStellarService = {
      invokeContract: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'NFT_CONTRACT_ID') return validContractId;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NFTService,
        {
          provide: getRepositoryToken(NFT),
          useValue: mockNFTRepository,
        },
        {
          provide: StellarService,
          useValue: mockStellarService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NFTService>(NFTService);
  });

  describe('mintNFT', () => {
    it('should mint an NFT with valid inputs', async () => {
      const ownerId = validAddress;
      const name = 'Test NFT';
      const description = 'A test NFT';
      const imageUrl = 'https://example.com/image.png';

      const mockNFT = {
        id: 'nft-123',
        tokenId: 1,
        ownerId,
        contractId: validContractId,
        name,
        description,
        imageUrl,
        status: 'active',
        mintedAt: new Date(),
      };

      mockNFTRepository.findOne.mockResolvedValue(null);
      mockNFTRepository.create.mockReturnValue(mockNFT);
      mockNFTRepository.save
        .mockResolvedValueOnce(mockNFT)
        .mockResolvedValueOnce({ ...mockNFT, status: 'active', transactionHash: 'tx123' });
      mockStellarService.invokeContract.mockResolvedValue({
        status: 'SUCCESS',
        hash: 'tx123',
      });

      const result = await service.mintNFT(ownerId, name, description, imageUrl);

      expect(result.status).toBe('active');
      expect(result.tokenId).toBe(1);
      expect(result.transactionHash).toBe('tx123');
    });

    it('should throw BadRequestException for invalid owner address', async () => {
      await expect(
        service.mintNFT('invalid-address', 'NFT', 'desc', 'url'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty name', async () => {
      await expect(
        service.mintNFT(validAddress, '', 'desc', 'url'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty imageUrl', async () => {
      await expect(
        service.mintNFT(validAddress, 'NFT', 'desc', ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getNFT', () => {
    it('should return an NFT by tokenId', async () => {
      const mockNFT = { tokenId: 1, ownerId: validAddress, status: 'active' };
      mockNFTRepository.findOne.mockResolvedValue(mockNFT);

      const result = await service.getNFT(1);

      expect(result).toEqual(mockNFT);
    });

    it('should throw NotFoundException if NFT not found', async () => {
      mockNFTRepository.findOne.mockResolvedValue(null);

      await expect(service.getNFT(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid tokenId', async () => {
      await expect(service.getNFT(0)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getNFTsByOwner', () => {
    it('should return all NFTs owned by a user', async () => {
      const mockNFTs = [
        { tokenId: 1, ownerId: validAddress, status: 'active' },
        { tokenId: 2, ownerId: validAddress, status: 'active' },
      ];

      mockNFTRepository.find.mockResolvedValue(mockNFTs);

      const result = await service.getNFTsByOwner(validAddress);

      expect(result).toEqual(mockNFTs);
      expect(mockNFTRepository.find).toHaveBeenCalledWith({
        where: { ownerId: validAddress },
        order: { createdAt: 'DESC' },
      });
    });

    it('should throw BadRequestException for invalid owner address', async () => {
      await expect(service.getNFTsByOwner('invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('transferNFT', () => {
    it('should transfer NFT to new owner', async () => {
      const currentOwner = validAddress;
      const newOwner = validAddress2;
      const tokenId = 1;

      const mockNFT = {
        tokenId,
        ownerId: currentOwner,
        status: 'active',
      };

      mockNFTRepository.findOne.mockResolvedValue(mockNFT);
      mockNFTRepository.save.mockResolvedValue({ ...mockNFT, ownerId: newOwner, transactionHash: 'tx123' });
      mockStellarService.invokeContract.mockResolvedValue({
        status: 'SUCCESS',
        hash: 'tx123',
      });

      const result = await service.transferNFT(currentOwner, newOwner, tokenId);

      expect(result.ownerId).toBe(newOwner);
      expect(result.transactionHash).toBe('tx123');
    });

    it('should throw BadRequestException for self-transfer', async () => {
      await expect(
        service.transferNFT(validAddress, validAddress, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if not owner', async () => {
      const mockNFT = {
        tokenId: 1,
        ownerId: validAddress2,
        status: 'active',
      };

      mockNFTRepository.findOne.mockResolvedValue(mockNFT);

      await expect(
        service.transferNFT(validAddress, validAddress2, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if NFT not in active status', async () => {
      const mockNFT = {
        tokenId: 1,
        ownerId: validAddress,
        status: 'burned',
      };

      mockNFTRepository.findOne.mockResolvedValue(mockNFT);

      await expect(
        service.transferNFT(validAddress, validAddress2, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('burnNFT', () => {
    it('should burn an NFT', async () => {
      const ownerId = validAddress;
      const tokenId = 1;

      const mockNFT = {
        tokenId,
        ownerId,
        status: 'active',
      };

      mockNFTRepository.findOne.mockResolvedValue(mockNFT);
      mockNFTRepository.save.mockResolvedValue({ ...mockNFT, status: 'burned', transactionHash: 'tx123' });
      mockStellarService.invokeContract.mockResolvedValue({
        status: 'SUCCESS',
        hash: 'tx123',
      });

      const result = await service.burnNFT(ownerId, tokenId);

      expect(result.status).toBe('burned');
      expect(result.transactionHash).toBe('tx123');
    });

    it('should throw ForbiddenException if not owner', async () => {
      const mockNFT = {
        tokenId: 1,
        ownerId: validAddress2,
      };

      mockNFTRepository.findOne.mockResolvedValue(mockNFT);

      await expect(service.burnNFT(validAddress, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
