import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus, ReservationType } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { StockService } from '../stock/stock.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private stockService: StockService,
    private inventoryService: InventoryService,
  ) {}

  async createReservation(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const { inventoryId, orderId, userId, quantity, type, holdDurationMinutes } = createReservationDto;

    await this.inventoryService.findOne(inventoryId);

    const existingReservation = await this.reservationRepository.findOne({
      where: { orderId, inventoryId, status: ReservationStatus.PENDING },
    });

    if (existingReservation) {
      throw new ConflictException('Pending reservation already exists for this order');
    }

    const stockReserved = await this.stockService.reserveStock(inventoryId, quantity);
    if (!stockReserved) {
      throw new BadRequestException('Insufficient stock available');
    }

    const stock = await this.stockService.getStockByInventory(inventoryId);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + holdDurationMinutes);

    const reservation = this.reservationRepository.create({
      inventoryId,
      stockId: stock.id,
      orderId,
      userId,
      quantity,
      type: type || ReservationType.PURCHASE,
      status: ReservationStatus.PENDING,
      expiresAt,
    });

    return this.reservationRepository.save(reservation);
  }

  async confirmReservation(reservationId: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('Reservation is not in pending status');
    }

    const stockDeducted = await this.stockService.deductStock(reservation.inventoryId, reservation.quantity);
    if (!stockDeducted) {
      throw new BadRequestException('Failed to deduct stock');
    }

    reservation.status = ReservationStatus.CONFIRMED;
    reservation.fulfilledAt = new Date();

    return this.reservationRepository.save(reservation);
  }

  async cancelReservation(reservationId: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status === ReservationStatus.FULFILLED || reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel fulfilled or already cancelled reservation');
    }

    await this.stockService.releaseStock(reservation.inventoryId, reservation.quantity);

    reservation.status = ReservationStatus.CANCELLED;
    return this.reservationRepository.save(reservation);
  }

  async fulfillReservation(reservationId: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Reservation must be confirmed before fulfillment');
    }

    reservation.status = ReservationStatus.FULFILLED;
    return this.reservationRepository.save(reservation);
  }

  async expireReservations(): Promise<void> {
    const now = new Date();
    const expiredReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.expiresAt < :now', { now })
      .andWhere('reservation.status = :status', { status: ReservationStatus.PENDING })
      .getMany();

    for (const reservation of expiredReservations) {
      await this.stockService.releaseStock(reservation.inventoryId, reservation.quantity);
      reservation.status = ReservationStatus.EXPIRED;
      await this.reservationRepository.save(reservation);
    }
  }

  async getReservationsByOrder(orderId: string): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: { orderId },
      relations: ['inventory', 'stock'],
    });
  }

  async getReservationsByUser(userId: string): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: { userId },
      relations: ['inventory', 'stock'],
    });
  }

  async getReservationById(reservationId: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['inventory', 'stock'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }
}