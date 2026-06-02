import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorshipCertificate } from './entities/certificate.entity';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(MentorshipCertificate)
    private certificateRepository: Repository<MentorshipCertificate>,
  ) {}

  async issueCertificate(mentorshipId: number, studentId: string, mentorId: string) {
    const certificate = this.certificateRepository.create({
      mentorshipId,
      studentId,
      mentorId,
      certificateUrl: `https://api.daddygachi.com/certificates/${mentorshipId}-${studentId}`,
      issuedAt: new Date(),
    });
    return this.certificateRepository.save(certificate);
  }

  async getCertificate(mentorshipId: number) {
    return this.certificateRepository.findOne({ where: { mentorshipId } });
  }
}
