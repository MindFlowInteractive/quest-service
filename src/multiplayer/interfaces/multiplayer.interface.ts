export enum RoomStatus {
    LOBBY = 'lobby',
    PLAYING = 'playing',
    FINISHED = 'finished',
}

export enum RoomType {
    COMPETITIVE = 'competitive',
    COLLABORATIVE = 'collaborative',
}

export interface Player {
    id: string;
    username: string;
    skillLevel: number;
    ready: boolean;
    score: number;
    solvedPuzzles: string[];
}

export interface MultiplayerRoom {
    id: string;
    type: RoomType;
    status: RoomStatus;
    players: Player[];
    puzzleId?: string;
    startTime?: Date;
    endTime?: Date;
    puzzleState?: any;
    settings: {
        maxPlayers: number;
        minPlayers: number;
        timeLimit: number;
        difficulty: string;
    };
}

export interface MatchmakingMatch {
    players: string[];
    puzzleId: string;
    type: RoomType;
}
