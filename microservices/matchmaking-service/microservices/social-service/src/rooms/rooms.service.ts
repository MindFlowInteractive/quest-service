import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MultiplayerRoom, RoomStatus } from '../multiplayer-room.entity';
import { CreateRoomDto, UpdateRoomDto } from '../dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(MultiplayerRoom)
    private roomRepository: Repository<MultiplayerRoom>,
  ) {}

  /**
   * Create a new multiplayer room
   */
  async createRoom(ownerId: string, dto: CreateRoomDto): Promise<MultiplayerRoom> {
    const room = this.roomRepository.create({
      ...dto,
      ownerId,
      status: RoomStatus.WAITING,
      participants: [ownerId],
    });

    return this.roomRepository.save(room);
  }

  /**
   * Get room by ID
   */
  async getRoomById(roomId: string): Promise<MultiplayerRoom> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  /**
   * Get all available rooms
   */
  async getAvailableRooms(
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{ rooms: MultiplayerRoom[]; total: number }> {
    const [rooms, total] = await this.roomRepository.findAndCount({
      where: [
        { status: RoomStatus.WAITING, isPrivate: false },
        { status: RoomStatus.IN_PROGRESS, isPrivate: false },
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { rooms, total };
  }

  /**
   * Get rooms owned by a user
   */
  async getOwnedRooms(ownerId: string): Promise<MultiplayerRoom[]> {
    return this.roomRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get rooms a user is participating in
   */
  async getParticipatingRooms(userId: string): Promise<MultiplayerRoom[]> {
    const rooms = await this.roomRepository.find({
      order: { createdAt: 'DESC' },
    });

    return rooms.filter((room) =>
      room.participants.includes(userId),
    );
  }

  /**
   * Join a room
   */
  async joinRoom(
    roomId: string,
    userId: string,
    password?: string,
  ): Promise<MultiplayerRoom> {
    const room = await this.getRoomById(roomId);

    // Validate room status
    if (
      room.status !== RoomStatus.WAITING &&
      room.status !== RoomStatus.IN_PROGRESS
    ) {
      throw new BadRequestException('Room is not available for joining');
    }

    // Check if already in room
    if (room.participants.includes(userId)) {
      throw new BadRequestException('User is already in this room');
    }

    // Check if room is full
    if (room.participants.length >= room.maxPlayers) {
      throw new BadRequestException('Room is full');
    }

    // Check password if private
    if (room.isPrivate && room.password && room.password !== password) {
      throw new ForbiddenException('Invalid room password');
    }

    // Add participant
    room.participants.push(userId);
    room.updatedAt = new Date();

    return this.roomRepository.save(room);
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string, userId: string): Promise<MultiplayerRoom> {
    const room = await this.getRoomById(roomId);

    if (!room.participants.includes(userId)) {
      throw new BadRequestException('User is not in this room');
    }

    // Remove participant
    room.participants = room.participants.filter((id) => id !== userId);
    room.updatedAt = new Date();

    // If owner leaves and room has participants, transfer ownership
    if (room.ownerId === userId && room.participants.length > 0) {
      room.ownerId = room.participants[0];
    }

    // If no participants left, delete room
    if (room.participants.length === 0) {
      await this.roomRepository.remove(room);
      return null;
    }

    return this.roomRepository.save(room);
  }

  /**
   * Start the game/puzzle in a room
   */
  async startRoom(roomId: string, userId: string): Promise<MultiplayerRoom> {
    const room = await this.getRoomById(roomId);

    // Only owner can start
    if (room.ownerId !== userId) {
      throw new ForbiddenException('Only room owner can start the game');
    }

    // Must have at least 2 players
    if (room.participants.length < 2) {
      throw new BadRequestException('Need at least 2 players to start');
    }

    room.status = RoomStatus.IN_PROGRESS;
    room.updatedAt = new Date();

    return this.roomRepository.save(room);
  }

  /**
   * Complete a room/game
   */
  async completeRoom(roomId: string, userId: string): Promise<MultiplayerRoom> {
    const room = await this.getRoomById(roomId);

    // Only owner can complete
    if (room.ownerId !== userId) {
      throw new ForbiddenException('Only room owner can complete the game');
    }

    room.status = RoomStatus.COMPLETED;
    room.updatedAt = new Date();

    return this.roomRepository.save(room);
  }

  /**
   * Cancel a room
   */
  async cancelRoom(roomId: string, userId: string): Promise<MultiplayerRoom> {
    const room = await this.getRoomById(roomId);

    // Only owner can cancel
    if (room.ownerId !== userId) {
      throw new ForbiddenException('Only room owner can cancel the game');
    }

    room.status = RoomStatus.CANCELLED;
    room.updatedAt = new Date();

    return this.roomRepository.save(room);
  }

  /**
   * Update room details
   */
  async updateRoom(
    roomId: string,
    userId: string,
    dto: UpdateRoomDto,
  ): Promise<MultiplayerRoom> {
    const room = await this.getRoomById(roomId);

    // Only owner can update
    if (room.ownerId !== userId) {
      throw new ForbiddenException('Only room owner can update room details');
    }

    // Cannot update while game is in progress
    if (room.status === RoomStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot update room while game is in progress');
    }

    if (dto.name) room.name = dto.name;
    if (dto.description) room.description = dto.description;
    if (dto.maxPlayers) {
      if (dto.maxPlayers < room.participants.length) {
        throw new BadRequestException(
          'Max players cannot be less than current participants',
        );
      }
      room.maxPlayers = dto.maxPlayers;
    }

    room.updatedAt = new Date();
    return this.roomRepository.save(room);
  }

  /**
   * Get room participants count
   */
  async getRoomParticipantCount(roomId: string): Promise<number> {
    const room = await this.getRoomById(roomId);
    return room.participants.length;
  }

  /**
   * Check if user is in room
   */
  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await this.getRoomById(roomId);
    return room.participants.includes(userId);
  }

  /**
   * Get rooms by puzzle
   */
  async getRoomsByPuzzle(puzzleId: string): Promise<MultiplayerRoom[]> {
    return this.roomRepository.find({
      where: { puzzleId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get active rooms (waiting or in progress)
   */
  async getActiveRooms(): Promise<MultiplayerRoom[]> {
    return this.roomRepository.find({
      where: [
        { status: RoomStatus.WAITING },
        { status: RoomStatus.IN_PROGRESS },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update room metadata
   */
  async updateRoomMetadata(
    roomId: string,
    userId: string,
    metadata: Record<string, any>,
  ): Promise<MultiplayerRoom> {
    const room = await this.getRoomById(roomId);

    // Only owner can update metadata
    if (room.ownerId !== userId) {
      throw new ForbiddenException('Only room owner can update metadata');
    }

    room.metadata = { ...room.metadata, ...metadata };
    room.updatedAt = new Date();

    return this.roomRepository.save(room);
  }
}
