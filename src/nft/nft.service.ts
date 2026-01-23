import { Injectable } from '@nestjs/common';
import { SorobanService } from '../soroban/soroban.service';
import { ConfigService } from '@nestjs/config';
import { xdr, nativeToScVal, Address } from '@stellar/stellar-sdk';

@Injectable()
export class NFTService {
  private nftContractId: string;

  constructor(
    private sorobanService: SorobanService,
    private configService: ConfigService,
  ) {
    this.nftContractId = this.configService.get<string>('NFT_CONTRACT_ID');
  }

  async mintNFT(userAddress: string, tokenId: number, uri: string) {
    const params = [
      new Address(userAddress).toScVal(),
      nativeToScVal(tokenId, { type: 'u64' }),
      nativeToScVal(uri, { type: 'string' }),
    ];

    const result = await this.sorobanService.invokeContract(
      this.nftContractId,
      'mint',
      params,
    );

    return {
      success: result.status === 'SUCCESS',
      transactionHash: result.hash,
      tokenId,
      owner: userAddress,
      uri,
    };
  }

  async getNFT(tokenId: number) {
    const params = [nativeToScVal(tokenId, { type: 'u64' })];

    const result = (await this.sorobanService.invokeContract(
      this.nftContractId,
      'get_nft',
      params,
    )) as any;

    return result.result;
  }

  async transferNFT(from: string, to: string, tokenId: number) {
    const params = [
      new Address(from).toScVal(),
      new Address(to).toScVal(),
      nativeToScVal(tokenId, { type: 'u64' }),
    ];

    const result = await this.sorobanService.invokeContract(
      this.nftContractId,
      'transfer',
      params,
    );

    return {
      success: result.status === 'SUCCESS',
      transactionHash: result.hash,
    };
  }
}
