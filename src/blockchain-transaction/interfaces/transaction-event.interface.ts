import { TransactionStatus, TransactionType, TransactionCategory } from '../entities/blockchain-transaction.entity';

export interface TransactionEvent {
  eventType: 'transaction_created' | 'transaction_confirmed' | 'transaction_failed' | 'transaction_retry';
  transactionHash: string;
  userId?: string;
  status: TransactionStatus;
  type: TransactionType;
  category: TransactionCategory;
  timestamp: Date;
  data: {
    sourceAccount: string;
    destinationAccount?: string;
    amount?: string;
    assetCode?: string;
    ledgerSequence?: number;
    feeCharged?: number;
    errorMessage?: string;
    retryCount?: number;
  };
}

export interface TransactionAlert {
  alertType: 'high_failure_rate' | 'transaction_stuck' | 'network_issue' | 'large_transaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  transactionHash?: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TransactionNotification {
  userId: string;
  type: 'transaction_confirmed' | 'transaction_failed' | 'transaction_pending';
  title: string;
  message: string;
  transactionHash: string;
  timestamp: Date;
  read: boolean;
}
