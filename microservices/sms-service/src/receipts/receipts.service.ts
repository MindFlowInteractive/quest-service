import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfirmReceiptDto } from './dto';
import { SmsReceipt, SmsReceiptStatus } from './entities/sms-receipt.entity';
import { SmsMessage, SmsMessageStatus } from '../sms/entities/sms-message.entity';
import { SmsSendResult } from '../providers/interfaces/sms-provider.interface';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(SmsReceipt)
    private readonly receiptRepository: Repository<SmsReceipt>,
    @InjectRepository(SmsMessage)
    private readonly messageRepository: Repository<SmsMessage>,
  ) {}

  async recordProviderResult(
    message: SmsMessage,
    result: SmsSendResult,
  ): Promise<SmsReceipt> {
    const status =
      result.deliveryStatus === 'delivered'
        ? SmsReceiptStatus.DELIVERED
        : SmsReceiptStatus.SENT;

    const receipt = this.receiptRepository.create({
      messageId: message.id,
      providerMessageId: result.messageId,
      provider: result.provider,
      status,
      eventType: status,
      occurredAt: new Date(),
      rawPayload: result.rawResponse,
    });

    return this.receiptRepository.save(receipt);
  }

  async recordFailure(
    message: SmsMessage,
    errorMessage: string,
    provider?: string,
  ): Promise<SmsReceipt> {
    const receipt = this.receiptRepository.create({
      messageId: message.id,
      providerMessageId: message.providerMessageId,
      provider: provider || message.provider,
      status: SmsReceiptStatus.FAILED,
      eventType: 'failed',
      errorMessage,
      occurredAt: new Date(),
    });

    return this.receiptRepository.save(receipt);
  }

  async confirmReceipt(dto: ConfirmReceiptDto): Promise<SmsReceipt> {
    const message = await this.findMessage(dto);

    message.provider = dto.provider || message.provider;
    message.providerMessageId = dto.providerMessageId || message.providerMessageId;

    switch (dto.status) {
      case SmsReceiptStatus.SENT:
        message.status = SmsMessageStatus.SENT;
        message.sentAt = message.sentAt || new Date(dto.occurredAt || Date.now());
        break;
      case SmsReceiptStatus.DELIVERED:
        message.status = SmsMessageStatus.DELIVERED;
        message.sentAt = message.sentAt || new Date(dto.occurredAt || Date.now());
        message.deliveredAt = new Date(dto.occurredAt || Date.now());
        break;
      case SmsReceiptStatus.FAILED:
        message.status = SmsMessageStatus.FAILED;
        message.failedAt = new Date(dto.occurredAt || Date.now());
        message.lastError = dto.errorMessage || 'Delivery failed';
        break;
      case SmsReceiptStatus.CANCELLED:
        message.status = SmsMessageStatus.CANCELLED;
        message.cancelledAt = new Date(dto.occurredAt || Date.now());
        break;
      default:
        break;
    }

    await this.messageRepository.save(message);

    const receipt = this.receiptRepository.create({
      messageId: message.id,
      providerMessageId: dto.providerMessageId || message.providerMessageId,
      provider: dto.provider || message.provider,
      status: dto.status,
      eventType: dto.eventType || dto.status,
      errorCode: dto.errorCode,
      errorMessage: dto.errorMessage,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      rawPayload: dto.rawPayload,
    });

    return this.receiptRepository.save(receipt);
  }

  findByMessageId(messageId: string): Promise<SmsReceipt[]> {
    return this.receiptRepository.find({
      where: { messageId },
      order: { createdAt: 'DESC' },
    });
  }

  private async findMessage(dto: ConfirmReceiptDto): Promise<SmsMessage> {
    const message = dto.messageId
      ? await this.messageRepository.findOne({ where: { id: dto.messageId } })
      : await this.messageRepository.findOne({
          where: { providerMessageId: dto.providerMessageId },
        });

    if (!message) {
      throw new NotFoundException('SMS message not found for receipt');
    }

    return message;
  }
}
