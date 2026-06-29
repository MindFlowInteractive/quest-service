import { VerificationService } from '../verification.service';

describe('VerificationService basic', () => {
  it('generates and verifies structure', () => {
    const svc = new VerificationService();
    const p = svc.generateProof('badge-1', 'owner-1', 3600);
    expect(p).toHaveProperty('id');
    expect(svc.getProof(p.id)).toBeDefined();
    svc.commitOnChain(p.id);
    expect(svc.verifyProof(p.id).ok).toBe(true);
  });
});
