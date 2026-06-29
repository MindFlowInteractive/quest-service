import { Injectable, Logger } from '@nestjs/common';
import {
  Keypair,
  Networks,
  rpc,
  TransactionBuilder,
  Contract,
  xdr,
  nativeToScVal,
  Address,
} from '@stellar/stellar-sdk';
import { ConfigService } from '@nestjs/config';

/**
 * StellarService
 *
 * Handles all interactions with the Stellar blockchain via Soroban RPC.
 * Responsibilities:
 *  - Contract invocation (method calls with parameters)
 *  - Transaction signing and submission
 *  - Transaction confirmation polling
 *  - Account and contract data queries
 *  - Token balance queries
 */
@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);
  private readonly server: rpc.Server;
  private readonly networkPassphrase: string;
  private readonly sourceKeypair: Keypair | null;

  // Configuration constants
  private readonly TX_TIMEOUT_SECONDS = 30;
  private readonly TX_POLL_INTERVAL_MS = 1000;
  private readonly TX_MAX_POLL_ATTEMPTS = 15;
  private readonly BASE_FEE = '1000000'; // stroops

  constructor(private readonly configService: ConfigService) {
    const rpcUrl =
      this.configService.get<string>('SOROBAN_RPC_URL') ||
      'https://soroban-testnet.stellar.org';
    this.server = new rpc.Server(rpcUrl);

    this.networkPassphrase =
      this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') ||
      Networks.TESTNET;

    const secretKey = this.configService.get<string>('STELLAR_SECRET_KEY');
    if (secretKey) {
      try {
        this.sourceKeypair = Keypair.fromSecret(secretKey);
        this.logger.log(
          `Stellar service initialized with account: ${this.sourceKeypair.publicKey()}`,
        );
      } catch (error) {
        this.logger.error('Invalid STELLAR_SECRET_KEY format:', error);
        this.sourceKeypair = null;
      }
    } else {
      this.logger.warn(
        'STELLAR_SECRET_KEY not provided. Contract invocation will fail.',
      );
      this.sourceKeypair = null;
    }
  }

  // ─── Contract Invocation ──────────────────────────────────────────────────────
  /**
   * Invoke a contract method on the Stellar blockchain.
   *
   * Process:
   *  1. Build transaction with contract call
   *  2. Prepare transaction (simulate)
   *  3. Sign with source keypair
   *  4. Submit to network
   *  5. Poll for confirmation (up to 15 seconds)
   *
   * Returns transaction hash and final status.
   */
  async invokeContract(
    contractId: string,
    method: string,
    params: xdr.ScVal[],
  ): Promise<{ hash: string; status: string; result: any }> {
    if (!this.sourceKeypair) {
      throw new Error(
        'Source keypair not initialized. Cannot invoke contract.',
      );
    }

    this.logger.debug(
      `Invoking contract ${contractId}.${method} with ${params.length} param(s)`,
    );

    try {
      const contract = new Contract(contractId);
      const sourceAccount = await this.server.getAccount(
        this.sourceKeypair.publicKey(),
      );

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: this.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(method, ...params))
        .setTimeout(this.TX_TIMEOUT_SECONDS)
        .build();

      this.logger.debug(`Preparing transaction for ${contractId}.${method}...`);
      const preparedTransaction = await this.server.prepareTransaction(
        transaction,
      );
      preparedTransaction.sign(this.sourceKeypair);

      this.logger.debug(`Submitting transaction...`);
      const response = await this.server.sendTransaction(preparedTransaction);

      if (response.status === 'ERROR') {
        throw new Error(
          `Transaction submission failed: ${JSON.stringify(response.errorResult)}`,
        );
      }

      this.logger.log(
        `Transaction submitted: ${response.hash}. Polling for confirmation...`,
      );

      // Poll for confirmation
      const finalStatus = await this.pollTransactionStatus(response.hash);

      if (finalStatus.status === 'SUCCESS') {
        this.logger.log(
          `Transaction ${response.hash} confirmed successfully.`,
        );
      } else {
        this.logger.warn(
          `Transaction ${response.hash} did not confirm. Status: ${finalStatus.status}`,
        );
      }

      return {
        hash: response.hash,
        status: finalStatus.status,
        result: finalStatus,
      };
    } catch (error) {
      this.logger.error(
        `Error invoking contract ${contractId}.${method}:`,
        error,
      );
      throw error;
    }
  }

  // ─── Contract Data Queries ────────────────────────────────────────────────────
  /**
   * Fetch persistent contract data by key.
   */
  async getContractData(
    contractId: string,
    key: xdr.ScVal,
  ): Promise<any> {
    try {
      const contract = new Contract(contractId);
      const ledgerKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
          contract: contract.address().toScAddress(),
          key: key,
          durability: xdr.ContractDataDurability.persistent(),
        }),
      );

      this.logger.debug(`Fetching contract data for ${contractId}...`);
      const response = await this.server.getLedgerEntries(ledgerKey);

      if (!response.entries || response.entries.length === 0) {
        this.logger.warn(`No contract data found for ${contractId}`);
        return null;
      }

      return response.entries[0];
    } catch (error) {
      this.logger.error(
        `Error fetching contract data for ${contractId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get token balance for an account from a token contract.
   */
  async getTokenBalance(
    accountId: string,
    tokenContractId: string,
  ): Promise<any> {
    try {
      this.logger.debug(
        `Fetching token balance for ${accountId} from ${tokenContractId}...`,
      );

      const params = [new Address(accountId).toScVal()];

      const result = await this.invokeContract(
        tokenContractId,
        'balance',
        params,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting token balance for account ${accountId}:`,
        error,
      );
      throw error;
    }
  }

  // ─── Account Queries ──────────────────────────────────────────────────────────
  /**
   * Check if a Stellar account exists on the network.
   */
  async checkIfAccountExists(accountId: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking if account ${accountId} exists...`);
      const account = await this.server.getAccount(accountId);
      return !!account;
    } catch (error) {
      if (error.message?.includes('Resource Missing')) {
        this.logger.debug(`Account ${accountId} does not exist`);
        return false;
      }
      this.logger.error(
        `Error checking if account ${accountId} exists:`,
        error,
      );
      throw error;
    }
  }

  // ─── Transaction Status ───────────────────────────────────────────────────────
  /**
   * Get the status of a transaction by hash.
   */
  async getTransactionStatus(txHash: string): Promise<any> {
    try {
      this.logger.debug(`Fetching transaction status for ${txHash}...`);
      const response = await this.server.getTransaction(txHash);
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting transaction status for ${txHash}:`,
        error,
      );
      throw error;
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────
  /**
   * Poll the transaction status until it's confirmed or times out.
   * Polls every 1 second for up to 15 seconds.
   */
  private async pollTransactionStatus(txHash: string): Promise<any> {
    let attempts = 0;

    while (attempts < this.TX_MAX_POLL_ATTEMPTS) {
      try {
        const status = await this.server.getTransaction(txHash);

        if (status.status !== 'NOT_FOUND') {
          this.logger.debug(
            `Transaction ${txHash} status: ${status.status} (attempt ${attempts + 1})`,
          );
          return status;
        }

        attempts++;
        if (attempts < this.TX_MAX_POLL_ATTEMPTS) {
          await this.sleep(this.TX_POLL_INTERVAL_MS);
        }
      } catch (error) {
        this.logger.warn(
          `Error polling transaction ${txHash} (attempt ${attempts + 1}):`,
          error,
        );
        attempts++;
        if (attempts < this.TX_MAX_POLL_ATTEMPTS) {
          await this.sleep(this.TX_POLL_INTERVAL_MS);
        }
      }
    }

    this.logger.warn(
      `Transaction ${txHash} did not confirm after ${this.TX_MAX_POLL_ATTEMPTS} attempts`,
    );
    return { status: 'TIMEOUT', hash: txHash };
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
