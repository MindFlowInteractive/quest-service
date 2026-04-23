import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { StellarService } from './stellar.service';
import { ConfigService } from '@nestjs/config';
import { Keypair } from '@stellar/stellar-sdk';

describe('WalletService', () => {
  let service: WalletService;
  let mockStellarService: any;
  let mockConfigService: any;

  const validPublicKey = Keypair.random().publicKey();
  const validNetwork = 'testnet';

  beforeEach(async () => {
    mockStellarService = {
      getTokenBalance: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'WALLET_CHALLENGE_TTL_MS') return 5 * 60 * 1000;
        if (key === 'WALLET_SESSION_TTL_MS') return 24 * 60 * 60 * 1000;
        if (key === 'REWARD_CONTRACT_ID') return 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
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

    service = module.get<WalletService>(WalletService);
  });

  describe('createChallenge', () => {
    it('should create a challenge for a valid public key', async () => {
      const result = await service.createChallenge(validPublicKey, validNetwork);

      expect(result.status).toBe('challenge_created');
      expect(result.nonce).toBeDefined();
      expect(result.message).toContain(validPublicKey);
      expect(result.message).toContain(validNetwork);
      expect(result.expiresAt).toBeDefined();
    });

    it('should throw BadRequestException for invalid public key', async () => {
      await expect(service.createChallenge('invalid-key', validNetwork)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for empty network', async () => {
      await expect(service.createChallenge(validPublicKey, '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyChallenge', () => {
    it('should verify a valid challenge and create a session', async () => {
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();

      // Create challenge first
      const challengeResult = await service.createChallenge(publicKey, validNetwork);
      const nonce = challengeResult.nonce;
      const message = challengeResult.message;

      // Sign the message
      const messageBytes = Buffer.from(message, 'utf8');
      const signature = keypair.sign(messageBytes);
      const signatureBase64 = signature.toString('base64');

      // Verify challenge
      const result = await service.verifyChallenge(publicKey, validNetwork, nonce, signatureBase64);

      expect(result.status).toBe('authenticated');
      expect(result.sessionToken).toBeDefined();
      expect(result.publicKey).toBe(publicKey);
      expect(result.expiresAt).toBeDefined();
    });

    it('should throw BadRequestException for invalid signature', async () => {
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();

      const challengeResult = await service.createChallenge(publicKey, validNetwork);
      const nonce = challengeResult.nonce;

      // Use wrong signature
      const wrongSignature = Buffer.from('wrong-signature').toString('base64');

      await expect(
        service.verifyChallenge(publicKey, validNetwork, nonce, wrongSignature),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-existent challenge', async () => {
      const wrongSignature = Buffer.from('signature').toString('base64');

      await expect(
        service.verifyChallenge(validPublicKey, validNetwork, 'nonexistent-nonce', wrongSignature),
      ).rejects.toThrow(BadRequestException);
    });

    it('should consume nonce after verification (replay protection)', async () => {
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();

      const challengeResult = await service.createChallenge(publicKey, validNetwork);
      const nonce = challengeResult.nonce;
      const message = challengeResult.message;

      const messageBytes = Buffer.from(message, 'utf8');
      const signature = keypair.sign(messageBytes);
      const signatureBase64 = signature.toString('base64');

      // First verification should succeed
      await service.verifyChallenge(publicKey, validNetwork, nonce, signatureBase64);

      // Second verification with same nonce should fail
      await expect(
        service.verifyChallenge(publicKey, validNetwork, nonce, signatureBase64),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSession', () => {
    it('should return a valid session', async () => {
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();

      const challengeResult = await service.createChallenge(publicKey, validNetwork);
      const nonce = challengeResult.nonce;
      const message = challengeResult.message;

      const messageBytes = Buffer.from(message, 'utf8');
      const signature = keypair.sign(messageBytes);
      const signatureBase64 = signature.toString('base64');

      const verifyResult = await service.verifyChallenge(
        publicKey,
        validNetwork,
        nonce,
        signatureBase64,
      );
      const sessionToken = verifyResult.sessionToken;

      const session = await service.getSession(sessionToken);

      expect(session.publicKey).toBe(publicKey);
      expect(session.sessionToken).toBe(sessionToken);
    });

    it('should throw NotFoundException for invalid session token', async () => {
      await expect(service.getSession('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('disconnect', () => {
    it('should disconnect a valid session', async () => {
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();

      const challengeResult = await service.createChallenge(publicKey, validNetwork);
      const nonce = challengeResult.nonce;
      const message = challengeResult.message;

      const messageBytes = Buffer.from(message, 'utf8');
      const signature = keypair.sign(messageBytes);
      const signatureBase64 = signature.toString('base64');

      const verifyResult = await service.verifyChallenge(
        publicKey,
        validNetwork,
        nonce,
        signatureBase64,
      );
      const sessionToken = verifyResult.sessionToken;

      const result = await service.disconnect(sessionToken);

      expect(result.status).toBe('disconnected');

      // Session should no longer be valid
      await expect(service.getSession(sessionToken)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for invalid session token', async () => {
      await expect(service.disconnect('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWalletBalance', () => {
    it('should fetch wallet balance for a valid session', async () => {
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();

      const challengeResult = await service.createChallenge(publicKey, validNetwork);
      const nonce = challengeResult.nonce;
      const message = challengeResult.message;

      const messageBytes = Buffer.from(message, 'utf8');
      const signature = keypair.sign(messageBytes);
      const signatureBase64 = signature.toString('base64');

      const verifyResult = await service.verifyChallenge(
        publicKey,
        validNetwork,
        nonce,
        signatureBase64,
      );
      const sessionToken = verifyResult.sessionToken;

      mockStellarService.getTokenBalance.mockResolvedValue({ balance: '1000000000' });

      const result = await service.getWalletBalance(sessionToken);

      expect(result).toEqual({ balance: '1000000000' });
      expect(mockStellarService.getTokenBalance).toHaveBeenCalledWith(publicKey, expect.any(String));
    });
  });

  describe('getWalletTransactions', () => {
    it('should return empty array for wallet transactions', async () => {
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();

      const challengeResult = await service.createChallenge(publicKey, validNetwork);
      const nonce = challengeResult.nonce;
      const message = challengeResult.message;

      const messageBytes = Buffer.from(message, 'utf8');
      const signature = keypair.sign(messageBytes);
      const signatureBase64 = signature.toString('base64');

      const verifyResult = await service.verifyChallenge(
        publicKey,
        validNetwork,
        nonce,
        signatureBase64,
      );
      const sessionToken = verifyResult.sessionToken;

      const result = await service.getWalletTransactions(sessionToken);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
