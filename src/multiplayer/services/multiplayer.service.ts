import { Injectable, Logger, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MultiplayerRoom, RoomStatus, RoomType, Player, Spectator } from '../interfaces/multiplayer.interface';

@Injectable()
export class MultiplayerService {
    private readonly logger = new Logger(MultiplayerService.name);
    private readonly rooms: Map<string, MultiplayerRoom> = new Map();
    private matchmakingQueue: Array<{ userId: string; skillLevel: number; type: RoomType }> = [];

    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    private generateInviteCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async createMultiplayerSession(
        type: RoomType, 
        creator: Player, 
        settings?: any, 
        puzzleId?: string
    ): Promise<MultiplayerRoom> {
        const inviteCode = this.generateInviteCode();
        const room: MultiplayerRoom = {
            id: uuidv4(),
            inviteCode,
            type,
            status: RoomStatus.LOBBY,
            players: [creator],
            spectators: [],
            puzzleId,
            settings: {
                maxPlayers: settings?.maxPlayers || 4,
                minPlayers: settings?.minPlayers || 2,
                timeLimit: settings?.timeLimit || 600,
                difficulty: settings?.difficulty || 'medium',
                spectatingAllowed: settings?.spectatingAllowed ?? true,
            },
            disconnectedPlayers: new Map(),
        };

        this.rooms.set(room.id, room);
        
        // Store in Redis for persistence
        await this.cacheManager.set(`session:${inviteCode}`, room, 3600); // 1 hour TTL
        await this.cacheManager.set(`session:id:${room.id}`, room, 3600);

        this.logger.log(`Multiplayer session ${room.id} created with invite code ${inviteCode} by ${creator.id}`);
        return room;
    }

    async joinSessionByCode(inviteCode: string, player: Player): Promise<MultiplayerRoom | null> {
        // Try to get from Redis first
        let room = await this.cacheManager.get<MultiplayerRoom>(`session:${inviteCode}`);
        
        if (!room) {
            // Fallback to memory
            room = Array.from(this.rooms.values()).find(r => r.inviteCode === inviteCode);
        }

        if (!room) return null;
        if (room.status !== RoomStatus.LOBBY) return null;
        if (room.players.length >= room.settings.maxPlayers) return null;

        if (!room.players.some(p => p.id === player.id)) {
            room.players.push(player);
            
            // Update Redis
            await this.cacheManager.set(`session:${inviteCode}`, room, 3600);
            await this.cacheManager.set(`session:id:${room.id}`, room, 3600);
        }

        this.logger.log(`Player ${player.id} joined session ${room.id} via invite code ${inviteCode}`);
        return room;
    }

    async getSessionByCode(inviteCode: string): Promise<MultiplayerRoom | null> {
        // Try Redis first
        let room = await this.cacheManager.get<MultiplayerRoom>(`session:${inviteCode}`);
        
        if (!room) {
            // Fallback to memory
            room = Array.from(this.rooms.values()).find(r => r.inviteCode === inviteCode);
        }

        return room || null;
    }

    async handlePlayerReconnection(roomId: string, userId: string): Promise<MultiplayerRoom | null> {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const disconnectedTime = room.disconnectedPlayers?.get(userId);
        if (disconnectedTime) {
            const now = new Date();
            const gracePeriodMs = 60000; // 60 seconds
            
            if (now.getTime() - disconnectedTime.getTime() <= gracePeriodMs) {
                // Remove from disconnected players
                room.disconnectedPlayers?.delete(userId);
                
                // Update Redis
                await this.cacheManager.set(`session:${room.inviteCode}`, room, 3600);
                await this.cacheManager.set(`session:id:${room.id}`, room, 3600);
                
                this.logger.log(`Player ${userId} reconnected to session ${roomId}`);
                return room;
            }
        }

        return null;
    }

    async handlePlayerDisconnection(roomId: string, userId: string): Promise<void> {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Add to disconnected players with timestamp
        if (!room.disconnectedPlayers) {
            room.disconnectedPlayers = new Map();
        }
        room.disconnectedPlayers.set(userId, new Date());

        // Update Redis
        await this.cacheManager.set(`session:${room.inviteCode}`, room, 3600);
        await this.cacheManager.set(`session:id:${room.id}`, room, 3600);

        this.logger.log(`Player ${userId} disconnected from session ${roomId}`);
        // Note: Reconnection cleanup will be handled on next connection attempt
    }

