import { Injectable } from '@nestjs/common';
import { Keypair, Horizon, Transaction } from '@stellar/stellar-sdk';

@Injectable()
export class StellarService {
  private readonly server: Horizon.Server;
  private readonly keypair: Keypair;

  constructor() {
    const secret = process.env.STELLAR_SECRET_KEY;
    if (!secret) {
      throw new Error('STELLAR_SECRET_KEY is not defined');
    }

    this.server = new Horizon.Server('https://horizon-testnet.stellar.org');
    this.keypair = Keypair.fromSecret(secret);
  }

  getPublicKey(): string {
    return this.keypair.publicKey();
  }

  async signAndSubmit(tx: Transaction) {
    tx.sign(this.keypair);
    return this.server.submitTransaction(tx);
  }
}