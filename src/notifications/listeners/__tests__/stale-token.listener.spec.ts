import { Test, TestingModule } from '@nestjs/testing';
import { StaleTokenListener } from '../stale-token.listener';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Device } from '../../entities/device.entity';

describe('StaleTokenListener', () => {
  let listener: StaleTokenListener;
  let mockDeviceRepo: any;

  beforeEach(async () => {
    mockDeviceRepo = {
      delete: jest.fn().mockResolvedValue({ affected: 2 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaleTokenListener,
        { provide: getRepositoryToken(Device), useValue: mockDeviceRepo },
      ],
    }).compile();

    listener = module.get<StaleTokenListener>(StaleTokenListener);
  });

  it('should delete stale tokens from database', async () => {
    await listener.handleStaleTokens({ tokens: ['stale-1', 'stale-2'] });
    expect(mockDeviceRepo.delete).toHaveBeenCalled();
    const deleteArg = mockDeviceRepo.delete.mock.calls[0][0];
    expect(deleteArg).toBeDefined();
  });

  it('should handle empty token list gracefully', async () => {
    await listener.handleStaleTokens({ tokens: [] });
    expect(mockDeviceRepo.delete).not.toHaveBeenCalled();
  });

  it('should log error and not throw on DB failure', async () => {
    mockDeviceRepo.delete.mockRejectedValue(new Error('DB unavailable'));
    await expect(
      listener.handleStaleTokens({ tokens: ['stale-1'] }),
    ).resolves.not.toThrow();
  });
});
