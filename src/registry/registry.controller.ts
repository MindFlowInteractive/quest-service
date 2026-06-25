import { Controller, Post, Body, Param, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmartContract, ContractStatus } from '../entities/contract.entity';
import { ContractVersion } from '../entities/version.entity';
import { VerificationService } from './verification.service';

@Controller('contracts')
export class RegistryController {
  constructor(
    @InjectRepository(SmartContract) private readonly contractRepo: Repository<SmartContract>,
    @InjectRepository(ContractVersion) private readonly versionRepo: Repository<ContractVersion>,
    private readonly verificationService: VerificationService,
  ) {}

  @Post('register')
  async registerContract(@Body() body: { contractId: string; name: string; version: string }) {
    const contract = this.contractRepo.create({
      contractId: body.contractId,
      name: body.name,
      status: ContractStatus.UNVERIFIED,
    });
    return this.contractRepo.save(contract);
  }

  @Post(':id/verify')
  @UseInterceptors(FileInterceptor('wasm'))
  async verifyVersion(
    @Param('id') contractId: string,
    @Body('versionStr') versionStr: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const contract = await this.contractRepo.findOneByOrFail({ contractId });
    const match = await this.verificationService.verifyContractBytecode(contractId, file.buffer);

    const version = this.versionRepo.create({
      versionStr,
      wasmHash: this.verificationService.calculateHash(file.buffer),
      isVerified: match,
      contract,
    });

    await this.versionRepo.save(version);

    if (match) {
      contract.status = ContractStatus.VERIFIED;
      await this.contractRepo.save(contract);
    }

    return { verified: match, hash: version.wasmHash };
  }

  @Put(':id/deprecate')
  async deprecateContract(@Param('id') contractId: string, @Body('notice') notice: string) {
    const contract = await this.contractRepo.findOneByOrFail({ contractId });
    contract.status = ContractStatus.DEPRECATED;
    contract.deprecationNotice = notice;
    return this.contractRepo.save(contract);
  }
}