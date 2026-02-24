import { Injectable } from '@nestjs/common';
import * as StellarSdk from '@stellar/stellar-sdk';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletUser } from './entities/wallet-user.entity';

@Injectable()
export class WalletAuthService {
  constructor(
    @InjectRepository(WalletUser)
    private readonly walletRepo: Repository<WalletUser>,
  ) {}

  generateChallenge(walletAddress: string): string {
    // Challenge message (nonce)
    return `Login challenge for ${walletAddress} at ${Date.now()}`;
  }

  async verifySignature(walletAddress: string, signature: string, challenge: string) {
    const keypair = StellarSdk.Keypair.fromPublicKey(walletAddress);
    const messageBytes = Buffer.from(challenge);
    const signatureBytes = Buffer.from(signature, 'base64');

    const verified = keypair.verify(messageBytes, signatureBytes);
    if (!verified) throw new Error('Invalid signature');

    // Link or create wallet user
    let user = await this.walletRepo.findOne({ where: { walletAddress } });
    if (!user) {
      user = this.walletRepo.create({ walletAddress });
      await this.walletRepo.save(user);
    }

    // Issue JWT
    const token = jwt.sign(
      { walletAddress: user.walletAddress, userId: user.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' },
    );

    return { token, user };
  }
}
