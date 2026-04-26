import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportsService } from './reports.service';
import { ContentReport, ReportStatus, ReportPriority, ReportTargetType } from './entities/content-report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: Repository<ContentReport>;
  let eventEmitter: EventEmitter2;

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
  };

  const mockRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(ContentReport),
          useValue: mockRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    repository = module.get<Repository<ContentReport>>(getRepositoryToken(ContentReport));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReport', () => {
    it('should create a new report successfully', async () => {
      const createReportDto: CreateReportDto = {
        targetType: ReportTargetType.PUZZLE,
        targetId: 'puzzle-123',
        reason: 'Inappropriate content',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.count.mockResolvedValue(0);
      mockRepository.create.mockReturnValue(mockReport);
      mockRepository.save.mockResolvedValue(mockReport);

      const result = await service.createReport('user-123', createReportDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          reporterId: 'user-123',
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-123',
          status: ReportStatus.OPEN,
        },
      });
      expect(result).toEqual(mockReport);
    });

    it('should throw BadRequestException for duplicate reports', async () => {
      const createReportDto: CreateReportDto = {
        targetType: ReportTargetType.PUZZLE,
        targetId: 'puzzle-123',
        reason: 'Inappropriate content',
      };

      mockRepository.findOne.mockResolvedValue(mockReport);

      await expect(service.createReport('user-123', createReportDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should set priority to MEDIUM when 1 report exists', async () => {
      const createReportDto: CreateReportDto = {
        targetType: ReportTargetType.PUZZLE,
        targetId: 'puzzle-123',
        reason: 'Inappropriate content',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.count.mockResolvedValue(1);
      mockRepository.create.mockReturnValue({ ...mockReport, priority: ReportPriority.MEDIUM });
      mockRepository.save.mockResolvedValue({ ...mockReport, priority: ReportPriority.MEDIUM });

      const result = await service.createReport('user-123', createReportDto);

      expect(result.priority).toBe(ReportPriority.MEDIUM);
    });

    it('should set priority to HIGH when 3+ reports exist', async () => {
      const createReportDto: CreateReportDto = {
        targetType: ReportTargetType.PUZZLE,
        targetId: 'puzzle-123',
        reason: 'Inappropriate content',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.count.mockResolvedValue(3);
      mockRepository.create.mockReturnValue({ ...mockReport, priority: ReportPriority.HIGH });
      mockRepository.save.mockResolvedValue({ ...mockReport, priority: ReportPriority.HIGH });

      const result = await service.createReport('user-123', createReportDto);

      expect(result.priority).toBe(ReportPriority.HIGH);
    });

    it('should auto-escalate to CRITICAL when 5+ reports in 24h', async () => {
      const createReportDto: CreateReportDto = {
        targetType: ReportTargetType.PUZZLE,
        targetId: 'puzzle-123',
        reason: 'Inappropriate content',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.count
        .mockResolvedValueOnce(4) // existing reports count
        .mockResolvedValueOnce(5); // recent reports count (24h)
      mockRepository.create.mockReturnValue({ ...mockReport, priority: ReportPriority.CRITICAL });
      mockRepository.save.mockResolvedValue({ ...mockReport, priority: ReportPriority.CRITICAL });

      const result = await service.createReport('user-123', createReportDto);

      expect(result.priority).toBe(ReportPriority.CRITICAL);
      expect(repository.update).toHaveBeenCalled();
    });
  });

  describe('getReports', () => {
    it('should return paginated reports sorted by priority', async () => {
      const mockReports = [mockReport];
      mockRepository.findAndCount.mockResolvedValue([mockReports, 1]);

      const result = await service.getReports(1, 20);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        relations: ['reporter'],
        order: {
          priority: 'DESC',
          createdAt: 'DESC',
        },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({
        reports: mockReports,
        total: 1,
      });
    });
  });

  describe('updateReport', () => {
    it('should update report status and resolution', async () => {
      const updateReportDto: UpdateReportDto = {
        status: ReportStatus.RESOLVED,
        resolution: 'Content removed',
      };

      mockRepository.findOne.mockResolvedValue(mockReport);
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findOne.mockResolvedValue({
        ...mockReport,
        ...updateReportDto,
        resolvedAt: new Date(),
        resolvedBy: 'moderator-123',
      });

      const result = await service.updateReport('report-123', updateReportDto, 'moderator-123');

      expect(repository.update).toHaveBeenCalledWith('report-123', {
        status: ReportStatus.RESOLVED,
        resolution: 'Content removed',
        resolvedAt: expect.any(Date),
        resolvedBy: 'moderator-123',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('report.resolved', {
        report: expect.any(Object),
        resolution: 'Content removed',
      });
    });

    it('should throw NotFoundException for non-existent report', async () => {
      const updateReportDto: UpdateReportDto = {
        status: ReportStatus.RESOLVED,
        resolution: 'Content removed',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateReport('non-existent', updateReportDto, 'moderator-123')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getReportStats', () => {
    it('should return comprehensive statistics', async () => {
      mockRepository.count
        .mockResolvedValueOnce(5) // open reports
        .mockResolvedValueOnce(10) // total reports
        .mockResolvedValueOnce(2) // resolved today
        .mockResolvedValueOnce(1); // escalated reports

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: 'puzzle', count: '3' },
          { type: 'player', count: '2' },
        ]),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgTime: '3600' }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getReportStats();

      expect(result).toEqual({
        openCount: 5,
        averageResolutionTime: 3600,
        reportsByType: { puzzle: 3, player: 2 },
        totalReports: 10,
        resolvedToday: 2,
        escalatedReports: 1,
      });
    });
  });
});
