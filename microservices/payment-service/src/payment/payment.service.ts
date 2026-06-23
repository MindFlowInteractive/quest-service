import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { StripePaymentProvider } from '../providers/stripe.provider';
import { ProcessPaymentDto, RefundPaymentDto } from './dto/process-payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly providers = new Map<string, StripePaymentProvider>();

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly stripeProvider: StripePaymentProvider,
  ) {
    this.providers.set('stripe', stripeProvider);
  }

  getAvailableProviders(): string[] {
    return ['stripe', 'paypal'];
  }

  private getProvider(providerName: string): StripePaymentProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new BadRequestException(`Payment provider ${providerName} not found`);
    }
    return provider;
  }

  async processPayment(
    providerName: string,
    dto: ProcessPaymentDto,
  ): Promise<Payment> {
    const provider = this.getProvider(providerName);

    const payment = this.paymentRepository.create({
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency,
      status: 'processing',
      provider: providerName,
      description: dto.description ?? null,
      metadata: dto.metadata ?? null,
      paymentMethodId: dto.paymentMethodId ?? null,
    });

    await this.paymentRepository.save(payment);

    try {
      const result = await provider.processPayment({
        amount: dto.amount,
        currency: dto.currency,
        userId: dto.userId,
        description: dto.description,
        metadata: dto.metadata,
        paymentMethodId: dto.paymentMethodId,
      });

      payment.status = result.success ? 'completed' : 'failed';
      payment.externalTransactionId = result.transactionId ?? null;
      payment.metadata = {
        ...(payment.metadata ?? {}),
        ...(result.metadata ?? {}),
        error: result.error,
      };

      return this.paymentRepository.save(payment);
    } catch (error) {
      payment.status = 'failed';
      payment.metadata = {
        ...(payment.metadata ?? {}),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.paymentRepository.save(payment);
      throw error;
    }
  }

  async refundPayment(
    providerName: string,
    dto: RefundPaymentDto,
  ): Promise<Payment> {
    const provider = this.getProvider(providerName);

    const payment = await this.paymentRepository.findOne({
      where: { externalTransactionId: dto.transactionId },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with transaction ${dto.transactionId} not found`,
      );
    }

    if (payment.status === 'refunded') {
      throw new BadRequestException('Payment already refunded');
    }

    const result = await provider.refundPayment(dto.transactionId, dto.amount);

    if (!result.success) {
      throw new BadRequestException(result.error ?? 'Refund failed');
    }

    payment.status = 'refunded';
    payment.refundId = result.refundId ?? null;

    this.logger.log(`Refund processed for payment ${payment.id}`);
    return this.paymentRepository.save(payment);
  }

  findByUser(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<Payment> {
    return this.paymentRepository.findOne({ where: { id } }).then((payment) => {
      if (!payment) {
        throw new NotFoundException(`Payment ${id} not found`);
      }
      return payment;
    });
  }

  async updatePaymentStatus(
    externalTransactionId: string,
    status: Payment['status'],
  ): Promise<Payment | null> {
    const payment = await this.paymentRepository.findOne({
      where: { externalTransactionId },
    });

    if (!payment) {
      return null;
    }

    payment.status = status;
    return this.paymentRepository.save(payment);
  }
}
