import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto, JoinRoomDto } from './dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  /**
   * Create a new room
   * POST /rooms
   */
  @Post()
  async createRoom(@Body() dto: CreateRoomDto) {
    const ownerId = ''; // TODO: Get from auth
    return this.roomsService.createRoom(ownerId, dto);
  }

  /**
   * Get available rooms with pagination
   * GET /rooms?page=1&pageSize=50
   */
  @Get()
  async getAvailableRooms(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    return this.roomsService.getAvailableRooms(
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }

  /**
   * Get room details
   * GET /rooms/:roomId
   */
  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string) {
    return this.roomsService.getRoomById(roomId);
  }

  /**
   * Get user's owned rooms
   * GET /rooms/owned/list
   */
  @Get('owned/list')
  async getOwnedRooms() {
    const userId = ''; // TODO: Get from auth
    return this.roomsService.getOwnedRooms(userId);
  }

  /**
   * Get user's participating rooms
   * GET /rooms/participating/list
   */
  @Get('participating/list')
  async getParticipatingRooms() {
    const userId = ''; // TODO: Get from auth
    return this.roomsService.getParticipatingRooms(userId);
  }

  /**
   * Join a room
   * POST /rooms/:roomId/join
   */
  @Post(':roomId/join')
  async joinRoom(
    @Param('roomId') roomId: string,
    @Body() dto: JoinRoomDto,
  ) {
    const userId = ''; // TODO: Get from auth
    return this.roomsService.joinRoom(roomId, userId, dto.password);
  }

  /**
   * Leave a room
   * POST /rooms/:roomId/leave
   */
  @Post(':roomId/leave')
  async leaveRoom(@Param('roomId') roomId: string) {
    const userId = ''; // TODO: Get from auth
    const result = await this.roomsService.leaveRoom(roomId, userId);
    if (!result) {
      return { message: 'Room deleted after leaving (no participants)' };
    }
    return result;
  }

  /**
   * Start game in room
   * POST /rooms/:roomId/start
   */
  @Post(':roomId/start')
  async startRoom(@Param('roomId') roomId: string) {
    const userId = ''; // TODO: Get from auth
    return this.roomsService.startRoom(roomId, userId);
  }

  /**
   * Complete game in room
   * POST /rooms/:roomId/complete
   */
  @Post(':roomId/complete')
  async completeRoom(@Param('roomId') roomId: string) {
    const userId = ''; // TODO: Get from auth
    return this.roomsService.completeRoom(roomId, userId);
  }

  /**
   * Cancel room
   * POST /rooms/:roomId/cancel
   */
  @Post(':roomId/cancel')
  async cancelRoom(@Param('roomId') roomId: string) {
    const userId = ''; // TODO: Get from auth
    return this.roomsService.cancelRoom(roomId, userId);
  }

  /**
   * Update room details
   * PATCH /rooms/:roomId
   */
  @Patch(':roomId')
  async updateRoom(
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    const userId = ''; // TODO: Get from auth
    return this.roomsService.updateRoom(roomId, userId, dto);
  }

  /**
   * Get room participants count
   * GET /rooms/:roomId/participants/count
   */
  @Get(':roomId/participants/count')
  async getParticipantCount(@Param('roomId') roomId: string) {
    const count = await this.roomsService.getRoomParticipantCount(roomId);
    return { roomId, participantCount: count };
  }

  /**
   * Get rooms by puzzle
   * GET /rooms/puzzle/:puzzleId
   */
  @Get('puzzle/:puzzleId')
  async getRoomsByPuzzle(@Param('puzzleId') puzzleId: string) {
    return this.roomsService.getRoomsByPuzzle(puzzleId);
  }

  /**
   * Get all active rooms
   * GET /rooms/status/active
   */
  @Get('status/active')
  async getActiveRooms() {
    return this.roomsService.getActiveRooms();
  }

  /**
   * Update room metadata
   * PATCH /rooms/:roomId/metadata
   */
  @Patch(':roomId/metadata')
  async updateMetadata(
    @Param('roomId') roomId: string,
    @Body() metadata: Record<string, any>,
  ) {
    const userId = ''; // TODO: Get from auth
    return this.roomsService.updateRoomMetadata(roomId, userId, metadata);
  }
}
