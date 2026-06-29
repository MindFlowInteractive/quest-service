import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { StellarService } from '../../stellar/stellar.service';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private stellarService: StellarService,
  ) {}

  async syncTransactions(walletId: string) {
    const wallet = await this.walletRepository.findOne({ where: { id: walletId } });
    if (!wallet) return;

    try {
      const stellarTransactions = await this.stellarService.getTransactionHistory(wallet.address);
      
      for (const tx of stellarTransactions) {
        const existing = await this.transactionRepository.findOne({
          where: { transactionHash: tx.hash },
        });

        if (!existing) {
          // Simplification: In a real app, we would parse operations to get amount and asset
          const transaction = this.transactionRepository.create({
            walletId,
            transactionHash: tx.hash,
            type: 'stellar_transaction',
            amount: '0', // Placeholder
            assetCode: 'XLM', // Placeholder
            status: tx.successful ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
            timestamp: new Date(tx.created_at),
          });
          await this.transactionRepository.save(transaction);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to sync transactions for wallet ${wallet.address}: ${error.message}`);
    }
  }

  async getTransactionsByWallet(walletId: string) {
    return this.transactionRepository.find({
      where: { walletId },
      order: { timestamp: 'DESC' },
    });
  }
}
