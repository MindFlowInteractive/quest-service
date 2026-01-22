import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'crypto';
import type { WalletSession } from './interfaces/wallet-session.interface';
import type {
  WalletTransaction,
  WalletTransactionType,
} from './interfaces/wallet-transaction.interface';
import {
  getAssetKey,
  getDefaultTokenMetadata,
  isValidStellarPublicKey,
  normalizeAsset,
  parseAmountToInt,
  type StellarAsset,
  type TokenMetadata,
  verifyEd25519Signature,
} from './utils/stellar';

interface WalletChallenge {
  nonce: string;
  publicKey: string;
  network: string;
  message: string;
  expiresAt: Date;
}

interface HorizonAccountResponse {
  balances?: Array<{
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
  }>;
}

interface HorizonOperationsResponse {
  _embedded?: {
    records?: any[];
  };
}

@Injectable()
export class WalletService {
  private readonly challengeTtlMs: number;
  private readonly sessionTtlMs: number;
  private readonly maxRecordedTransactions: number;
  private readonly allowedNetworks: string[];
  private readonly tokenMetadata: Map<string, TokenMetadata>;

  private readonly challenges = new Map<string, WalletChallenge>();
  private readonly sessions = new Map<string, WalletSession>();
  private readonly recordedTransactions = new Map<string, WalletTransaction[]>();

  constructor(private readonly configService: ConfigService) {
    this.challengeTtlMs = this.readNumber('WALLET_CHALLENGE_TTL_MS', 5 * 60 * 1000);
    this.sessionTtlMs = this.readNumber('WALLET_SESSION_TTL_MS', 24 * 60 * 60 * 1000);
    this.maxRecordedTransactions = this.readNumber('WALLET_MAX_RECORDED_TRANSACTIONS', 1000);
    this.allowedNetworks = this.parseAllowedNetworks();
    this.tokenMetadata = this.loadTokenMetadata();
  }

  createChallenge(publicKey: string, network: string) {
    this.ensureValidPublicKey(publicKey);
    const normalizedNetwork = this.normalizeNetwork(network);
    this.ensureAllowedNetwork(normalizedNetwork);

    const nonce = randomBytes(16).toString('hex');
    const issuedAt = new Date();
    const message = [
      'LogiQuest Wallet Authentication',
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
      status: 'challenge',
      nonce,
      message,
      expiresAt: expiresAt.toISOString(),
    };
  }

