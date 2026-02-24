import { Injectable, Logger } from '@nestjs/common';
import {
  BlockchainTransaction,
  TransactionStatus,
  TransactionType,
  TransactionCategory,
} from '../entities/blockchain-transaction.entity';
import {
  HorizonTransactionResponse,
  HorizonOperationResponse,
} from '../interfaces/horizon-response.interface';

@Injectable()
export class TransactionParserService {
  private readonly logger = new Logger(TransactionParserService.name);

  /**
   * Parse a Horizon transaction response into our entity format
   */
  parseTransaction(
    horizonTx: HorizonTransactionResponse,
    userId?: string,
    category: TransactionCategory = TransactionCategory.USER
  ): Partial<BlockchainTransaction> {
    const status = this.determineTransactionStatus(horizonTx);
    
    return {
      transactionHash: horizonTx.hash,
      userId,
      status,
      sourceAccount: horizonTx.source_account,
      ledgerSequence: horizonTx.ledger,
      feeCharged: parseInt(horizonTx.fee_charged, 10) || 0,
      operationCount: horizonTx.operation_count,
      memo: horizonTx.memo,
      memoType: horizonTx.memo_type,
      pagingToken: horizonTx.paging_token,
      rawEnvelope: {
        envelopeXdr: horizonTx.envelope_xdr,
        resultXdr: horizonTx.result_xdr,
        resultMetaXdr: horizonTx.result_meta_xdr,
      },
      confirmedAt: status === TransactionStatus.CONFIRMED ? new Date(horizonTx.created_at) : undefined,
      failedAt: status === TransactionStatus.FAILED ? new Date(horizonTx.created_at) : undefined,
    };
  }

  /**
   * Parse operations to extract transaction type and details
   */
  parseOperations(
    operations: HorizonOperationResponse[],
    baseTransaction: Partial<BlockchainTransaction>
  ): Partial<BlockchainTransaction> {
    if (!operations || operations.length === 0) {
      return {
        ...baseTransaction,
        type: TransactionType.UNKNOWN,
      };
    }

    // For single operation transactions, use that operation's type
    if (operations.length === 1) {
      return this.parseSingleOperation(operations[0], baseTransaction);
    }

    // For multi-operation transactions, determine the primary type
    return this.parseMultiOperation(operations, baseTransaction);
  }

  /**
   * Parse a single operation
   */
  private parseSingleOperation(
    operation: HorizonOperationResponse,
    baseTransaction: Partial<BlockchainTransaction>
  ): Partial<BlockchainTransaction> {
    const type = this.mapOperationType(operation.type);
    const details = this.extractOperationDetails(operation, type);

    return {
      ...baseTransaction,
      type,
      ...details,
    };
  }

  /**
   * Parse multiple operations
   */
  private parseMultiOperation(
    operations: HorizonOperationResponse[],
    baseTransaction: Partial<BlockchainTransaction>
  ): Partial<BlockchainTransaction> {
    // Prioritize certain operation types
    const priorityTypes = [
      'invoke_host_function', // Soroban contract calls
      'payment',
      'path_payment_strict_receive',
      'path_payment_strict_send',
      'create_clawback_claimable_balance',
    ];

    let primaryOperation = operations[0];
    let highestPriority = priorityTypes.length;

    for (const op of operations) {
      const priority = priorityTypes.indexOf(op.type);
      if (priority !== -1 && priority < highestPriority) {
        highestPriority = priority;
        primaryOperation = op;
      }
    }

    const type = this.mapOperationType(primaryOperation.type);
    const details = this.extractOperationDetails(primaryOperation, type);

    return {
      ...baseTransaction,
      type,
      operationCount: operations.length,
      ...details,
    };
  }

  /**
   * Map Horizon operation type to our transaction type
   */
  private mapOperationType(horizonType: string): TransactionType {
    const typeMap: Record<string, TransactionType> = {
      // Payments
      payment: TransactionType.TOKEN_PAYMENT,
      path_payment_strict_receive: TransactionType.PATH_PAYMENT,
      path_payment_strict_send: TransactionType.PATH_PAYMENT,
      
      // Account operations
      create_account: TransactionType.ACCOUNT_CREATE,
      account_merge: TransactionType.ACCOUNT_MERGE,
      
      // Offers
      manage_buy_offer: TransactionType.OFFER_CREATE,
      manage_sell_offer: TransactionType.OFFER_CREATE,
      create_passive_sell_offer: TransactionType.OFFER_CREATE,
      
      // Soroban
      invoke_host_function: TransactionType.CONTRACT_INVOKE,
      extend_footprint_ttl: TransactionType.CONTRACT_INVOKE,
      restore_footprint: TransactionType.CONTRACT_INVOKE,
      
      // Clawbacks
      clawback: TransactionType.TOKEN_TRANSFER,
      clawback_claimable_balance: TransactionType.TOKEN_TRANSFER,
      
      // Other
      create_clawback_claimable_balance: TransactionType.TOKEN_TRANSFER,
      claim_claimable_balance: TransactionType.TOKEN_TRANSFER,
    };

    return typeMap[horizonType] || TransactionType.UNKNOWN;
  }

