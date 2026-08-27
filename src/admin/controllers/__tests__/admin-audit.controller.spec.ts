import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuditController } from '../admin-audit.controller';
import { AdminAuditLogService } from '../../services/admin-audit-log.service';

describe('AdminAuditController', () => {
  let controller: AdminAuditController;
  const auditLogService = { getLogs: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuditController],
      providers: [{ provide: AdminAuditLogService, useValue: auditLogService }],
    }).compile();

    controller = module.get(AdminAuditController);
    auditLogService.getLogs.mockResolvedValue([[], 0]);
  });

  it('returns filtered and bounded audit logs', async () => {
    await controller.getLogs(
      'admin-1',
      'UPDATE_USER_ROLE',
      'USER',
      '2026-01-01T00:00:00.000Z',
      undefined,
      '500',
      '-4',
    );

    expect(auditLogService.getLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        action: 'UPDATE_USER_ROLE',
        targetType: 'USER',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
      }),
      100,
      0,
    );
  });
});