    createRoom(type: RoomType, creator: Player, settings?: any): MultiplayerRoom {
        const inviteCode = this.generateInviteCode();
        const room: MultiplayerRoom = {
            id: uuidv4(),
            inviteCode,
            type,
            status: RoomStatus.LOBBY,
            players: [creator],
            spectators: [],
            settings: {
                maxPlayers: settings?.maxPlayers || 4,
                minPlayers: settings?.minPlayers || 2,
                timeLimit: settings?.timeLimit || 600,
                difficulty: settings?.difficulty || 'medium',
                spectatingAllowed: settings?.spectatingAllowed ?? true,
            },
            disconnectedPlayers: new Map(),
        };
        this.rooms.set(room.id, room);
        this.logger.log(`Room ${room.id} created by ${creator.id}`);
        return room;
    }

    getRoom(roomId: string): MultiplayerRoom | undefined {
        return this.rooms.get(roomId);
    }

    getPublicLobbies(): MultiplayerRoom[] {
        return Array.from(this.rooms.values()).filter(
            room => room.status === RoomStatus.LOBBY && room.players.length < room.settings.maxPlayers
        );
    }

    joinRoom(roomId: string, player: Player): MultiplayerRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        if (room.status !== RoomStatus.LOBBY) return null;
        if (room.players.length >= room.settings.maxPlayers) return null;

        if (!room.players.find(p => p.id === player.id)) {
            room.players.push(player);
        }
        return room;
    }

    leaveRoom(roomId: string, userId: string): MultiplayerRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        room.players = room.players.filter(p => p.id !== userId);
        if (room.players.length === 0) {
            this.rooms.delete(roomId);
            return null;
        }
        return room;
    }

    setPlayerReady(roomId: string, userId: string, ready: boolean): MultiplayerRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const player = room.players.find(p => p.id === userId);
        if (player) {
            player.ready = ready;
        }

        // Auto-start if all players are ready and min players met
        if (room.players.length >= room.settings.minPlayers && room.players.every(p => p.ready)) {
            room.status = RoomStatus.PLAYING;
            room.startTime = new Date();
        }

        return room;
    }

    updatePuzzleState(roomId: string, state: any): MultiplayerRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        room.puzzleState = state;
        return room;
    }

    // Matchmaking logic
    addToQueue(userId: string, skillLevel: number, type: RoomType) {
        if (!this.matchmakingQueue.find(q => q.userId === userId)) {
            this.matchmakingQueue.push({ userId, skillLevel, type });
            this.logger.log(`User ${userId} (level ${skillLevel}) added to ${type} matchmaking queue`);
        }
    }

    removeFromQueue(userId: string) {
        this.matchmakingQueue = this.matchmakingQueue.filter(q => q.userId !== userId);
    }

    findMatch() {
        if (this.matchmakingQueue.length < 2) return null;

        this.matchmakingQueue.sort((a, b) => a.skillLevel - b.skillLevel);

        for (let i = 0; i < this.matchmakingQueue.length - 1; i++) {
            const p1 = this.matchmakingQueue[i];
            const p2 = this.matchmakingQueue[i + 1];

            if (Math.abs(p1.skillLevel - p2.skillLevel) <= 2 && p1.type === p2.type) {
                const matchedPlayers = [p1, p2];
                this.matchmakingQueue = this.matchmakingQueue.filter(q => !matchedPlayers.find(mp => mp.userId === q.userId));
                return matchedPlayers;
            }
        }
        return null;
    }

    // Spectator methods
    addSpectator(roomId: string, spectator: Spectator): MultiplayerRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        if (!room.settings.spectatingAllowed) return null;

        // Check if spectator is already in the room
        if (!room.spectators.find(s => s.userId === spectator.userId)) {
            room.spectators.push(spectator);
            this.logger.log(`Spectator ${spectator.userId} joined room ${roomId}`);
        }
        return room;
    }

    removeSpectator(roomId: string, userId: string): MultiplayerRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        room.spectators = room.spectators.filter(s => s.userId !== userId);
        this.logger.log(`Spectator ${userId} left room ${roomId}`);
        return room;
    }

    toggleSpectating(roomId: string, spectatingAllowed: boolean): MultiplayerRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        room.settings.spectatingAllowed = spectatingAllowed;
        
        // If disabling, remove all spectators
        if (!spectatingAllowed) {
            room.spectators = [];
            this.logger.log(`Spectating disabled for room ${roomId}, all spectators removed`);
        } else {
            this.logger.log(`Spectating enabled for room ${roomId}`);
        }
        
        return room;
    }

    getSpectatorCount(roomId: string): number {
        const room = this.rooms.get(roomId);
        return room ? room.spectators.filter(s => s.isActive).length : 0;
    }

    isUserSpectating(roomId: string, userId: string): boolean {
        const room = this.rooms.get(roomId);
        return room ? !!room.spectators.find(s => s.userId === userId && s.isActive) : false;
    }
}
