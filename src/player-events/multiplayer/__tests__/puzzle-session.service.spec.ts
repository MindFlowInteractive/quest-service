import { PuzzleSessionService } from '../services/puzzle-session.service';
import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';

describe('PuzzleSessionService', () => {
  it('has the expected service contract', () => {
    expect(PuzzleSessionService).toBeDefined();
    expect(PuzzleSessionStatus.ACTIVE).toBe('ACTIVE');
  });
});