  verifyChallenge(
    publicKey: string,
    network: string,
    nonce: string,
    signature: string,
  ) {
    this.ensureValidPublicKey(publicKey);
    const normalizedNetwork = this.normalizeNetwork(network);
    this.ensureAllowedNetwork(normalizedNetwork);

    const challenge = this.challenges.get(nonce);
    if (!challenge) {
      throw new UnauthorizedException('Challenge not found or already used');
    }

    if (challenge.publicKey !== publicKey || challenge.network !== normalizedNetwork) {
      throw new UnauthorizedException('Challenge does not match wallet');
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      this.challenges.delete(nonce);
      throw new UnauthorizedException('Challenge expired');
    }

    const isValid = verifyEd25519Signature(publicKey, challenge.message, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid wallet signature');
    }

    this.challenges.delete(nonce);

    const sessionToken = randomUUID();
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
      status: 'connected',
      sessionToken,
      publicKey,
      network: normalizedNetwork,
      expiresAt: expiresAt.toISOString(),
    };
  }

  getSession(sessionToken: string): WalletSession {
    const session = this.sessions.get(sessionToken);
    if (!session) {
      throw new UnauthorizedException('Wallet session not found');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(sessionToken);
      throw new UnauthorizedException('Wallet session expired');
    }

    session.lastUsedAt = new Date();
    return session;
  }

  disconnect(sessionToken: string) {
    if (!this.sessions.has(sessionToken)) {
      throw new UnauthorizedException('Wallet session not found');
    }

    this.sessions.delete(sessionToken);
    return { status: 'disconnected' };
  }

  async getBalances(session: WalletSession) {
    const account = await this.fetchAccount(session.publicKey, session.network);
    const balances = account?.balances ?? [];
    const mappedBalances = balances.map((balance) => {
      const asset = this.mapBalanceToAsset(balance);
      const metadata =
        this.tokenMetadata.get(getAssetKey(asset)) ||
        getDefaultTokenMetadata(asset);

      return {
        asset,
        balance: balance.balance,
        decimals: metadata.decimals ?? 7,
        symbol: metadata.symbol || metadata.code,
        name: metadata.name || metadata.code,
      };
    });

    if (!mappedBalances.some((balance) => balance.asset.type === 'native')) {
      const asset = { type: 'native', code: 'XLM' } as StellarAsset;
      const metadata = getDefaultTokenMetadata(asset);
      mappedBalances.unshift({
        asset,
        balance: '0',
        decimals: metadata.decimals ?? 7,
        symbol: metadata.symbol || metadata.code,
        name: metadata.name || metadata.code,
      });
    }

    return { balances: mappedBalances };
  }

  async getTransactionHistory(session: WalletSession, limit = 20, cursor?: string) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const onChain = await this.fetchOnChainOperations(
      session.publicKey,
      session.network,
      safeLimit,
      cursor,
    );

    const recorded = this.getRecordedTransactions(session.publicKey).map(
      (transaction) => ({
        id: transaction.id,
        source: 'recorded',
        type: transaction.type,
        status: transaction.status,
        asset: transaction.asset,
        amount: transaction.amount,
        transactionHash: transaction.transactionHash,
        createdAt: transaction.createdAt.toISOString(),
      }),
    );

    const combined = [...recorded, ...onChain];
    combined.sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return right - left;
    });

    return { transactions: combined };
  }

  async recordPurchase(session: WalletSession, payload: { assetCode: string; issuer?: string; amount: string; transactionHash: string }) {
    return this.recordTransaction(session, payload, 'purchase');
  }

  async recordSpend(session: WalletSession, payload: { assetCode: string; issuer?: string; amount: string; transactionHash: string }) {
    return this.recordTransaction(session, payload, 'spend');
  }

  private async recordTransaction(
    session: WalletSession,
    payload: { assetCode: string; issuer?: string; amount: string; transactionHash: string },
    type: WalletTransactionType,
  ) {
    const asset = this.ensureValidAsset(payload.assetCode, payload.issuer);
    const amountInt = this.ensureValidAmount(payload.amount);
    const transactionHash = this.ensureValidTransactionHash(payload.transactionHash);

    const existing = this.findRecordedTransaction(session.publicKey, transactionHash, type);
    if (existing) {
      return existing;
    }

    const matches = await this.verifyPaymentOnChain(
      session.publicKey,
      session.network,
      transactionHash,
      asset,
      amountInt,
      type,
    );

    if (!matches) {
      throw new BadRequestException('Transaction does not match requested transfer');
    }

    const transaction: WalletTransaction = {
      id: randomUUID(),
      publicKey: session.publicKey,
      network: session.network,
      type,
      status: 'confirmed',
      asset,
      amount: payload.amount,
      transactionHash,
      createdAt: new Date(),
    };

    const list = this.getRecordedTransactions(session.publicKey);
    list.unshift(transaction);
    if (list.length > this.maxRecordedTransactions) {
      list.splice(this.maxRecordedTransactions);
    }

    this.recordedTransactions.set(session.publicKey, list);
    return transaction;
  }

  private ensureValidPublicKey(publicKey: string) {
    if (!isValidStellarPublicKey(publicKey)) {
      throw new BadRequestException('Invalid Stellar public key');
    }
  }

  private ensureValidAsset(assetCode: string, issuer?: string): StellarAsset {
    try {
      return normalizeAsset(assetCode, issuer);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  private ensureValidAmount(amount: string): bigint {
    try {
      const value = parseAmountToInt(amount, 7);
      if (value <= 0n) {
        throw new Error('Amount must be greater than zero');
      }
      return value;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  private ensureValidTransactionHash(transactionHash: string): string {
    const normalized = transactionHash.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(normalized)) {
      throw new BadRequestException('Invalid transaction hash');
    }
    return normalized;
  }

  private normalizeNetwork(network: string): string {
    const normalized = network.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('Network is required');
    }
    return normalized;
  }

  private ensureAllowedNetwork(network: string) {
    if (!this.allowedNetworks.includes(network)) {
      throw new BadRequestException('Unsupported Stellar network');
    }
  }

  private parseAllowedNetworks(): string[] {
    const raw = this.configService.get('STELLAR_ALLOWED_NETWORKS') || process.env.STELLAR_ALLOWED_NETWORKS;
    const value = typeof raw === 'string' && raw.trim() ? raw : 'testnet';
    return value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }

  private loadTokenMetadata(): Map<string, TokenMetadata> {
    const raw = this.configService.get('STELLAR_TOKEN_LIST') || process.env.STELLAR_TOKEN_LIST;
    if (typeof raw !== 'string' || !raw.trim()) {
      return new Map();
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return new Map();
      }

      const map = new Map<string, TokenMetadata>();
      for (const entry of parsed) {
        if (!entry || typeof entry.code !== 'string') {
          continue;
        }

        const asset = entry.code.toUpperCase() === 'XLM'
          ? { type: 'native', code: 'XLM' } as StellarAsset
          : normalizeAsset(entry.code, entry.issuer);
        map.set(getAssetKey(asset), {
          code: entry.code,
          issuer: entry.issuer,
          name: entry.name,
          symbol: entry.symbol,
          decimals: typeof entry.decimals === 'number' ? entry.decimals : 7,
        });
      }

      return map;
    } catch {
      return new Map();
    }
  }

  private async fetchAccount(publicKey: string, network: string): Promise<HorizonAccountResponse | null> {
    const url = `${this.getHorizonUrl(network)}/accounts/${publicKey}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch Stellar account');
    }

    return response.json();
  }

  private mapBalanceToAsset(balance: { asset_type: string; asset_code?: string; asset_issuer?: string }): StellarAsset {
    if (balance.asset_type === 'native') {
      return { type: 'native', code: 'XLM' };
    }

    return {
      type: balance.asset_type as StellarAsset['type'],
      code: balance.asset_code || 'UNKNOWN',
      issuer: balance.asset_issuer,
    };
  }

  private async fetchOnChainOperations(
    publicKey: string,
    network: string,
    limit: number,
    cursor?: string,
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      order: 'desc',
    });

    if (cursor) {
      params.set('cursor', cursor);
    }

    const url = `${this.getHorizonUrl(network)}/accounts/${publicKey}/operations?${params.toString()}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new BadRequestException('Failed to fetch transaction history');
    }

    const data = (await response.json()) as HorizonOperationsResponse;
    const records = data._embedded?.records ?? [];

    return records
      .map((record) => this.mapOperationToHistory(record))
      .filter((entry) => entry !== null);
  }

  private mapOperationToHistory(record: any) {
    const type = record.type;
    const createdAt = record.created_at || new Date().toISOString();

    if (type === 'payment' || type?.startsWith('path_payment')) {
      const asset = record.asset_type === 'native'
        ? ({ type: 'native', code: 'XLM' } as StellarAsset)
        : ({
            type: record.asset_type,
            code: record.asset_code,
            issuer: record.asset_issuer,
          } as StellarAsset);

      return {
        id: record.id,
        source: 'chain',
        type: record.type,
        status: record.transaction_successful ? 'confirmed' : 'failed',
        asset,
        amount: record.amount,
        from: record.from,
        to: record.to,
        transactionHash: record.transaction_hash,
        createdAt,
      };
    }

    if (type === 'create_account') {
      return {
        id: record.id,
        source: 'chain',
        type: record.type,
        status: record.transaction_successful ? 'confirmed' : 'failed',
        asset: { type: 'native', code: 'XLM' } as StellarAsset,
        amount: record.starting_balance,
        from: record.funder,
        to: record.account,
        transactionHash: record.transaction_hash,
        createdAt,
      };
    }

    return null;
  }

  private async verifyPaymentOnChain(
    publicKey: string,
    network: string,
    transactionHash: string,
    asset: StellarAsset,
    amount: bigint,
    type: WalletTransactionType,
  ): Promise<boolean> {
    const baseUrl = this.getHorizonUrl(network);
    const transactionUrl = `${baseUrl}/transactions/${transactionHash}`;
    const transactionResponse = await fetch(transactionUrl, {
      headers: { Accept: 'application/json' },
    });

    if (transactionResponse.status === 404) {
      throw new NotFoundException('Transaction not found on network');
    }

    if (!transactionResponse.ok) {
      throw new BadRequestException('Failed to verify transaction');
    }

    const transaction = await transactionResponse.json();
    if (!transaction.successful) {
      throw new BadRequestException('Transaction was not successful');
    }

    const operationsUrl = `${baseUrl}/transactions/${transactionHash}/operations?limit=200`;
    const operationsResponse = await fetch(operationsUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!operationsResponse.ok) {
      throw new BadRequestException('Failed to load transaction operations');
    }

    const operations = (await operationsResponse.json()) as HorizonOperationsResponse;
    const records = operations._embedded?.records ?? [];

    for (const record of records) {
      if (record.type !== 'payment' && !record.type?.startsWith('path_payment')) {
        continue;
      }

      const from = record.from || record.source_account;
      const to = record.to;
      if (type === 'purchase' && to !== publicKey) {
        continue;
      }

      if (type === 'spend' && from !== publicKey) {
        continue;
      }

      if (!this.assetMatchesRecord(asset, record)) {
        continue;
      }

      try {
        const opAmount = parseAmountToInt(record.amount, 7);
        if (opAmount !== amount) {
          continue;
        }
      } catch {
        continue;
      }

      return true;
    }

    return false;
  }

  private assetMatchesRecord(asset: StellarAsset, record: any): boolean {
    if (asset.type === 'native') {
      return record.asset_type === 'native';
    }

    return (
      record.asset_type === asset.type &&
      record.asset_code === asset.code &&
      record.asset_issuer === asset.issuer
    );
  }

  private getRecordedTransactions(publicKey: string): WalletTransaction[] {
    return this.recordedTransactions.get(publicKey) || [];
  }

  private findRecordedTransaction(
    publicKey: string,
    transactionHash: string,
    type: WalletTransactionType,
  ): WalletTransaction | undefined {
    const transactions = this.getRecordedTransactions(publicKey);
    return transactions.find(
      (transaction) =>
        transaction.transactionHash === transactionHash && transaction.type === type,
    );
  }

  private getHorizonUrl(network: string): string {
    const override = this.configService.get('STELLAR_HORIZON_URL') || process.env.STELLAR_HORIZON_URL;
    if (override) {
      return override;
    }

    if (network === 'public') {
      return (
        this.configService.get('STELLAR_HORIZON_URL_PUBLIC') ||
        process.env.STELLAR_HORIZON_URL_PUBLIC ||
        'https://horizon.stellar.org'
      );
    }

    if (network === 'testnet') {
      return (
        this.configService.get('STELLAR_HORIZON_URL_TESTNET') ||
        process.env.STELLAR_HORIZON_URL_TESTNET ||
        'https://horizon-testnet.stellar.org'
      );
    }

    const custom = this.configService.get(`STELLAR_HORIZON_URL_${network.toUpperCase()}`);
    if (custom) {
      return custom;
    }

    throw new BadRequestException('Horizon URL not configured for network');
  }

  private readNumber(key: string, fallback: number): number {
    const value = this.configService.get(key) || process.env[key];
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    if (typeof value === 'number') {
      return value;
    }

    return fallback;
  }
}
