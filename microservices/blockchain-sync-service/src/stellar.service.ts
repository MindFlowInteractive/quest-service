import { Injectable } from '@nestjs/common';
import { Horizon, Networks } from 'stellar-sdk';

@Injectable()
export class StellarService {
  private server: Horizon.Server;

  constructor() {
    this.server = new Horizon.Server(
      process.env.STELLAR_HORIZON_URL!,
    );
  }

  getServer() {
    return this.server;
  }

  getNetworkPassphrase() {
    return process.env.STELLAR_NETWORK === 'PUBLIC'
      ? Networks.PUBLIC
      : Networks.TESTNET;
  }
}