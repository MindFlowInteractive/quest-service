import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from '../admin-users.controller';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminAuditLogService } from '../../services/admin-audit-log.service';
import { UserRole } from '../../../auth/constants';

describe('AdminUsersController', () => {
    let controller: AdminUsersController;
    let adminUsersService: AdminUsersService;
    let auditLogService: AdminAuditLogService;

    const mockAdmin = { id: 'admin-id', email: 'admin@test.com' };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminUsersController],
            providers: [
                {
                    provide: AdminUsersService,
                    useValue: {
                        findAll: jest.fn(),
                        updateRole: jest.fn(),
                        updateStatus: jest.fn(),
                    },
                },
                {
                    provide: AdminAuditLogService,
                    useValue: {
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<AdminUsersController>(AdminUsersController);
        adminUsersService = module.get<AdminUsersService>(AdminUsersService);
        auditLogService = module.get<AdminAuditLogService>(AdminAuditLogService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('updateRole', () => {
        it('should call adminUsersService.updateRole and auditLogService.log', async () => {
            const userId = 'user-uuid';
            const newRole = UserRole.MODERATOR;
            (adminUsersService.updateRole as jest.Mock).mockResolvedValue({ id: userId, role: { name: newRole } });

            await controller.updateRole(userId, newRole, mockAdmin);

            expect(adminUsersService.updateRole).toHaveBeenCalledWith(userId, newRole);
            expect(auditLogService.log).toHaveBeenCalledWith({
                adminId: mockAdmin.id,
                action: 'UPDATE_USER_ROLE',
                targetType: 'USER',
                targetId: userId,
                details: { role: newRole },
            });
        });
    });
});
