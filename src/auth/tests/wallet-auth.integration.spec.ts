import { Test } from '@nestjs/testing';
import { WalletAuthService } from '../wallet-auth.service';

describe('WalletAuthService', () => {
  let service: WalletAuthService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [WalletAuthService],
    }).compile();

    service = module.get(WalletAuthService);
  });

  it('should generate a challenge message', () => {
    const challenge = service.generateChallenge('GABC...');
    expect(challenge).toContain('Login challenge');
  });
});
