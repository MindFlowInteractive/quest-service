import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MultiplayerService } from '../services/multiplayer.service';
import { RoomType, Player, RoomStatus } from '../interfaces/multiplayer.interface';
import { ValidationService } from '../../game-engine/services/validation.service';
import { LeaderboardService } from '../../leaderboard/leaderboard.service';
import { PuzzlesService } from '../../puzzles/puzzles.service';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'multiplayer',
})
export class MultiplayerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('MultiplayerGateway');

    constructor(
        private readonly multiplayerService: MultiplayerService,
        private readonly validationService: ValidationService,
        private readonly leaderboardService: LeaderboardService,
        private readonly puzzlesService: PuzzlesService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('Multiplayer Gateway Initialized');
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const userId = client.data.userId;
        if (userId) {
            this.multiplayerService.removeFromQueue(userId);
        }
    }

    @SubscribeMessage('createRoom')
    handleCreateRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; username: string; skillLevel: number; type: RoomType; settings: any }
    ) {
        const player: Player = {
            id: data.userId,
            username: data.username,
            skillLevel: data.skillLevel,
            ready: false,
            score: 0,
            solvedPuzzles: [],
        };
        const room = this.multiplayerService.createRoom(data.type, player, data.settings);
        client.join(room.id);
        client.data.userId = data.userId;
        return { event: 'roomCreated', data: room };
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; username: string; skillLevel: number }
    ) {
        const player: Player = {
            id: data.userId,
            username: data.username,
            skillLevel: data.skillLevel,
            ready: false,
            score: 0,
            solvedPuzzles: [],
        };
        const room = this.multiplayerService.joinRoom(data.roomId, player);
        if (room) {
            client.join(data.roomId);
            client.data.userId = data.userId;
            this.server.to(data.roomId).emit('playerJoined', { player, room });
            return { event: 'joinedRoom', data: room };
        }
        return { event: 'error', data: 'Could not join room' };
    }

    @SubscribeMessage('ready')
    handleReady(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; ready: boolean }
    ) {
        const room = this.multiplayerService.setPlayerReady(data.roomId, data.userId, data.ready);
        if (room) {
            this.server.to(data.roomId).emit('roomUpdated', room);
            if (room.status === RoomStatus.PLAYING) {
                this.server.to(data.roomId).emit('gameStarted', { startTime: room.startTime, puzzleId: room.puzzleId });
            }
        }
    }

    @SubscribeMessage('updatePuzzleState')
    handleUpdatePuzzleState(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; state: any }
    ) {
        const room = this.multiplayerService.updatePuzzleState(data.roomId, data.state);
        if (room) {
            client.to(data.roomId).emit('puzzleStateUpdated', data.state);
        }
    }

    @SubscribeMessage('submitSolution')
    async handleSubmitSolution(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; puzzleId: string; solution: any }
    ) {
        const room = this.multiplayerService.getRoom(data.roomId);
        if (!room || room.status !== RoomStatus.PLAYING) return;

        try {
            const puzzle = await this.puzzlesService.findOne(data.puzzleId);
            if (!puzzle) {
                client.emit('error', 'Puzzle not found');
                return;
            }

            // Adapt Puzzle entity to IPuzzle interface expected by ValidationService
            const adaptedPuzzle: any = {
                id: puzzle.id,
                type: puzzle.content.type,
                difficulty: puzzle.difficulty,
                timeLimit: puzzle.timeLimit,
                content: puzzle.content,
                isComplete: () => false, // Placeholder as we validate solution directly
            };

            const result = await this.validationService.validateSolution(adaptedPuzzle, data.solution);

            if (result.isValid) {
                const player = room.players.find(p => p.id === data.userId);
                if (player) {
                    player.score += result.score;
                    player.solvedPuzzles.push(data.puzzleId);
                }

                this.server.to(data.roomId).emit('solutionVerified', {
                    userId: data.userId,
                    correct: true,
                    score: result.score,
                    totalScore: player?.score
                });

                if (room.type === RoomType.COMPETITIVE) {
                    await this.leaderboardService.createEntry({
                        leaderboardId: 1,
                        userId: parseInt(data.userId) || 0,
                        score: player?.score || 0,
                    } as any);
                }
            } else {
                client.emit('solutionVerified', { userId: data.userId, correct: false, errors: result.errors });
            }
        } catch (error) {
            this.logger.error(`Error validating solution: ${error.message}`);
            client.emit('error', 'Failed to validate solution');
        }
    }

    @SubscribeMessage('startMatchmaking')
    handleStartMatchmaking(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; skillLevel: number; type: RoomType }
    ) {
        client.data.userId = data.userId;
        this.multiplayerService.addToQueue(data.userId, data.skillLevel, data.type);

        const matchedPlayers = this.multiplayerService.findMatch();
        if (matchedPlayers) {
            const matchedRoomId = uuidv4();
            this.server.emit('matchFound', { roomId: matchedRoomId, players: matchedPlayers });
        }

        return { event: 'matchmakingStarted' };
    }

    @SubscribeMessage('getLobbies')
    handleGetLobbies() {
        const lobbies = this.multiplayerService.getPublicLobbies();
        return { event: 'lobbiesList', data: lobbies };
    }
}
