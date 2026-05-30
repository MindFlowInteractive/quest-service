import { SponsorshipService } from '../sponsorship.service';

describe('SponsorshipService basic', () => {
  it('creates sponsor and campaign', () => {
    const svc = new SponsorshipService();
    const s = svc.createSponsor('BrandCo');
    const c = svc.createCampaign(s.id, 'Launch');
    expect(c).toBeDefined();
  });
});
