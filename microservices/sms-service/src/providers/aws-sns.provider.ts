import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SmsPayload,
  SmsProvider,
  SmsSendResult,
} from './interfaces/sms-provider.interface';

@Injectable()
export class AwsSnsSmsProvider implements SmsProvider {
  readonly name = 'aws-sns';

  constructor(private readonly configService: ConfigService) {}

  validateConfig(): boolean {
    return Boolean(
      this.configService.get<string>('sms.aws.region') &&
        this.configService.get<string>('sms.aws.accessKeyId') &&
        this.configService.get<string>('sms.aws.secretAccessKey'),
    );
  }

  async send(_request: SmsPayload): Promise<SmsSendResult> {
    const region = this.configService.get<string>('sms.aws.region');

    return {
      success: false,
      provider: this.name,
      error: `AWS SNS provider selected for ${region}, but this compatibility provider is disabled. Use the branch's \`sns\` provider implementation instead.`,
    };
  }
}
