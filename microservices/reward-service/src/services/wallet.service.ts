import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keypair } from '@stellar/stellar-sdk';
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

/**
 * WalletService
 *
 * Freighter challenge/verify authentication flow imlemented:
 *  1. POST /wallet/challenge  → returns a signed message for the client to sign
 *  2. POST /wallet/verify     → verifies the Ed25519 signature and issues a session token
 *
 * Sessions and challenges are stored in memory. For production horizontal
 * scaling, replace the Maps with a Redis-backed store.
 */
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
    this.challengeTtlMs = this.readNumber(
      'WALLET_CHALLENGE_TTL_MS',
      5 * 60 * 1000, // 5 minutes
    );
    this.sessionTtlMs = this.readNumber(
      'WALLET_SESSION_TTL_MS',
      24 * 60 * 60 * 1000, // 24 hours
    );
  }

  // ─── Challenge / Verify ──────────────────────────────────────────────────────

  async createChallenge(publicKey: string, network: string) {
    this.validatePublicKey(publicKey);
    const normalizedNetwork = this.normalizeNetwork(network);

    const nonce = this.generateNonce();
    const issuedAt = new Date();

    const message = [
      'LogiQuest Reward Service Authentication',
      `Public Key: ${publicKey}`,
      `Nonce: ${nonce}`,
      `Network: ${normalizedNetwork}`,
      `Issued At: ${issuedAt.toISOString()}`,
    ].join('\n');

    const expiresAt = new Date(issuedAt.getTime() + this.challengeTtlMs);

    this.challenges.set(nonce, {
      nonce,
      publicKey,
      network: normalizedNetwork,
      message,
      expiresAt,
    });

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

    if (
      challenge.publicKey !== publicKey ||
      challenge.network !== normalizedNetwork
    ) {
      throw new BadRequestException('Challenge does not match wallet');
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      this.challenges.delete(nonce);
      throw new BadRequestException('Challenge expired');
    }

    // Verify Ed25519 signature using the Stellar SDK
    const isValid = this.verifySignature(
      publicKey,
      challenge.message,
      signature,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid wallet signature');
    }

    // consume the nonce (replay protection)
    this.challenges.delete(nonce);

    const sessionToken = this.generateSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTtlMs);

    this.sessions.set(sessionToken, {
      sessionToken,
      publicKey,
      network: normalizedNetwork,
      createdAt: now,
      expiresAt,
      lastUsedAt: now,
    });

    return {
      status: 'authenticated',
      sessionToken,
      publicKey,
      network: normalizedNetwork,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // ─── Session management ──────────────────────────────────────────────────────

  async getSession(sessionToken: string): Promise<WalletSession> {
    const session = this.sessions.get(sessionToken);
    if (!session) throw new NotFoundException('Wallet session not found');

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

  // ─── Blockchain queries ──────────────────────────────────────────────────────

  async getWalletBalance(sessionToken: string) {
    const session = await this.getSession(sessionToken);
    const rewardContractId = this.configService.get<string>(
      'REWARD_CONTRACT_ID',
    );
    return this.stellarService.getTokenBalance(
      session.publicKey,
      rewardContractId,
    );
  }

  async getWalletTransactions(sessionToken: string) {
    await this.getSession(sessionToken);
    // Full Horizon / indexer integration goes here
    return [];
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────
  /**
   * Stellar SDK's Keypair to perform proper Ed25519 signature verification.
   * The client (Freighter) signs the UTF-8 message bytes; signature must be
   * base64-encoded.
   */
  private verifySignature(
    publicKey: string,
    message: string,
    signature: string,
  ): boolean {
    try {
      const keypair = Keypair.fromPublicKey(publicKey);
      const messageBytes = Buffer.from(message, 'utf8');
      const sigBytes = Buffer.from(signature, 'base64');
      return keypair.verify(messageBytes, sigBytes);
    } catch (err) {
      this.logger.warn(`Signature verification threw: ${err.message}`);
      return false;
    }
  }

  private validatePublicKey(publicKey: string): void {
    try {
      Keypair.fromPublicKey(publicKey);
    } catch {
      throw new BadRequestException('Invalid Stellar public key format');
    }
  }

  private normalizeNetwork(network: string): string {
    const n = network?.trim().toLowerCase();
    if (!n) throw new BadRequestException('Network is required');
    return n;
  }

  private generateNonce(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');
  }

  private generateSessionToken(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');
  }

  private readNumber(key: string, fallback: number): number {
    const value = this.configService.get(key);
    if (typeof value === 'string' && value.trim()) {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) return parsed;
    }
    if (typeof value === 'number') return value;
    return fallback;
  }
}
