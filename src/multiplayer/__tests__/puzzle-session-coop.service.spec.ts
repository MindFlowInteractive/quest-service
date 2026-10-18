import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PuzzleSessionService } from '../services/puzzle-session.service';
import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';
import { PuzzleSessionEventType } from '../enums/puzzle-session-event.enum';
import { PuzzlePlayerRole } from '../enums/puzzle-player-role.enum';
import { PuzzlePlayerStatus } from '../enums/puzzle-player-status.enum';
import { PuzzleSessionState } from '../interfaces/puzzle-session-state.interface';

function player(userId: string, overrides: Record<string, any> = {}) {
  return {
    userId,
    status: PuzzlePlayerStatus.CONNECTED,
    connected: true,
    score: 0,
    progress: 0,
    role: PuzzlePlayerRole.CONTRIBUTOR,
    contributions: 0,
    contributionPoints: 0,
    ...overrides,
  };
}

function makeState(overrides: Record<string, any> = {}): PuzzleSessionState {
  return {
    sessionId: 'session-1',
    puzzleId: 'puzzle-1',
    version: 1,
    status: PuzzleSessionStatus.ACTIVE,
    players: {},
    sharedProgress: {
      completedSteps: [],
      discoveredHints: [],
      solvedSteps: [],
      stepContributors: {},
    },
    partialSolutions: {},
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSession(overrides: Record<string, any> = {}) {
  return {
    id: 'session-1',
    puzzleId: 'puzzle-1',
    status: PuzzleSessionStatus.ACTIVE,
    maxPlayers: 5,
    requiredSolvedSteps: [],
    minContributors: 1,
    requireAllPlayers: false,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

describe('PuzzleSessionService - co-operative features', () => {
  let sessionRepo: any;
  let solutionRepo: any;
  let messageRepo: any;
  let playerService: any;
  let stateService: any;
  let persistence: any;
  let timeoutService: any;
  let service: PuzzleSessionService;

  beforeEach(() => {
    sessionRepo = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    solutionRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    messageRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'message-1', ...value })),
      find: jest.fn().mockResolvedValue([]),
    };
    playerService = {
      join: jest.fn(),
      leave: jest.fn().mockResolvedValue({}),
      getActivePlayers: jest.fn(),
      assignRole: jest.fn(),
      recordContribution: jest.fn().mockResolvedValue({}),
      getContributions: jest.fn().mockResolvedValue([]),
      countActive: jest.fn().mockResolvedValue(1),
    };
    stateService = {
      get: jest.fn(),
      create: jest.fn(),
      set: jest.fn(),
      mutate: jest.fn(),
    };
    persistence = { recordEvent: jest.fn().mockResolvedValue({}) };
    timeoutService = {
      schedule: jest.fn().mockResolvedValue(undefined),
      cancel: jest.fn().mockResolvedValue(undefined),
    };

    service = new PuzzleSessionService(
      sessionRepo,
      solutionRepo,
      messageRepo,
      playerService,
      stateService,
      persistence,
      timeoutService,
    );
  });

  /**
   * Wire the state service to a live, mutable state so multi-step flows
   * (submit -> auto-complete) behave like the real Redis implementation.
   */
  function useLiveState(initial: PuzzleSessionState) {
    let current = JSON.parse(JSON.stringify(initial)) as PuzzleSessionState;

    stateService.get.mockImplementation(async () =>
      JSON.parse(JSON.stringify(current)),
    );
    stateService.mutate.mockImplementation(
      async (_id: string, _version: number, mutation: any) => {
        const next = JSON.parse(JSON.stringify(current)) as PuzzleSessionState;
        mutation(next);
        next.version += 1;
        current = next;
        return next;
      },
    );

    return {
      get: () => current,
    };
  }

  describe('create', () => {
    it('makes the creator the team leader', async () => {
      const session = makeSession({ status: PuzzleSessionStatus.WAITING });
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.create.mockImplementation((value: any) => ({
        id: 'session-1',
        ...value,
      }));
      sessionRepo.save.mockImplementation(async (value: any) => value);

      playerService.join.mockResolvedValue(player('leader-1'));
      playerService.getActivePlayers.mockResolvedValue([
        player('leader-1'),
      ]);
      playerService.assignRole.mockResolvedValue(
        player('leader-1', { role: PuzzlePlayerRole.LEADER }),
      );
      useLiveState(makeState({ players: {} }));

      const result = await service.create(
        {
          puzzleId: 'puzzle-1',
          maxPlayers: 5,
          durationSeconds: 60,
          requiredSolvedSteps: ['step-1'],
          minContributors: 2,
          requireAllPlayers: true,
        } as any,
        'leader-1',
      );

      expect(playerService.assignRole).toHaveBeenCalledWith(
        'session-1',
        'leader-1',
        PuzzlePlayerRole.LEADER,
      );
      expect(result.players['leader-1'].role).toBe(PuzzlePlayerRole.LEADER);
      expect(persistence.recordEvent).toHaveBeenCalledWith(
        'session-1',
        PuzzleSessionEventType.SESSION_CREATED,
        'leader-1',
        expect.objectContaining({
          requiredSolvedSteps: ['step-1'],
          minContributors: 2,
          requireAllPlayers: true,
        }),
      );
    });
  });

  describe('assignRole', () => {
    it('rejects role changes from non-leaders', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      stateService.get.mockResolvedValue(
        makeState({ players: { 'user-1': player('user-1') } }),
      );
      playerService.getActivePlayers.mockResolvedValue([
        player('user-1', { role: PuzzlePlayerRole.CONTRIBUTOR }),
      ]);

      await expect(
        service.assignRole(
          {
            sessionId: 'session-1',
            targetUserId: 'user-2',
            role: PuzzlePlayerRole.LEADER,
          },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets the leader promote a contributor', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      useLiveState(
        makeState({
          players: {
            'leader-1': player('leader-1', {
              role: PuzzlePlayerRole.LEADER,
            }),
            'user-2': player('user-2'),
          },
        }),
      );
      playerService.getActivePlayers.mockResolvedValue([
        player('leader-1', { role: PuzzlePlayerRole.LEADER }),
        player('user-2'),
      ]);
      playerService.assignRole.mockImplementation(
        async (_sessionId: string, userId: string, role: PuzzlePlayerRole) =>
          player(userId, { role }),
      );

      const result = await service.assignRole(
        {
          sessionId: 'session-1',
          targetUserId: 'user-2',
          role: PuzzlePlayerRole.LEADER,
        },
        'leader-1',
      );

      // The previous leader is demoted before the target is promoted.
      expect(playerService.assignRole).toHaveBeenCalledWith(
        'session-1',
        'leader-1',
        PuzzlePlayerRole.CONTRIBUTOR,
      );
      expect(playerService.assignRole).toHaveBeenCalledWith(
        'session-1',
        'user-2',
        PuzzlePlayerRole.LEADER,
      );
      expect(result.state.players['user-2'].role).toBe(
        PuzzlePlayerRole.LEADER,
      );
      expect(result.state.players['leader-1'].role).toBe(
        PuzzlePlayerRole.CONTRIBUTOR,
      );
    });
  });

  describe('submitSolution', () => {
    it('rejects observers', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      stateService.get.mockResolvedValue(
        makeState({
          players: {
            'user-1': player('user-1', { role: PuzzlePlayerRole.OBSERVER }),
          },
        }),
      );

      await expect(
        service.submitSolution(
          { sessionId: 'session-1', content: 'answer' } as any,
          'user-1',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(solutionRepo.save).not.toHaveBeenCalled();
    });

    it('credits the contributor and auto-completes when the team wins', async () => {
      sessionRepo.findOne.mockResolvedValue(
        makeSession({ requiredSolvedSteps: ['step-1'], minContributors: 1 }),
      );
      useLiveState(
        makeState({ players: { 'user-1': player('user-1') } }),
      );

      const result = await service.submitSolution(
        {
          sessionId: 'session-1',
          content: 'the answer',
          stepId: 'step-1',
        } as any,
        'user-1',
      );

      expect(result.correct).toBe(true);
      expect(result.completed).toBe(true);
      expect(result.state.status).toBe(PuzzleSessionStatus.COMPLETED);
      expect(result.state.sharedProgress.solvedSteps).toContain('step-1');
      expect(result.state.sharedProgress.stepContributors['step-1']).toBe(
        'user-1',
      );
      expect(playerService.recordContribution).toHaveBeenCalledWith(
        'session-1',
        'user-1',
        10,
      );
      expect(persistence.recordEvent).toHaveBeenCalledWith(
        'session-1',
        PuzzleSessionEventType.PUZZLE_COMPLETED,
        'user-1',
      );
    });

    it('does not auto-complete a session without a win condition', async () => {
      sessionRepo.findOne.mockResolvedValue(
        makeSession({ requiredSolvedSteps: [] }),
      );
      useLiveState(
        makeState({ players: { 'user-1': player('user-1') } }),
      );

      const result = await service.submitSolution(
        {
          sessionId: 'session-1',
          content: 'the answer',
          stepId: 'step-1',
        } as any,
        'user-1',
      );

      expect(result.correct).toBe(true);
      expect(result.completed).toBe(false);
      expect(result.winCondition.satisfied).toBe(false);
      expect(timeoutService.cancel).not.toHaveBeenCalled();
    });

    it('waits for a second contributor when the team requires one', async () => {
      sessionRepo.findOne.mockResolvedValue(
        makeSession({ requiredSolvedSteps: ['step-1', 'step-2'], minContributors: 2 }),
      );
      useLiveState(
        makeState({
          players: {
            'user-1': player('user-1'),
            'user-2': player('user-2'),
          },
        }),
      );

      const first = await service.submitSolution(
        {
          sessionId: 'session-1',
          content: 'first answer',
          stepId: 'step-1',
        } as any,
        'user-1',
      );

      expect(first.completed).toBe(false);
      expect(first.winCondition.progress.contributors).toBe(1);

      const second = await service.submitSolution(
        {
          sessionId: 'session-1',
          content: 'second answer',
          stepId: 'step-2',
        } as any,
        'user-2',
      );

      expect(second.completed).toBe(true);
      expect(second.winCondition.progress.contributors).toBe(2);
    });
  });

  describe('messaging', () => {
    it('persists trimmed messages and records an event', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      stateService.get.mockResolvedValue(
        makeState({ players: { 'user-1': player('user-1') } }),
      );

      const message = await service.sendMessage(
        { sessionId: 'session-1', content: '  hello team  ' },
        'user-1',
      );

      expect(message.content).toBe('hello team');
      expect(message.type).toBe('chat');
      expect(persistence.recordEvent).toHaveBeenCalledWith(
        'session-1',
        PuzzleSessionEventType.MESSAGE_SENT,
        'user-1',
        expect.objectContaining({ messageId: 'message-1' }),
      );
    });

    it('rejects messages from players outside the session', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      stateService.get.mockResolvedValue(makeState({ players: {} }));

      await expect(
        service.sendMessage(
          { sessionId: 'session-1', content: 'hello' },
          'outsider',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('pages chat history newest first', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      messageRepo.find.mockResolvedValue([{ id: 'message-1' }]);

      const messages = await service.getMessages('session-1', 10, 20);

      expect(messages).toHaveLength(1);
      expect(messageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId: 'session-1' },
          take: 10,
          skip: 20,
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('contributions and shared progress', () => {
    it('summarises the team contribution leaderboard', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      playerService.getContributions.mockResolvedValue([
        { userId: 'user-1', contributions: 2, contributionPoints: 20 },
        { userId: 'user-2', contributions: 1, contributionPoints: 10 },
      ]);

      const result = await service.getContributions('session-1');

      expect(result.totalContributions).toBe(3);
      expect(result.totalPoints).toBe(30);
      expect(result.players).toHaveLength(2);
    });

    it('reports win-condition progress', async () => {
      sessionRepo.findOne.mockResolvedValue(
        makeSession({ requiredSolvedSteps: ['step-1', 'step-2'] }),
      );
      stateService.get.mockResolvedValue(
        makeState({
          players: { 'user-1': player('user-1', { contributions: 1 }) },
          sharedProgress: {
            completedSteps: [],
            discoveredHints: [],
            solvedSteps: ['step-1'],
            stepContributors: { 'step-1': 'user-1' },
          },
        }),
      );

      const progress = await service.getWinConditionProgress('session-1');

      expect(progress.satisfied).toBe(false);
      expect(progress.progress.solvedRequiredSteps).toEqual(['step-1']);
      expect(progress.progress.missingSteps).toEqual(['step-2']);
    });

    it('shares a discovered hint with the whole team', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      useLiveState(
        makeState({ players: { 'user-1': player('user-1') } }),
      );

      const state = await service.discoverHint(
        'session-1',
        'user-1',
        'hint-7',
      );

      expect(state.sharedProgress.discoveredHints).toContain('hint-7');
      expect(persistence.recordEvent).toHaveBeenCalledWith(
        'session-1',
        PuzzleSessionEventType.HINT_DISCOVERED,
        'user-1',
        { hintId: 'hint-7' },
      );
    });
  });

  describe('leave', () => {
    it('promotes the next active player when the leader leaves', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      useLiveState(
        makeState({
          players: {
            'leader-1': player('leader-1', {
              role: PuzzlePlayerRole.LEADER,
            }),
            'user-2': player('user-2'),
          },
        }),
      );
      playerService.getActivePlayers.mockResolvedValue([
        player('user-2'),
      ]);
      playerService.assignRole.mockResolvedValue(
        player('user-2', { role: PuzzlePlayerRole.LEADER }),
      );

      const state = await service.leave('session-1', 'leader-1');

      expect(playerService.assignRole).toHaveBeenCalledWith(
        'session-1',
        'user-2',
        PuzzlePlayerRole.LEADER,
      );
      expect(state.players['user-2'].role).toBe(PuzzlePlayerRole.LEADER);
      expect(state.players['leader-1'].connected).toBe(false);
    });
  });
});
