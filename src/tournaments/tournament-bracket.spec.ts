import { TournamentBracketService } from './tournament-bracket.service';
import { Participant } from './tournament.types';

describe('TournamentBracketService', () => {
  let service: TournamentBracketService;
  const mockParticipants: Participant[] = [
    { id: 'p1', name: 'Alpha', rating: 1500 },
    { id: 'p2', name: 'Beta', rating: 1400 },
    { id: 'p3', name: 'Gamma', rating: 1300 },
    { id: 'p4', name: 'Delta', rating: 1200 },
    { id: 'p5', name: 'Epsilon', rating: 1100 },
  ];

  beforeEach(() => {
    service = new TournamentBracketService();
  });

  it('should generate a valid single-elimination bracket with bye handling for non-power-of-2 participants', () => {
    const bracket = service.generateBracket('t_1', mockParticipants);

    expect(bracket.rounds.length).toBe(3); // 5 participants padded to 8 slots -> 3 rounds
    expect(bracket.totalParticipants).toBe(5);

    const analytics = service.getAnalytics(bracket);
    expect(analytics.totalMatches).toBe(7); // 4 + 2 + 1
    expect(analytics.byesCount).toBeGreaterThan(0);
  });

  it('should correctly advance match winner to the next round', () => {
    let bracket = service.generateBracket('t_2', [
      { id: 'p1', name: 'One', rating: 2000 },
      { id: 'p2', name: 'Two', rating: 1900 },
      { id: 'p3', name: 'Three', rating: 1800 },
      { id: 'p4', name: 'Four', rating: 1700 },
    ]);

    const r1MatchId = bracket.rounds[0].matches[0].id;
    const p1Id = bracket.rounds[0].matches[0].participant1Id!;

    bracket = service.advanceMatch(bracket, r1MatchId, p1Id);

    const r2Match = bracket.rounds[1].matches[0];
    expect(r2Match.participant1Id).toBe(p1Id);
    expect(r2Match.status).toBe('ready');
  });

  it('should reset the bracket correctly', () => {
    const bracket = service.generateBracket('t_3', mockParticipants);
    const reset = service.resetBracket('t_3', mockParticipants);

    expect(reset).toEqual(bracket);
  });
});