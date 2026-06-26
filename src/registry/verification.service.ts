import { Injectable, BadRequestException } from '@nestjs/common';
import { rpc, StrKey } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  private rpcInstance: rpc.Server;

  constructor() {
    // Falls back to Stellar testnet RPC endpoint
    this.rpcInstance = new rpc.Server(process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org');
  }

  /**
   * Generates a deterministic SHA256 hash from raw file buffers
   */
  calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Compares uploaded source compilation directly to live ledger states
   */
  async verifyContractBytecode(contractId: string, uploadedWasm: Buffer): Promise<boolean> {
    if (!StrKey.isValidContract(contractId)) {
      throw new BadRequestException('Invalid Soroban Contract ID format.');
    }

    try {
      // Fetch the on-chain contract binary from the network RPC
      const contractData = await this.rpcInstance.getContractWasmByContractId(contractId);
      const contractBytes = Buffer.isBuffer(contractData)
        ? contractData
        : typeof contractData === 'string'
        ? Buffer.from(contractData, 'hex')
        : Buffer.from(contractData as ArrayBuffer);

      const onChainHash = this.calculateHash(contractBytes);
      const uploadedHash = this.calculateHash(uploadedWasm);

      return onChainHash === uploadedHash;
    } catch (error) {
      throw new BadRequestException(`Failed to cross-verify bytecode against network: ${error.message}`);
    }
  }
}