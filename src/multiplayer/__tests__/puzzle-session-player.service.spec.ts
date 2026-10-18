import { NotFoundException } from '@nestjs/common';
import { PuzzleSessionPlayerService } from '../services/puzzle-session-player.service';
import { PuzzlePlayerRole } from '../enums/puzzle-player-role.enum';
import { PuzzlePlayerStatus } from '../enums/puzzle-player-status.enum';

describe('PuzzleSessionPlayerService', () => {
  let repository: any;
  let service: PuzzleSessionPlayerService;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    service = new PuzzleSessionPlayerService(repository);
  });

  it('joins as a contributor by default', async () => {
    repository.findOne.mockResolvedValue(null);

    const player = await service.join('session-1', 'user-1');

    expect(player.role).toBe(PuzzlePlayerRole.CONTRIBUTOR);
    expect(player.contributions).toBe(0);
    expect(player.contributionPoints).toBe(0);
    expect(player.status).toBe(PuzzlePlayerStatus.CONNECTED);
  });

  it('keeps the assigned role when an existing player rejoins', async () => {
    repository.findOne.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
      status: PuzzlePlayerStatus.LEFT,
      role: PuzzlePlayerRole.LEADER,
      leftAt: new Date(),
    });

    const player = await service.join('session-1', 'user-1');

    expect(player.status).toBe(PuzzlePlayerStatus.CONNECTED);
    expect(player.role).toBe(PuzzlePlayerRole.LEADER);
    expect(player.leftAt).toBeNull();
  });

  it('assigns a role to an existing player', async () => {
    repository.findOne.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
      role: PuzzlePlayerRole.CONTRIBUTOR,
    });

    const player = await service.assignRole(
      'session-1',
      'user-1',
      PuzzlePlayerRole.LEADER,
    );

    expect(player.role).toBe(PuzzlePlayerRole.LEADER);
    expect(repository.save).toHaveBeenCalled();
  });

  it('throws when assigning a role to a missing player', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.assignRole('session-1', 'missing', PuzzlePlayerRole.LEADER),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the role, or null when the player is unknown', async () => {
    repository.findOne.mockResolvedValue({ role: PuzzlePlayerRole.OBSERVER });
    await expect(service.getRole('session-1', 'user-1')).resolves.toBe(
      PuzzlePlayerRole.OBSERVER,
    );

    repository.findOne.mockResolvedValue(null);
    await expect(service.getRole('session-1', 'user-2')).resolves.toBeNull();
  });

  it('accumulates contributions and points', async () => {
    repository.findOne.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
      contributions: 2,
      contributionPoints: 20,
    });

    const player = await service.recordContribution(
      'session-1',
      'user-1',
      10,
    );

    expect(player.contributions).toBe(3);
    expect(player.contributionPoints).toBe(30);
    expect(player.lastContributionAt).toBeInstanceOf(Date);
  });

  it('never subtracts points for a negative award', async () => {
    repository.findOne.mockResolvedValue({
      contributions: 0,
      contributionPoints: 0,
    });

    const player = await service.recordContribution(
      'session-1',
      'user-1',
      -50,
    );

    expect(player.contributions).toBe(1);
    expect(player.contributionPoints).toBe(0);
  });

  it('builds a leaderboard sorted by contribution points', async () => {
    repository.find.mockResolvedValue([
      {
        userId: 'user-1',
        role: PuzzlePlayerRole.CONTRIBUTOR,
        contributions: 1,
        contributionPoints: 10,
      },
      {
        userId: 'user-2',
        role: PuzzlePlayerRole.CONTRIBUTOR,
        contributions: 3,
        contributionPoints: 30,
      },
    ]);

    const rows = await service.getContributions('session-1');

    expect(rows.map((row) => row.userId)).toEqual(['user-2', 'user-1']);
    expect(rows[0].share).toBeCloseTo(0.75);
    expect(rows[1].share).toBeCloseTo(0.25);
  });

  it('avoids dividing by zero on an empty leaderboard', async () => {
    repository.find.mockResolvedValue([
      { userId: 'user-1', contributions: 0, contributionPoints: 0 },
    ]);

    const rows = await service.getContributions('session-1');

    expect(rows[0].share).toBe(0);
  });

  it('filters out players that left', async () => {
    repository.find.mockResolvedValue([
      { userId: 'user-1', status: PuzzlePlayerStatus.CONNECTED },
      { userId: 'user-2', status: PuzzlePlayerStatus.LEFT },
    ]);

    const active = await service.getActivePlayers('session-1');

    expect(active.map((player) => player.userId)).toEqual(['user-1']);
  });

  it('marks a player as left', async () => {
    repository.findOne.mockResolvedValue({
      status: PuzzlePlayerStatus.CONNECTED,
      leftAt: null,
    });

    const player = await service.leave('session-1', 'user-1');

    expect(player.status).toBe(PuzzlePlayerStatus.LEFT);
    expect(player.leftAt).toBeInstanceOf(Date);
  });
});
