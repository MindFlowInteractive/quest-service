import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';

@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);
  private readonly server: StellarSdk.Horizon.Server;
  private readonly networkPassphrase: string;

  constructor(private configService: ConfigService) {
    const horizonUrl = this.configService.get<string>('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org');
    this.server = new StellarSdk.Horizon.Server(horizonUrl);
    this.networkPassphrase = this.configService.get<string>('STELLAR_NETWORK', 'Test SDF Network ; September 2015');
  }

  async getAccountBalances(address: string) {
    try {
      const account = await this.server.loadAccount(address);
      return account.balances.map((b) => ({
        asset_type: b.asset_type,
        asset_code: (b as any).asset_code || 'XLM',
        asset_issuer: (b as any).asset_issuer,
        balance: b.balance,
      }));
    } catch (error) {
      this.logger.error(`Error fetching balances for ${address}: ${error.message}`);
      throw error;
    }
  }

  async getTransactionHistory(address: string, limit = 10) {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(address)
        .order('desc')
        .limit(limit)
        .call();
      return transactions.records;
    } catch (error) {
      this.logger.error(`Error fetching transactions for ${address}: ${error.message}`);
      throw error;
    }
  }

  async verifyAddress(address: string): Promise<boolean> {
    try {
      await this.server.loadAccount(address);
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }
}
