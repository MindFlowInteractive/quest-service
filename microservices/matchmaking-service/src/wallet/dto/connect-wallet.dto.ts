import { IsOptional, IsString } from 'class-validator';

export class ConnectWalletDto {
  @IsString()
  publicKey: string;

  @IsString()
  network: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  nonce?: string;
}
