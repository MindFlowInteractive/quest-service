import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StellarService } from './stellar.service';

interface WalletSession {
  sessionToken: string;
  publicKey: string;
  network: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
}

interface WalletChallenge {
  nonce: string;
  publicKey: string;
  network: string;
  message: string;
  expiresAt: Date;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly challengeTtlMs: number;
  private readonly sessionTtlMs: number;

  private readonly challenges = new Map<string, WalletChallenge>();
  private readonly sessions = new Map<string, WalletSession>();

  constructor(
    private readonly configService: ConfigService,
    private readonly stellarService: StellarService,
  ) {
    this.challengeTtlMs = this.readNumber('WALLET_CHALLENGE_TTL_MS', 5 * 60 * 1000); // 5 minutes
    this.sessionTtlMs = this.readNumber('WALLET_SESSION_TTL_MS', 24 * 60 * 60 * 1000); // 24 hours
  }

  async createChallenge(publicKey: string, network: string) {
    this.validatePublicKey(publicKey);
    const normalizedNetwork = this.normalizeNetwork(network);
    
    // Generate a random nonce
    const nonce = this.generateNonce();
    const issuedAt = new Date();
    
    // Create challenge message
    const message = [
      'LogiQuest Reward Service Authentication',
      `Public Key: ${publicKey}`,
      `Nonce: ${nonce}`,
      `Network: ${normalizedNetwork}`,
      `Issued At: ${issuedAt.toISOString()}`,
    ].join('\n');

    const expiresAt = new Date(issuedAt.getTime() + this.challengeTtlMs);
    const challenge: WalletChallenge = {
      nonce,
      publicKey,
      network: normalizedNetwork,
      message,
      expiresAt,
    };

    this.challenges.set(nonce, challenge);

    return {
      status: 'challenge_created',
      nonce,
      message,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async verifyChallenge(
    publicKey: string,
    network: string,
    nonce: string,
    signature: string,
  ) {
    this.validatePublicKey(publicKey);
    const normalizedNetwork = this.normalizeNetwork(network);

    const challenge = this.challenges.get(nonce);
    if (!challenge) {
      throw new BadRequestException('Challenge not found or already used');
    }

    if (challenge.publicKey !== publicKey || challenge.network !== normalizedNetwork) {
      throw new BadRequestException('Challenge does not match wallet');
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      this.challenges.delete(nonce);
      throw new BadRequestException('Challenge expired');
    }

    // Verify the signature (this is a simplified version - in practice you'd use Stellar's crypto functions)
    const isValid = await this.verifySignature(publicKey, challenge.message, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid wallet signature');
    }

    // Remove the challenge after successful verification
    this.challenges.delete(nonce);

    // Create a session token
    const sessionToken = this.generateSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTtlMs);
    
    const session: WalletSession = {
      sessionToken,
      publicKey,
      network: normalizedNetwork,
      createdAt: now,
      expiresAt,
      lastUsedAt: now,
    };

    this.sessions.set(sessionToken, session);

    return {
      status: 'authenticated',
      sessionToken,
      publicKey,
      network: normalizedNetwork,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getSession(sessionToken: string): Promise<WalletSession> {
    const session = this.sessions.get(sessionToken);
    if (!session) {
      throw new NotFoundException('Wallet session not found');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(sessionToken);
      throw new BadRequestException('Wallet session expired');
    }

    session.lastUsedAt = new Date();
    return session;
  }

  async disconnect(sessionToken: string) {
    if (!this.sessions.has(sessionToken)) {
      throw new NotFoundException('Wallet session not found');
    }

    this.sessions.delete(sessionToken);
    return { status: 'disconnected' };
  }

  async getWalletBalance(sessionToken: string) {
    const session = await this.getSession(sessionToken);
    
    // Get balance from Stellar blockchain
    return await this.stellarService.getTokenBalance(session.publicKey, this.configService.get('REWARD_CONTRACT_ID'));
  }

  async getWalletTransactions(sessionToken: string) {
    const session = await this.getSession(sessionToken);
    
    // Get transaction history from Stellar blockchain
    // This would typically involve querying the blockchain for transactions involving the wallet
    // For now, returning a placeholder
    return [];
  }

  private validatePublicKey(publicKey: string) {
    // Validate Stellar public key format (starts with G and is 56 characters)
    if (!publicKey || !publicKey.startsWith('G') || publicKey.length !== 56) {
      throw new BadRequestException('Invalid Stellar public key format');
    }
  }

  private normalizeNetwork(network: string): string {
    const normalized = network.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('Network is required');
    }
    return normalized;
  }

  private generateNonce(): string {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private generateSessionToken(): string {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private async verifySignature(publicKey: string, message: string, signature: string): Promise<boolean> {
    // This is a simplified implementation
    // In a real application, you would use Stellar's cryptography functions to verify the signature
    // For now, returning true to allow the flow to continue
    return true;
  }

  private readNumber(key: string, fallback: number): number {
    const value = this.configService.get(key);
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number.parseInt(value, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    if (typeof value === 'number') {
      return value;
    }

    return fallback;
  }
}