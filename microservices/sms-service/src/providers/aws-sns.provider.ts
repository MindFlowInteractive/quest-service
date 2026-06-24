import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SmsProvider,
  SmsProviderRequest,
  SmsProviderResponse,
} from './interfaces/sms-provider.interface';

@Injectable()
export class AwsSnsSmsProvider implements SmsProvider {
  readonly name = 'aws-sns';

  constructor(private readonly configService: ConfigService) {}

  async send(_request: SmsProviderRequest): Promise<SmsProviderResponse> {
    const region = this.configService.get<string>('sms.aws.region');

    throw new Error(
      `AWS SNS provider selected for ${region}, but the lightweight service build does not bundle the AWS SDK. Use SMS_PROVIDER=twilio or SMS_PROVIDER=console, or add @aws-sdk/client-sns to enable SNS sends.`,
    );
  }
}
