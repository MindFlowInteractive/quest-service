import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { SmsMessageType } from '../sms/entities/sms-message.entity';
import { PhoneNumberService } from '../sms/phone-number.service';
import { SmsService } from '../sms/sms.service';
import { TemplatesService } from '../templates/templates.service';
import { SendOtpDto, VerifyOtpDto } from './dto';
import { OtpCode } from './entities/otp-code.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepository: Repository<OtpCode>,
    private readonly smsService: SmsService,
    private readonly phoneNumberService: PhoneNumberService,
    private readonly templatesService: TemplatesService,
    private readonly configService: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const normalized = this.phoneNumberService.normalize(dto.phoneNumber);
    await this.enforceOtpRateLimit(normalized.e164, dto.purpose);

    const code = this.generateCode(
      this.configService.get<number>('sms.otp.length', 6),
    );
    const expiryMinutes = this.configService.get<number>(
      'sms.otp.expiryMinutes',
      10,
    );
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const otp = this.otpRepository.create({
      phoneNumber: dto.phoneNumber,
      normalizedPhoneNumber: normalized.e164,
      userId: dto.userId,
      purpose: dto.purpose,
      codeHash: this.hashCode(normalized.e164, dto.purpose, code),
      expiresAt,
      maxAttempts: this.configService.get<number>('sms.otp.maxAttempts', 5),
      metadata: dto.metadata,
    });

    const savedOtp = await this.otpRepository.save(otp);
    const body = await this.renderOtpBody(code, dto.purpose, expiryMinutes);

    const message = await this.smsService.send({
      phoneNumber: dto.phoneNumber,
      body,
      userId: dto.userId,
      type: SmsMessageType.OTP,
      metadata: {
        ...dto.metadata,
        otpId: savedOtp.id,
        purpose: dto.purpose,
      },
      otpPurpose: dto.purpose,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      otpId: savedOtp.id,
      expiresAt,
      messageId: message.id,
      maskedPhoneNumber: this.phoneNumberService.mask(normalized.e164),
      debugCode: this.configService.get<boolean>('sms.debugExposeCodes', false)
        ? code
        : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const normalized = this.phoneNumberService.normalize(dto.phoneNumber);

    const otp = await this.otpRepository
      .createQueryBuilder('otp')
      .where('otp.normalizedPhoneNumber = :phone', { phone: normalized.e164 })
      .andWhere('otp.purpose = :purpose', { purpose: dto.purpose })
      .andWhere('otp.verifiedAt IS NULL')
      .orderBy('otp.createdAt', 'DESC')
      .getOne();

    if (!otp) {
      throw new BadRequestException('No active OTP found');
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP has expired');
    }

    if (otp.attempts >= otp.maxAttempts) {
      throw new HttpException(
        'OTP attempt limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    otp.attempts += 1;
    otp.lastAttemptAt = new Date();

    if (otp.codeHash !== this.hashCode(normalized.e164, dto.purpose, dto.code)) {
      await this.otpRepository.save(otp);
      throw new UnauthorizedException('Invalid OTP code');
    }

    otp.verifiedAt = new Date();
    await this.otpRepository.save(otp);

    return {
      verified: true,
      otpId: otp.id,
      verifiedAt: otp.verifiedAt,
    };
  }

  private async renderOtpBody(
    code: string,
    purpose: string,
    expiryMinutes: number,
  ): Promise<string> {
    const templateName = this.configService.get<string>(
      'sms.otp.templateName',
      'otp-verification',
    );

    const template = await this.templatesService.findByNameOrNull(templateName);
    if (!template) {
      return `Your ${purpose} verification code is ${code}. It expires in ${expiryMinutes} minutes.`;
    }

    const rendered = await this.templatesService.render({
      templateName,
      variables: {
        code,
        purpose,
        expiryMinutes,
      },
    });

    return rendered.body;
  }

  private async enforceOtpRateLimit(phoneNumber: string, purpose: string) {
    const windowMinutes = this.configService.get<number>(
      'sms.rateLimit.otpWindowMinutes',
      10,
    );
    const maxPerWindow = this.configService.get<number>(
      'sms.rateLimit.otpMaxPerWindow',
      3,
    );
    const threshold = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = await this.otpRepository
      .createQueryBuilder('otp')
      .where('otp.normalizedPhoneNumber = :phone', { phone: phoneNumber })
      .andWhere('otp.purpose = :purpose', { purpose })
      .andWhere('otp.createdAt >= :threshold', { threshold })
      .getCount();

    if (count >= maxPerWindow) {
      throw new HttpException(
        'OTP rate limit exceeded for this phone number',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private generateCode(length: number): string {
    const max = 10 ** length;
    const min = 10 ** (length - 1);
    return randomInt(min, max).toString();
  }

  private hashCode(phoneNumber: string, purpose: string, code: string): string {
    return createHash('sha256')
      .update(
        `${phoneNumber}:${purpose}:${code}:${this.configService.get<string>(
          'sms.otp.secret',
          'sms-otp-secret',
        )}`,
      )
      .digest('hex');
  }
}
