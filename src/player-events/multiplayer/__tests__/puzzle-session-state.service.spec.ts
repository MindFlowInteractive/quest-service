import { PuzzleSessionStateService } from '../services/puzzle-session-state.service';
import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';

describe('PuzzleSessionStateService', () => {
  let service: PuzzleSessionStateService;
  let redis: any;

  beforeEach(() => {
    service = new PuzzleSessionStateService();
    redis = (service as any).redis;
    jest.spyOn(redis, 'get').mockResolvedValue(null);
    jest.spyOn(redis, 'set').mockResolvedValue('OK');
    jest.spyOn(redis, 'del').mockResolvedValue(1);
  });

  it('creates initial state', async () => {
    const state = await service.create('session-1', 'puzzle-1');
    expect(state.version).toBe(0);
    expect(state.status).toBe(PuzzleSessionStatus.WAITING);
    expect(redis.set).toHaveBeenCalled();
  });

  it('rejects a stale client version', async () => {
    jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify({
      sessionId: 'session-1',
      puzzleId: 'puzzle-1',
      version: 4,
      status: PuzzleSessionStatus.ACTIVE,
      players: {},
      sharedProgress: { completedSteps: [], discoveredHints: [], solvedSteps: [] },
      partialSolutions: {},
      updatedAt: new Date().toISOString(),
    }));

    await expect(
      service.mutate('session-1', 3, () => undefined),
    ).rejects.toThrow('STALE_SESSION_STATE:4');
  });
});
