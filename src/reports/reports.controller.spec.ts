import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ContentReport, ReportStatus, ReportPriority, ReportTargetType } from './entities/content-report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportStatsDto } from './dto/report-stats.dto';
import { UserRole } from '../auth/constants';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: { name: UserRole.USER },
  };

  const mockModerator = {
    id: 'moderator-123',
    email: 'moderator@example.com',
    role: { name: UserRole.MODERATOR },
  };

  const mockAdmin = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: { name: UserRole.ADMIN },
  };

  const mockReport: ContentReport = {
    id: 'report-123',
    reporterId: 'user-123',
    targetType: ReportTargetType.PUZZLE,
    targetId: 'puzzle-123',
    reason: 'Inappropriate content',
    priority: ReportPriority.LOW,
    status: ReportStatus.OPEN,
    createdAt: new Date(),
    updatedAt: new Date(),
    reporter: mockUser as any,
  };

  const mockReportsService = {
    createReport: jest.fn(),
    getReports: jest.fn(),
    updateReport: jest.fn(),
    getReportStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReport', () => {
    it('should create a new report', async () => {
      const createReportDto: CreateReportDto = {
        targetType: ReportTargetType.PUZZLE,
        targetId: 'puzzle-123',
        reason: 'Inappropriate content',
      };

      mockReportsService.createReport.mockResolvedValue(mockReport);

      const result = await controller.createReport({ user: mockUser }, createReportDto);

      expect(service.createReport).toHaveBeenCalledWith(mockUser.id, createReportDto);
      expect(result).toEqual({
        message: 'Report submitted successfully',
        report: mockReport,
      });
    });
  });

  describe('getReports', () => {
    it('should return paginated reports for moderators', async () => {
      const mockReports = [mockReport];
      const mockTotal = 1;

      mockReportsService.getReports.mockResolvedValue({
        reports: mockReports,
        total: mockTotal,
      });

      const result = await controller.getReports(1, 20);

      expect(service.getReports).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual({
        reports: mockReports,
        pagination: {
          page: 1,
          limit: 20,
          total: mockTotal,
          totalPages: 1,
        },
      });
    });

    it('should use default pagination values', async () => {
      mockReportsService.getReports.mockResolvedValue({
        reports: [],
        total: 0,
      });

      await controller.getReports(undefined, undefined);

      expect(service.getReports).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('updateReport', () => {
    it('should update report status and resolution', async () => {
      const updateReportDto: UpdateReportDto = {
        status: ReportStatus.RESOLVED,
        resolution: 'Content removed',
      };

      const updatedReport = { ...mockReport, ...updateReportDto };
      mockReportsService.updateReport.mockResolvedValue(updatedReport);

      const result = await controller.updateReport('report-123', updateReportDto, { user: mockModerator });

      expect(service.updateReport).toHaveBeenCalledWith('report-123', updateReportDto, mockModerator.id);
      expect(result).toEqual({
        message: 'Report updated successfully',
        report: updatedReport,
      });
    });
  });

  describe('getStats', () => {
    it('should return report statistics', async () => {
      const mockStats: ReportStatsDto = {
        openCount: 5,
        averageResolutionTime: 3600,
        reportsByType: {
          puzzle: 3,
          player: 2,
        },
        totalReports: 10,
        resolvedToday: 2,
        escalatedReports: 1,
      };

      mockReportsService.getReportStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(service.getReportStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });
});
