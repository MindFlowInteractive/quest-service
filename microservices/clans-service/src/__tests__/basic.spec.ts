import { ClansService } from '../clans.service';

describe('ClansService basic', () => {
  it('creates a clan and claims territory', () => {
    const svc = new ClansService();
    const clan = svc.createClan('Red', 'alice');
    expect(clan).toHaveProperty('id');
    const t = svc.claimTerritory(clan.id, 'Valley');
    expect(t.ownerClanId).toBe(clan.id);
  });
});
