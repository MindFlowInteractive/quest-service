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
export class SorobanTokenService {
  private readonly logger = new Logger(SorobanTokenService.name);
  private server: rpc.Server;
  private networkPassphrase: string;
  private sourceKeypair: Keypair;
  private tokenContractId: string;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('SOROBAN_RPC_URL') || 'https://soroban-testnet.stellar.org';
    this.server = new rpc.Server(rpcUrl);
    this.networkPassphrase = this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') || Networks.TESTNET;
    this.tokenContractId = this.configService.get<string>('TOKEN_CONTRACT_ID');
    
    const secretKey = this.configService.get<string>('STELLAR_SECRET_KEY');
    if (secretKey) {
      this.sourceKeypair = Keypair.fromSecret(secretKey);
    } else {
      this.logger.warn('STELLAR_SECRET_KEY not provided. SorobanTokenService will be unable to sign transactions.');
    }
  }

  async transferTokens(toAddress: string, amount: number): Promise<any> {
    if (!this.sourceKeypair) {
      throw new Error('Source keypair not initialized. Cannot transfer tokens.');
    }

    if (!this.tokenContractId) {
      throw new Error('TOKEN_CONTRACT_ID not configured. Cannot transfer tokens.');
    }

    try {
      const contract = new Contract(this.tokenContractId);
      const sourceAccount = await this.server.getAccount(
        this.sourceKeypair.publicKey(),
      );

      // Prepare the amount as a BigInt (assuming 7 decimals like lumens)
      const amountScVal = nativeToScVal(BigInt(Math.round(amount * 10000000)), { type: 'i128' });
      const toAddressScVal = new Address(toAddress).toScVal();

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call('transfer', this.sourceKeypair, toAddressScVal, amountScVal))
        .setTimeout(30)
        .build();

      const preparedTransaction = await this.server.prepareTransaction(transaction);
      preparedTransaction.sign(this.sourceKeypair);

      const response = await this.server.sendTransaction(preparedTransaction);
      
      if (response.status === 'ERROR') {
        throw new Error(`Transaction failed: ${JSON.stringify(response.errorResult)}`);
      }

      this.logger.log(`Token transfer transaction sent: ${response.hash}. Waiting for confirmation...`);

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
        this.logger.log(`Token transfer transaction ${response.hash} confirmed successfully.`);
      }

      return {
        hash: response.hash,
        status: status.status,
        result: status,
        amount,
        recipient: toAddress,
      };
    } catch (error) {
      this.logger.error(`Error transferring tokens to ${toAddress}:`, error);
      throw error;
    }
  }

  async getTokenBalance(accountId: string): Promise<number> {
    if (!this.tokenContractId) {
      throw new Error('TOKEN_CONTRACT_ID not configured. Cannot check balance.');
    }

    try {
      const contract = new Contract(this.tokenContractId);
      const params = [new Address(accountId).toScVal()];
      
      const result = await this.invokeReadOnlyContract(
        this.tokenContractId,
        'balance',
        params
      );
      
      // Extract the balance from the result (this may vary depending on contract response format)
      if (result && result.result) {
        // Assuming the balance is returned as an i128 value
        const balanceRaw = result.result.returnValue;
        if (balanceRaw && balanceRaw._value) {
          // Convert from stroops (assuming 7 decimal places) back to readable amount
          return Number(balanceRaw._value) / 10000000;
        }
      }
      
      return 0;
    } catch (error) {
      this.logger.error(`Error getting token balance for account ${accountId}:`, error);
      throw error;
    }
  }

  async checkTokenAllowance(owner: string, spender: string): Promise<number> {
    if (!this.tokenContractId) {
      throw new Error('TOKEN_CONTRACT_ID not configured. Cannot check allowance.');
    }

    try {
      const contract = new Contract(this.tokenContractId);
      const ownerScVal = new Address(owner).toScVal();
      const spenderScVal = new Address(spender).toScVal();
      
      const result = await this.invokeReadOnlyContract(
        this.tokenContractId,
        'allowance',
        [ownerScVal, spenderScVal]
      );
      
      if (result && result.result) {
        const allowanceRaw = result.result.returnValue;
        if (allowanceRaw && allowanceRaw._value) {
          return Number(allowanceRaw._value) / 10000000;
        }
      }
      
      return 0;
    } catch (error) {
      this.logger.error(`Error checking token allowance for ${owner} to ${spender}:`, error);
      throw error;
    }
  }

  private async invokeReadOnlyContract(
    contractId: string,
    method: string,
    params: xdr.ScVal[],
  ) {
    try {
      const contract = new Contract(contractId);
      const sourceAccount = await this.server.getAccount(
        this.sourceKeypair.publicKey(),
      );

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(method, ...params))
        .setTimeout(30)
        .build();

      const simulation = await this.server.simulateTransaction(transaction);
      return simulation;
    } catch (error) {
      this.logger.error(`Error simulating contract call ${contractId}.${method}:`, error);
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