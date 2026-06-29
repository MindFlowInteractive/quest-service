import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet, WalletStatus } from './entities/wallet.entity';
import { StellarService } from '../stellar/stellar.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private stellarService: StellarService,
  ) {}

  async connectWallet(userId: string, address: string) {
    const existing = await this.walletRepository.findOne({ where: { address } });
    if (existing) {
      throw new ConflictException('Wallet already connected');
    }

    const isValid = await this.stellarService.verifyAddress(address);
    if (!isValid) {
      // In a real app, we might want to allow connecting inactive accounts if we handle funding
      // but for now let's assume it must exist on chain.
    }

    const wallet = this.walletRepository.create({
      userId,
      address,
      status: WalletStatus.ACTIVE,
    });

    return this.walletRepository.save(wallet);
  }

  async getWalletByUser(userId: string) {
    return this.walletRepository.find({ where: { userId } });
  }

  async getWalletById(id: string) {
    const wallet = await this.walletRepository.findOne({ where: { id } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async Stellartransfer(fromWalletId: string, toAddress: string, amount: number) {
    const fromWallet = await this.getWalletById(fromWalletId);
    if (fromWallet.status !== WalletStatus.ACTIVE) {
      throw new ConflictException('Source wallet is not active');
    }

    const isValid = await this.stellarService.verifyAddress(toAddress);
    if (!isValid) {
      throw new NotFoundException('Destination address is invalid');
    }

    // In a real app, we would also check the balance and handle errors from Stellar
    return this.stellarService.transfer(fromWallet.address, toAddress, amount);
  }

}
