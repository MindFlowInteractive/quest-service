import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { MentorshipCertificate } from './entities/certificate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MentorshipCertificate])],
  controllers: [],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
