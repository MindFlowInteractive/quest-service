import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a stock reservation' })
  @ApiBody({ type: CreateReservationDto })
  async create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.createReservation(createReservationDto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm a reservation' })
  async confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.confirmReservation(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a reservation' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.cancelReservation(id);
  }

  @Post(':id/fulfill')
  @ApiOperation({ summary: 'Fulfill a confirmed reservation' })
  async fulfill(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.fulfillReservation(id);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get reservations by order ID' })
  async getByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.reservationService.getReservationsByOrder(orderId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reservations by user ID' })
  async getByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.reservationService.getReservationsByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.getReservationById(id);
  }
}