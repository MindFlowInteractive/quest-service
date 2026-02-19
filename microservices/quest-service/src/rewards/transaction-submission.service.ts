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

@Injectable()
export class TransactionSubmissionService {
  private readonly logger = new Logger(TransactionSubmissionService.name);
  private server: rpc.Server;
  private networkPassphrase: string;
  private sourceKeypair: Keypair;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('SOROBAN_RPC_URL') || 'https://soroban-testnet.stellar.org';
    this.server = new rpc.Server(rpcUrl);
    this.networkPassphrase = this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') || Networks.TESTNET;
    
    const secretKey = this.configService.get<string>('STELLAR_SECRET_KEY');
    if (secretKey) {
      this.sourceKeypair = Keypair.fromSecret(secretKey);
    } else {
      this.logger.warn('STELLAR_SECRET_KEY not provided. TransactionSubmissionService will be unable to sign transactions.');
    }
  }

  async submitTransaction(transactionBuilder: TransactionBuilder): Promise<any> {
    if (!this.sourceKeypair) {
      throw new Error('Source keypair not initialized. Cannot submit transaction.');
    }

    try {
      const preparedTransaction = await this.server.prepareTransaction(transactionBuilder);
      preparedTransaction.sign(this.sourceKeypair);

      const response = await this.server.sendTransaction(preparedTransaction);
      
      if (response.status === 'ERROR') {
        throw new Error(`Transaction failed: ${JSON.stringify(response.errorResult)}`);
      }

      this.logger.log(`Transaction submitted: ${response.hash}. Waiting for confirmation...`);

      // Wait for confirmation
      let status = await this.server.getTransaction(response.hash);
      let attempts = 0;
      const maxAttempts = 15;

      while (status.status === 'NOT_FOUND' && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        status = await this.server.getTransaction(response.hash);
        attempts++;
      }

      const isSuccess = status.status === 'SUCCESS';
      if (!isSuccess) {
        this.logger.error(`Transaction ${response.hash} failed or timed out with status: ${status.status}`);
      } else {
        this.logger.log(`Transaction ${response.hash} confirmed successfully.`);
      }

      return {
        hash: response.hash,
        status: status.status,
        result: status,
      };
    } catch (error) {
      this.logger.error('Error submitting transaction:', error);
      throw error;
    }
  }

  async signAndSubmitTokenTransfer(contractId: string, fromAddress: string, toAddress: string, amount: number): Promise<any> {
    if (!this.sourceKeypair) {
      throw new Error('Source keypair not initialized. Cannot sign transaction.');
    }

    try {
      const contract = new Contract(contractId);
      const sourceAccount = await this.server.getAccount(fromAddress);

      // Prepare the amount as a BigInt (assuming 7 decimals like lumens)
      const amountScVal = nativeToScVal(BigInt(Math.round(amount * 10000000)), { type: 'i128' });
      const toAddressScVal = new Address(toAddress).toScVal();
      const fromAddressScVal = new Address(fromAddress).toScVal();

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call('transfer', fromAddressScVal, toAddressScVal, amountScVal))
        .setTimeout(30)
        .build();

      return await this.submitTransaction(transaction);
    } catch (error) {
      this.logger.error(`Error signing and submitting token transfer:`, error);
      throw error;
    }
  }

  async prepareTokenTransfer(contractId: string, fromAddress: string, toAddress: string, amount: number): Promise<TransactionBuilder> {
    if (!this.sourceKeypair) {
      throw new Error('Source keypair not initialized. Cannot prepare transaction.');
    }

    const contract = new Contract(contractId);
    const sourceAccount = await this.server.getAccount(fromAddress);

    // Prepare the amount as a BigInt (assuming 7 decimals like lumens)
    const amountScVal = nativeToScVal(BigInt(Math.round(amount * 10000000)), { type: 'i128' });
    const toAddressScVal = new Address(toAddress).toScVal();
    const fromAddressScVal = new Address(fromAddress).toScVal();

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '1000000',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call('transfer', fromAddressScVal, toAddressScVal, amountScVal))
      .setTimeout(30)
      .build();

    return transaction;
  }

  async signTransaction(transaction: TransactionBuilder): Promise<TransactionBuilder> {
    if (!this.sourceKeypair) {
      throw new Error('Source keypair not initialized. Cannot sign transaction.');
    }

    const preparedTransaction = await this.server.prepareTransaction(transaction);
    preparedTransaction.sign(this.sourceKeypair);

    return preparedTransaction;
  }

  async checkTransactionStatus(txHash: string): Promise<any> {
    try {
      const response = await this.server.getTransaction(txHash);
      return response;
    } catch (error) {
      this.logger.error(`Error getting transaction status for ${txHash}:`, error);
      throw error;
    }
  }

  async getAccountBalances(accountId: string): Promise<any> {
    try {
      const account = await this.server.getAccount(accountId);
      return account.balances;
    } catch (error) {
      this.logger.error(`Error getting balances for account ${accountId}:`, error);
      throw error;
    }
  }

  async getContractData(contractId: string, key: xdr.ScVal): Promise<any> {
    try {
      const contract = new Contract(contractId);
      const ledgerKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
          contract: contract.address().toScAddress(),
          key: key,
          durability: xdr.ContractDataDurability.persistent(),
        }),
      );

      const response = await this.server.getLedgerEntries(ledgerKey);
      return response.entries[0];
    } catch (error) {
      this.logger.error(`Error fetching contract data for ${contractId}:`, error);
      throw error;
    }
  }
}