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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MultiplayerService } from '../services/multiplayer.service';
import { RoomType, Player, RoomStatus, Spectator } from '../interfaces/multiplayer.interface';
import { ValidationService } from '../../game-engine/services/validation.service';
import { LeaderboardService } from '../../leaderboard/leaderboard.service';
import { PuzzlesService } from '../../puzzles/puzzles.service';
import { SpectatorService } from '../../game-session/services/spectator.service';
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
        private readonly eventEmitter: EventEmitter2,
        private readonly spectatorService: SpectatorService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('Multiplayer Gateway Initialized');
    }

    async handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const userId = client.data.userId;
        const roomId = client.data.roomId;
        
        if (userId && roomId) {
            await this.multiplayerService.handlePlayerDisconnection(roomId, userId);
            
            // Notify other players in the room
            this.server.to(roomId).emit('playerDisconnected', { userId });
            this.server.to(`${roomId}-spectators`).emit('playerDisconnected', { userId });
        }
        
        if (userId) {
            this.multiplayerService.removeFromQueue(userId);
        }
    }

    @SubscribeMessage('createMultiplayerSession')
    async handleCreateMultiplayerSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; username: string; skillLevel: number; type: RoomType; settings: any; puzzleId?: string }
    ) {
        const player: Player = {
            id: data.userId,
            username: data.username,
            skillLevel: data.skillLevel,
            ready: false,
            score: 0,
            solvedPuzzles: [],
        };
        
        const session = await this.multiplayerService.createMultiplayerSession(
            data.type, 
            player, 
            data.settings, 
            data.puzzleId
        );
        
        client.join(session.id);
        client.data.userId = data.userId;
        client.data.roomId = session.id;
        
        return { event: 'multiplayerSessionCreated', data: session };
    }

    @SubscribeMessage('joinSessionByCode')
    async handleJoinSessionByCode(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { inviteCode: string; userId: string; username: string; skillLevel: number }
    ) {
        const player: Player = {
            id: data.userId,
            username: data.username,
            skillLevel: data.skillLevel,
            ready: false,
            score: 0,
            solvedPuzzles: [],
        };
        
        const session = await this.multiplayerService.joinSessionByCode(data.inviteCode, player);
        
        if (session) {
            client.join(session.id);
            client.data.userId = data.userId;
            client.data.roomId = session.id;
            
            // Broadcast to all players in the session
            this.server.to(session.id).emit('playerJoinedSession', { player, session });
            this.server.to(`${session.id}-spectators`).emit('playerJoinedSession', { player, session });
            
            return { event: 'joinedSessionByCode', data: session };
        }
        
        return { event: 'error', data: 'Failed to join session - invalid code or session full' };
    }

    @SubscribeMessage('reconnectToSession')
    async handleReconnectToSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string }
    ) {
        const session = await this.multiplayerService.handlePlayerReconnection(data.roomId, data.userId);
        
        if (session) {
            client.join(session.id);
            client.data.userId = data.userId;
            client.data.roomId = session.id;
            
            // Notify other players
            this.server.to(session.id).emit('playerReconnected', { userId: data.userId });
            this.server.to(`${session.id}-spectators`).emit('playerReconnected', { userId: data.userId });
            
            return { event: 'reconnectedToSession', data: session };
        }
        
        return { event: 'error', data: 'Failed to reconnect - grace period expired' };
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
        // Prevent spectators from joining as players
        if (client.data.isSpectator) {
            client.emit('error', 'Spectators cannot join as players');
            return;
        }

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
            
            // Broadcast to players
            this.server.to(data.roomId).emit('playerJoined', { player, room });
            // Broadcast to spectators
            this.server.to(`${data.roomId}-spectators`).emit('playerJoined', { player, room });
            
            return { event: 'joinedRoom', data: room };
        }
        return { event: 'error', data: 'Could not join room' };
    }

    @SubscribeMessage('ready')
    handleReady(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; ready: boolean }
    ) {
        // Prevent spectators from changing ready status
        if (client.data.isSpectator) {
            client.emit('error', 'Spectators cannot change ready status');
            return;
        }

        const room = this.multiplayerService.setPlayerReady(data.roomId, data.userId, data.ready);
        if (room) {
            // Broadcast to players
            this.server.to(data.roomId).emit('roomUpdated', room);
            // Broadcast to spectators
            this.server.to(`${data.roomId}-spectators`).emit('roomUpdated', room);
            
            if (room.status === RoomStatus.PLAYING) {
                // Broadcast game start to players
                this.server.to(data.roomId).emit('gameStarted', { startTime: room.startTime, puzzleId: room.puzzleId });
                // Broadcast game start to spectators
                this.server.to(`${data.roomId}-spectators`).emit('gameStarted', { startTime: room.startTime, puzzleId: room.puzzleId });
            }
        }
    }

    @SubscribeMessage('updatePuzzleState')
    handleUpdatePuzzleState(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; state: any }
    ) {
        // Prevent spectators from updating puzzle state
        if (client.data.isSpectator) {
            client.emit('error', 'Spectators cannot update puzzle state');
            return;
        }

        const room = this.multiplayerService.updatePuzzleState(data.roomId, data.state);
        if (room) {
            // Broadcast to players
            client.to(data.roomId).emit('puzzleStateUpdated', data.state);
            // Broadcast to spectators
            this.server.to(`${data.roomId}-spectators`).emit('puzzleStateUpdated', data.state);
        }
    }

    @SubscribeMessage('submitSolution')
    async handleSubmitSolution(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; puzzleId: string; solution: any }
    ) {
        // Prevent spectators from submitting solutions
        if (client.data.isSpectator) {
            client.emit('error', 'Spectators cannot submit solutions');
            return;
        }

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

                // Handle different game modes
                if (room.type === RoomType.COLLABORATIVE) {
                    // Co-op mode: All players share the victory
                    const allPlayersSolved = room.players.every(p => p.solvedPuzzles.includes(data.puzzleId));
                    
                    // Broadcast to players
                    this.server.to(data.roomId).emit('collaborativeSolutionVerified', {
                        userId: data.userId,
                        correct: true,
                        score: result.score,
                        totalScore: player?.score,
                        allPlayersSolved,
                        puzzleCompleted: allPlayersSolved
                    });

                this.eventEmitter.emit('puzzle.solved', {
                    userId: data.userId,
                    puzzleId: data.puzzleId,
                    score: result.score,
                    totalScore: player?.score,
                });

                if (room.type === RoomType.COMPETITIVE) {
                    // Broadcast to spectators
                    this.server.to(`${data.roomId}-spectators`).emit('collaborativeSolutionVerified', {
                        userId: data.userId,
                        correct: true,
                        score: result.score,
                        totalScore: player?.score,
                        allPlayersSolved,
                        puzzleCompleted: allPlayersSolved
                    });

                    // End session if all players solved the puzzle
                    if (allPlayersSolved) {
                        room.status = RoomStatus.FINISHED;
                        room.endTime = new Date();
                        
                        // Update Redis
                        await this.multiplayerService['cacheManager'].set(`session:${room.inviteCode}`, room, 3600);
                        
                        this.server.to(data.roomId).emit('collaborativeSessionCompleted', {
                            session: room,
                            finalScores: room.players.map(p => ({ userId: p.id, username: p.username, score: p.score }))
                        });
                        
                        this.server.to(`${data.roomId}-spectators`).emit('collaborativeSessionCompleted', {
                            session: room,
                            finalScores: room.players.map(p => ({ userId: p.id, username: p.username, score: p.score }))
                        });
                    }
                } else if (room.type === RoomType.COMPETITIVE) {
                    // Versus mode: Individual competition
                    this.server.to(data.roomId).emit('competitiveSolutionVerified', {
                        userId: data.userId,
                        correct: true,
                        score: result.score,
                        totalScore: player?.score,
                        leaderboard: room.players.sort((a, b) => b.score - a.score).map(p => ({
                            userId: p.id,
                            username: p.username,
                            score: p.score,
                            solvedCount: p.solvedPuzzles.length
                        }))
                    });

                    this.server.to(`${data.roomId}-spectators`).emit('competitiveSolutionVerified', {
                        userId: data.userId,
                        correct: true,
                        score: result.score,
                        totalScore: player?.score,
                        leaderboard: room.players.sort((a, b) => b.score - a.score).map(p => ({
                            userId: p.id,
                            username: p.username,
                            score: p.score,
                            solvedCount: p.solvedPuzzles.length
                        }))
                    });

                    // Update leaderboard for competitive mode
                    await this.leaderboardService.createEntry({
                        leaderboardId: 1,
                        userId: parseInt(data.userId) || 0,
                        score: player?.score || 0,
                    } as any);

                    // Check if session should end (time limit or all puzzles solved)
                    const sessionDuration = room.startTime ? (new Date().getTime() - room.startTime.getTime()) / 1000 / 60 : 0;
                    if (sessionDuration >= room.settings.timeLimit || player?.solvedPuzzles.length >= 10) {
                        room.status = RoomStatus.FINISHED;
                        room.endTime = new Date();
                        
                        // Update Redis
                        await this.multiplayerService['cacheManager'].set(`session:${room.inviteCode}`, room, 3600);
                        
                        const winner = room.players.reduce((prev, current) => (prev.score > current.score) ? prev : current);
                        
                        this.server.to(data.roomId).emit('competitiveSessionCompleted', {
                            session: room,
                            winner: {
                                userId: winner.id,
                                username: winner.username,
                                score: winner.score
                            },
                            finalLeaderboard: room.players.sort((a, b) => b.score - a.score).map(p => ({
                                userId: p.id,
                                username: p.username,
                                score: p.score,
                                solvedCount: p.solvedPuzzles.length
                            }))
                        });
                        
                        this.server.to(`${data.roomId}-spectators`).emit('competitiveSessionCompleted', {
                            session: room,
                            winner: {
                                userId: winner.id,
                                username: winner.username,
                                score: winner.score
                            },
                            finalLeaderboard: room.players.sort((a, b) => b.score - a.score).map(p => ({
                                userId: p.id,
                                username: p.username,
                                score: p.score,
                                solvedCount: p.solvedPuzzles.length
                            }))
                        });
                    }
                }
            } else {
                client.emit('solutionVerified', { userId: data.userId, correct: false, errors: result.errors });
            }
        } catch (error) {
            this.logger.error(`Error validating solution: ${error.message}`);
            client.emit('error', 'Failed to validate solution');
        }
    }

    @SubscribeMessage('updateCollaborativeState')
    async handleUpdateCollaborativeState(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; state: any; userId: string }
    ) {
        const room = this.multiplayerService.getRoom(data.roomId);
        if (!room || room.type !== RoomType.COLLABORATIVE) return;

        // Prevent spectators from updating state
        if (client.data.isSpectator) {
            client.emit('error', 'Spectators cannot update collaborative state');
            return;
        }

        // Update shared puzzle state for collaborative mode
        room.puzzleState = { ...room.puzzleState, ...data.state, lastUpdatedBy: data.userId };
        
        // Broadcast collaborative state update to all players
        this.server.to(data.roomId).emit('collaborativeStateUpdated', {
            state: room.puzzleState,
            updatedBy: data.userId,
            timestamp: new Date()
        });

        // Broadcast to spectators
        this.server.to(`${data.roomId}-spectators`).emit('collaborativeStateUpdated', {
            state: room.puzzleState,
            updatedBy: data.userId,
            timestamp: new Date()
        });
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

    @SubscribeMessage('spectate')
    async handleSpectate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; username: string }
    ) {
        const spectator: Spectator = {
            id: uuidv4(),
            userId: data.userId,
            username: data.username,
            joinedAt: new Date(),
            isActive: true,
        };

        const room = this.multiplayerService.addSpectator(data.roomId, spectator);
        if (room) {
            client.join(`${data.roomId}-spectators`);
            client.data.userId = data.userId;
            client.data.isSpectator = true;
            client.data.roomId = data.roomId;

            // Send current room state to spectator
            client.emit('spectatorJoined', { room, spectator });
            
            // Notify players about new spectator
            this.server.to(data.roomId).emit('spectatorCountUpdated', { 
                count: this.multiplayerService.getSpectatorCount(data.roomId) 
            });

            // Notify other spectators
            this.server.to(`${data.roomId}-spectators`).emit('spectatorJoined', { spectator });

            return { event: 'spectatingStarted', data: room };
        }
        return { event: 'error', data: 'Could not join as spectator' };
    }

    @SubscribeMessage('leaveSpectate')
    async handleLeaveSpectate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string }
    ) {
        const room = this.multiplayerService.removeSpectator(data.roomId, data.userId);
        if (room) {
            client.leave(`${data.roomId}-spectators`);
            client.data.isSpectator = false;
            delete client.data.roomId;

            // Notify players about spectator leaving
            this.server.to(data.roomId).emit('spectatorCountUpdated', { 
                count: this.multiplayerService.getSpectatorCount(data.roomId) 
            });

            // Notify other spectators
            this.server.to(`${data.roomId}-spectators`).emit('spectatorLeft', { userId: data.userId });

            return { event: 'spectatingEnded' };
        }
        return { event: 'error', data: 'Not currently spectating' };
    }

    @SubscribeMessage('toggleSpectating')
    async handleToggleSpectating(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; spectatingAllowed: boolean }
    ) {
        const room = this.multiplayerService.toggleSpectating(data.roomId, data.spectatingAllowed);
        if (room) {
            // Notify all room users
            this.server.to(data.roomId).emit('spectatingToggled', { spectatingAllowed: data.spectatingAllowed });
            
            if (!data.spectatingAllowed) {
                // Remove all spectators from spectator room
                this.server.in(`${data.roomId}-spectators`).socketsLeave(`${data.roomId}-spectators`);
            }

            return { event: 'spectatingToggled', data: { spectatingAllowed: data.spectatingAllowed } };
        }
        return { event: 'error', data: 'Could not toggle spectating' };
    }
}
