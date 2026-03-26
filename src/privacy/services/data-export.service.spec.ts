import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { DataExportService } from './data-export.service';
import { DataExportRequest, ExportStatus, ExportFormat } from '../entities/data-export-request.entity';
import { DataAccessAudit } from '../entities/data-access-audit.entity';
import { DataExportRequestDto } from '../dto/data-export-request.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const makeRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  findAndCount: jest.fn(),
});

const makeEmitter = () => ({
  emit: jest.fn(),
  emitAsync: jest.fn().mockResolvedValue([null]),
});

const makeConfig = (overrides: Record<string, any> = {}) => ({
  get: jest.fn((key: string, def?: any) => {
    const map: Record<string, any> = {
      DATA_EXPORT_EXPIRATION_HOURS: 24,
      EXPORT_STORAGE_DIR: path.join(os.tmpdir(), 'test-exports'),
      ...overrides,
    };
    return key in map ? map[key] : def;
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// DataExportService
// ─────────────────────────────────────────────────────────────────────────────

describe('DataExportService', () => {
  let service: DataExportService;
  let exportRepo: ReturnType<typeof makeRepo>;
  let auditRepo: ReturnType<typeof makeRepo>;
  let emitter: ReturnType<typeof makeEmitter>;

  const tmpDir = path.join(os.tmpdir(), 'test-exports');

  beforeEach(async () => {
    exportRepo = makeRepo();
    auditRepo = makeRepo();
    emitter = makeEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataExportService,
        { provide: getRepositoryToken(DataExportRequest), useValue: exportRepo },
        { provide: getRepositoryToken(DataAccessAudit), useValue: auditRepo },
        { provide: EventEmitter2, useValue: emitter },
        { provide: ConfigService, useValue: makeConfig() },
      ],
    }).compile();

    service = module.get<DataExportService>(DataExportService);
    fs.mkdirSync(tmpDir, { recursive: true });
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up tmp files
    try {
      fs.readdirSync(tmpDir).forEach((f) => fs.unlinkSync(path.join(tmpDir, f)));
    } catch { /* ignore */ }
  });

  // ───────── Export queuing ─────────────────────────────────────────────────

  describe('requestExport', () => {
    it('should queue an export job and return PENDING status', async () => {
      exportRepo.findOne.mockResolvedValue(null); // no existing pending
      const pendingRecord = { id: 'exp-1', status: ExportStatus.PENDING };
      exportRepo.create.mockReturnValue(pendingRecord);
      exportRepo.save.mockResolvedValue(pendingRecord);
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const dto: DataExportRequestDto = { format: ExportFormat.JSON };
      const result = await service.requestExport('user-1', dto);

      expect(result.status).toBe(ExportStatus.PENDING);
      expect(exportRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should create an audit log entry when queuing', async () => {
      exportRepo.findOne.mockResolvedValue(null);
      const rec = { id: 'exp-2', status: ExportStatus.PENDING };
      exportRepo.create.mockReturnValue(rec);
      exportRepo.save.mockResolvedValue(rec);
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      await service.requestExport('user-1', {});

      expect(auditRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should reject if a PENDING export already exists', async () => {
      exportRepo.findOne.mockResolvedValue({ id: 'existing', status: ExportStatus.PENDING });

      await expect(service.requestExport('user-1', {})).rejects.toThrow(
        'already have a pending export',
      );
    });

    it('should emit privacy.data_export_completed after processing', async () => {
      // Provide all needed mocks for full processExport path
      exportRepo.findOne.mockResolvedValue(null);
      const rec = { id: 'exp-3', status: ExportStatus.PENDING };
      exportRepo.create.mockReturnValue(rec);
      exportRepo.save.mockResolvedValue(rec);
      exportRepo.update.mockResolvedValue({});
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});
      emitter.emitAsync.mockResolvedValue([null]);

      await service.requestExport('user-3', {});

      // Allow the setImmediate async task to flush
      await new Promise((r) => setTimeout(r, 100));

      expect(emitter.emit).toHaveBeenCalledWith(
        'privacy.data_export_completed',
        expect.objectContaining({ userId: 'user-3', exportId: 'exp-3' }),
      );
    });
  });

  // ───────── Archive completeness ───────────────────────────────────────────

  describe('gatherUserData', () => {
    it('should include all required top-level sections', async () => {
      emitter.emitAsync.mockImplementation(async (event: string, payload: any) => {
        if (event === 'privacy.gather.profile') {
          return [{ email: 'a@b.com', username: 'alice', createdAt: new Date().toISOString() }];
        }
        if (event === 'privacy.gather.achievements') return [['ach1']];
        if (event === 'privacy.gather.sessions') return [['sess1']];
        if (event === 'privacy.gather.wallet') {
          return [{ addresses: ['ADDR1'], balanceHistory: [] }];
        }
        if (event === 'privacy.gather.friends') {
          return [{ friends: ['friend1'], friendRequests: [] }];
        }
        if (event === 'privacy.gather.notifications') {
          return [{ preferences: { email: true }, history: [] }];
        }
        if (event === 'privacy.gather.privacySettings') return [{ profilePublic: false }];
        if (event === 'privacy.gather.consentHistory') return [[{ type: 'analytics', granted: true }]];
        return [null];
      });

      const data = await service.gatherUserData('user-archive');

      // Core identity
      expect(data.userId).toBe('user-archive');
      expect(data.version).toBeDefined();
      expect(data.exportDate).toBeDefined();

      // Personal info
      expect(data.personalInfo.email).toBe('a@b.com');
      expect(data.personalInfo.username).toBe('alice');

      // All required sections present
      expect(data.gameData).toBeDefined();
      expect(data.wallet).toBeDefined();
      expect(data.wallet!.addresses).toContain('ADDR1');
      expect(data.socialData).toBeDefined();
      expect(data.socialData!.friends).toContain('friend1');
      expect(data.notifications).toBeDefined();
      expect(data.notifications!.preferences).toBeDefined();
      expect(data.privacySettings).toBeDefined();
      expect(data.consentHistory).toBeDefined();
    });
  });

  // ───────── Download with TTL ───────────────────────────────────────────────

  describe('downloadExport', () => {
    it('should throw if export is not COMPLETED', async () => {
      exportRepo.findOne.mockResolvedValue({
        id: 'exp-dl',
        userId: 'u1',
        status: ExportStatus.PROCESSING,
      });

      await expect(service.downloadExport('exp-dl', 'u1')).rejects.toThrow(
        'not ready for download',
      );
    });

    it('should throw if export has expired', async () => {
      exportRepo.findOne.mockResolvedValue({
        id: 'exp-dl',
        userId: 'u1',
        status: ExportStatus.COMPLETED,
        expiresAt: new Date(Date.now() - 1000), // past
        downloadCount: 0,
      });
      exportRepo.update.mockResolvedValue({});

      await expect(service.downloadExport('exp-dl', 'u1')).rejects.toThrow(
        'expired',
      );
    });
  });
});
