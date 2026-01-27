import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MultiplayerRoom, RoomStatus, RoomType, Player } from '../interfaces/multiplayer.interface';

@Injectable()
export class MultiplayerService {
    private readonly logger = new Logger(MultiplayerService.name);
    private rooms: Map<string, MultiplayerRoom> = new Map();
    private matchmakingQueue: Array<{ userId: string; skillLevel: number; type: RoomType }> = [];

    createRoom(type: RoomType, creator: Player, settings?: any): MultiplayerRoom {
        const room: MultiplayerRoom = {
            id: uuidv4(),
            type,
            status: RoomStatus.LOBBY,
            players: [creator],
            settings: {
                maxPlayers: settings?.maxPlayers || 4,
                minPlayers: settings?.minPlayers || 2,
                timeLimit: settings?.timeLimit || 600,
                difficulty: settings?.difficulty || 'medium',
            },
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
}
