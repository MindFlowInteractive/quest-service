import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';

@Injectable()
export class PhoneNumberService {
  constructor(private readonly configService: ConfigService) {}

  normalize(phoneNumber: string) {
    const parsed = parsePhoneNumberFromString(
      phoneNumber,
      this.configService.get<string>('sms.defaultCountry', 'US') as CountryCode,
    );

    if (!parsed || !parsed.isValid()) {
      throw new BadRequestException('Invalid phone number');
    }

    return {
      e164: parsed.number,
      country: parsed.country,
      national: parsed.formatNational(),
    };
  }

  mask(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length <= 4) {
      return `****${digits}`;
    }

    return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  }
}