  /**
   * Extract operation-specific details
   */
  private extractOperationDetails(
    operation: HorizonOperationResponse,
    type: TransactionType
  ): Partial<BlockchainTransaction> {
    const details: Partial<BlockchainTransaction> = {};

    switch (type) {
      case TransactionType.TOKEN_PAYMENT:
      case TransactionType.TOKEN_TRANSFER:
        details.destinationAccount = operation.to;
        details.amount = operation.amount;
        details.assetCode = this.getAssetCode(operation);
        details.assetIssuer = operation.asset_issuer;
        break;

      case TransactionType.PATH_PAYMENT:
        details.destinationAccount = operation.to;
        details.amount = operation.amount;
        details.assetCode = this.getAssetCode(operation);
        details.assetIssuer = operation.asset_issuer;
        break;

      case TransactionType.ACCOUNT_CREATE:
        details.destinationAccount = operation.account;
        details.amount = operation.starting_balance;
        details.assetCode = 'XLM';
        break;

      case TransactionType.CONTRACT_INVOKE:
        details.contractId = operation.contract_id;
        details.functionName = operation.function;
        details.functionArgs = operation.parameters;
        
        // Try to determine if this is an NFT operation
        if (operation.function) {
          const func = operation.function.toLowerCase();
          if (func.includes('mint')) {
            details.type = TransactionType.NFT_MINT;
          } else if (func.includes('transfer') || func.includes('send')) {
            details.type = TransactionType.NFT_TRANSFER;
          } else if (func.includes('burn')) {
            details.type = TransactionType.NFT_BURN;
          }
        }
        break;

      case TransactionType.OFFER_CREATE:
      case TransactionType.OFFER_REMOVE:
        // Offer operations don't have simple destination/amount
        break;

      default:
        break;
    }

    return details;
  }

  /**
   * Get asset code from operation
   */
  private getAssetCode(operation: HorizonOperationResponse): string {
    if (operation.asset_type === 'native') {
      return 'XLM';
    }
    return operation.asset_code || 'UNKNOWN';
  }

  /**
   * Determine transaction status from Horizon response
   */
  private determineTransactionStatus(horizonTx: HorizonTransactionResponse): TransactionStatus {
    if (horizonTx.successful) {
      return TransactionStatus.CONFIRMED;
    }
    return TransactionStatus.FAILED;
  }

  /**
   * Categorize transaction based on memo and operation patterns
   */
  categorizeTransaction(
    transaction: Partial<BlockchainTransaction>,
    operations: HorizonOperationResponse[]
  ): TransactionCategory {
    // Check memo for category hints
    if (transaction.memo) {
      const memo = transaction.memo.toLowerCase();
      if (memo.includes('reward') || memo.includes('prize')) {
        return TransactionCategory.GAME_REWARD;
      }
      if (memo.includes('achievement') || memo.includes('badge')) {
        return TransactionCategory.ACHIEVEMENT;
      }
      if (memo.includes('tournament')) {
        return TransactionCategory.TOURNAMENT;
      }
      if (memo.includes('referral')) {
        return TransactionCategory.REFERRAL;
      }
      if (memo.includes('purchase') || memo.includes('buy')) {
        return TransactionCategory.PURCHASE;
      }
      if (memo.includes('withdraw')) {
        return TransactionCategory.WITHDRAWAL;
      }
      if (memo.includes('deposit')) {
        return TransactionCategory.DEPOSIT;
      }
    }

    // Check operations for patterns
    for (const op of operations) {
      // Check for known game contract IDs
      if (op.contract_id) {
        // This would be configured based on your deployed contracts
        // For now, default to game_reward for contract invocations
        if (transaction.type === TransactionType.NFT_MINT || 
            transaction.type === TransactionType.TOKEN_TRANSFER) {
          return TransactionCategory.GAME_REWARD;
        }
      }
    }

    return TransactionCategory.USER;
  }

  /**
   * Extract user ID from transaction memo or other patterns
   */
  extractUserId(transaction: Partial<BlockchainTransaction>): string | undefined {
    if (!transaction.memo) return undefined;

    // Look for UUID patterns in memo
    const uuidMatch = transaction.memo.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (uuidMatch) {
      return uuidMatch[0];
    }

    // Look for "user:xxx" or "uid:xxx" patterns
    const userMatch = transaction.memo.match(/(?:user|uid):([a-zA-Z0-9_-]+)/i);
    if (userMatch) {
      return userMatch[1];
    }

    return undefined;
  }
}
