import { Injectable, Logger } from '@nestjs/common';
import {
  Keypair,
  Networks,
  rpc,
  TransactionBuilder,
  Contract,
  xdr,
} from '@stellar/stellar-sdk';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class SorobanService {
  private readonly logger = new Logger(SorobanService.name);
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
      this.logger.warn('STELLAR_SECRET_KEY not provided. SorobanService will be unable to sign transactions.');
    }
  }

  async invokeContract(
    contractId: string,
    method: string,
    params: xdr.ScVal[],
  ) {
    if (!this.sourceKeypair) {
      throw new Error('Source keypair not initialized. Cannot invoke contract.');
    }

    try {
      const contract = new Contract(contractId);
      const sourceAccount = await this.server.getAccount(
        this.sourceKeypair.publicKey(),
      );

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(method, ...params))
        .setTimeout(30)
        .build();

      const preparedTransaction = await this.server.prepareTransaction(transaction);
      preparedTransaction.sign(this.sourceKeypair);

      const response = await this.server.sendTransaction(preparedTransaction);
      
      if (response.status === 'ERROR') {
        throw new Error(`Transaction failed: ${JSON.stringify(response.errorResult)}`);
      }

      this.logger.log(`Transaction sent: ${response.hash}. Waiting for confirmation...`);

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
      this.logger.error(`Error invoking contract ${contractId} method ${method}:`, error);
      throw error;
    }
  }

  async getContractData(contractId: string, key: xdr.ScVal) {
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
