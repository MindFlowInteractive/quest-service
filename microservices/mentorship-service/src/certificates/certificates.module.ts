import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';

@Module({
  providers: [CertificatesService]
})
export class CertificatesModule {}
