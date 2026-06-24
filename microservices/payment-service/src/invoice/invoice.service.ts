import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  private generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `INV-${timestamp}-${random}`;
  }

  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    const amount = dto.lineItems.reduce((sum, item) => sum + item.amount, 0);

    const invoice = this.invoiceRepository.create({
      userId: dto.userId,
      paymentId: dto.paymentId ?? null,
      invoiceNumber: this.generateInvoiceNumber(),
      amount,
      currency: dto.currency,
      status: 'draft',
      lineItems: dto.lineItems,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });

    return this.invoiceRepository.save(invoice);
  }

  async markAsSent(id: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    invoice.status = 'sent';
    return this.invoiceRepository.save(invoice);
  }

  async markAsPaid(id: string, paymentId?: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    if (paymentId) {
      invoice.paymentId = paymentId;
    }
    return this.invoiceRepository.save(invoice);
  }

  findByUser(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({ where: { invoiceNumber } });
  }
}
