import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../entities/payment-method.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async createPaymentMethod(
    dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    if (dto.isDefault) {
      await this.paymentMethodRepository.update(
        { userId: dto.userId, isDefault: true },
        { isDefault: false },
      );
    }

    const method = this.paymentMethodRepository.create({
      userId: dto.userId,
      provider: dto.provider ?? 'stripe',
      externalMethodId: dto.externalMethodId,
      type: dto.type,
      last4: dto.last4 ?? null,
      brand: dto.brand ?? null,
      isDefault: dto.isDefault ?? false,
    });

    return this.paymentMethodRepository.save(method);
  }

  findByUser(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { userId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<PaymentMethod> {
    const method = await this.paymentMethodRepository.findOne({
      where: { id },
    });
    if (!method) {
      throw new NotFoundException(`Payment method ${id} not found`);
    }
    return method;
  }

  async setDefault(id: string, userId: string): Promise<PaymentMethod> {
    const method = await this.findById(id);

    if (method.userId !== userId) {
      throw new NotFoundException(`Payment method ${id} not found for user`);
    }

    await this.paymentMethodRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    method.isDefault = true;
    return this.paymentMethodRepository.save(method);
  }

  async deactivate(id: string, userId: string): Promise<PaymentMethod> {
    const method = await this.findById(id);

    if (method.userId !== userId) {
      throw new NotFoundException(`Payment method ${id} not found for user`);
    }

    method.isActive = false;
    method.isDefault = false;
    return this.paymentMethodRepository.save(method);
  }
}
