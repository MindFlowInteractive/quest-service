import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentReport, ReportStatus, ReportPriority, ReportTargetType } from '../entities/content-report.entity';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { JwtService } from '@nestjs/jwt';

describe('Reports API (e2e)', () => {
  let app: INestApplication;
  let reportsRepository: Repository<ContentReport>;
  let usersRepository: Repository<User>;
  let jwtService: JwtService;

  let userToken: string;
  let moderatorToken: string;
  let adminToken: string;
  let testUser: User;
  let testModerator: User;
  let testAdmin: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    reportsRepository = moduleFixture.get<Repository<ContentReport>>(getRepositoryToken(ContentReport));
    usersRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test roles
    const roleRepository = moduleFixture.get<Repository<Role>>(getRepositoryToken(Role));
    const userRole = await roleRepository.save({ name: 'user', description: 'Regular user' });
    const moderatorRole = await roleRepository.save({ name: 'moderator', description: 'Moderator' });
    const adminRole = await roleRepository.save({ name: 'admin', description: 'Administrator' });

    // Create test users
    testUser = await usersRepository.save({
      email: 'test@example.com',
      password: 'password',
      isVerified: true,
      role: userRole,
    });

    testModerator = await usersRepository.save({
      email: 'moderator@example.com',
      password: 'password',
      isVerified: true,
      role: moderatorRole,
    });

    testAdmin = await usersRepository.save({
      email: 'admin@example.com',
      password: 'password',
      isVerified: true,
      role: adminRole,
    });

    // Generate tokens
    userToken = jwtService.sign({ sub: testUser.id, email: testUser.email });
    moderatorToken = jwtService.sign({ sub: testModerator.id, email: testModerator.email });
    adminToken = jwtService.sign({ sub: testAdmin.id, email: testAdmin.email });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await reportsRepository.delete({});
  });

  describe('POST /reports', () => {
    it('should create a new report', () => {
      return request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-123',
          reason: 'Inappropriate content',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('Report submitted successfully');
          expect(res.body.report.targetType).toBe(ReportTargetType.PUZZLE);
          expect(res.body.report.reason).toBe('Inappropriate content');
        });
    });

    it('should prevent duplicate reports from same user', async () => {
      // Create first report
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-123',
          reason: 'Inappropriate content',
        });

      // Try to create duplicate
      return request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-123',
          reason: 'Another reason',
        })
        .expect(400);
    });

    it('should increment priority for multiple reports on same target', async () => {
      // Create first report
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-123',
          reason: 'First report',
        });

      // Create second user and report
      const secondUser = await usersRepository.save({
        email: 'second@example.com',
        password: 'password',
        isVerified: true,
        role: await usersRepository.findOne({ where: { id: testUser.id } }).then(u => u.role),
      });

      const secondToken = jwtService.sign({ sub: secondUser.id, email: secondUser.email });

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${secondToken}`)
        .send({
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-123',
          reason: 'Second report',
        })
        .expect(201);

      expect(response.body.report.priority).toBe(ReportPriority.MEDIUM);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/reports')
        .send({
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-123',
          reason: 'Inappropriate content',
        })
        .expect(401);
    });
  });

  describe('GET /reports', () => {
    it('should return reports for moderators', async () => {
      // Create a test report
      await reportsRepository.save({
        reporterId: testUser.id,
        targetType: ReportTargetType.PUZZLE,
        targetId: 'puzzle-123',
        reason: 'Test report',
        priority: ReportPriority.LOW,
        status: ReportStatus.OPEN,
      });

      return request(app.getHttpServer())
        .get('/reports')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.reports).toHaveLength(1);
          expect(res.body.pagination.total).toBe(1);
        });
    });

    it('should deny access to regular users', () => {
      return request(app.getHttpServer())
        .get('/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should sort reports by priority descending', async () => {
      // Create reports with different priorities
      await reportsRepository.save([
        {
          reporterId: testUser.id,
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-1',
          reason: 'Low priority',
          priority: ReportPriority.LOW,
          status: ReportStatus.OPEN,
        },
        {
          reporterId: testUser.id,
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-2',
          reason: 'High priority',
          priority: ReportPriority.HIGH,
          status: ReportStatus.OPEN,
        },
      ]);

      return request(app.getHttpServer())
        .get('/reports')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.reports[0].priority).toBe(ReportPriority.HIGH);
          expect(res.body.reports[1].priority).toBe(ReportPriority.LOW);
        });
    });
  });

  describe('PATCH /reports/:id', () => {
    it('should allow moderators to update reports', async () => {
      const report = await reportsRepository.save({
        reporterId: testUser.id,
        targetType: ReportTargetType.PUZZLE,
        targetId: 'puzzle-123',
        reason: 'Test report',
        priority: ReportPriority.LOW,
        status: ReportStatus.OPEN,
      });

      return request(app.getHttpServer())
        .patch(`/reports/${report.id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          status: ReportStatus.RESOLVED,
          resolution: 'Content removed',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.report.status).toBe(ReportStatus.RESOLVED);
          expect(res.body.report.resolution).toBe('Content removed');
        });
    });

    it('should deny access to regular users', async () => {
      const report = await reportsRepository.save({
        reporterId: testUser.id,
        targetType: ReportTargetType.PUZZLE,
        targetId: 'puzzle-123',
        reason: 'Test report',
        priority: ReportPriority.LOW,
        status: ReportStatus.OPEN,
      });

      return request(app.getHttpServer())
        .patch(`/reports/${report.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: ReportStatus.RESOLVED,
          resolution: 'Content removed',
        })
        .expect(403);
    });
  });

  describe('GET /reports/stats', () => {
    it('should return statistics for admins', async () => {
      // Create test data
      await reportsRepository.save([
        {
          reporterId: testUser.id,
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-1',
          reason: 'Open report',
          priority: ReportPriority.LOW,
          status: ReportStatus.OPEN,
        },
        {
          reporterId: testUser.id,
          targetType: ReportTargetType.PLAYER,
          targetId: 'player-1',
          reason: 'Resolved report',
          priority: ReportPriority.LOW,
          status: ReportStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedBy: testModerator.id,
        },
      ]);

      return request(app.getHttpServer())
        .get('/reports/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.openCount).toBe(1);
          expect(res.body.totalReports).toBe(2);
          expect(res.body.reportsByType).toHaveProperty('puzzle');
          expect(res.body.reportsByType).toHaveProperty('player');
        });
    });

    it('should deny access to non-admins', () => {
      return request(app.getHttpServer())
        .get('/reports/stats')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);
    });
  });

  describe('Auto-escalation', () => {
    it('should auto-escalate when 5+ reports in 24 hours', async () => {
      // Create 5 reports quickly to trigger escalation
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const user = await usersRepository.save({
          email: `user${i}@example.com`,
          password: 'password',
          isVerified: true,
          role: await usersRepository.findOne({ where: { id: testUser.id } }).then(u => u.role),
        });

        const token = jwtService.sign({ sub: user.id, email: user.email });
        
        promises.push(
          request(app.getHttpServer())
            .post('/reports')
            .set('Authorization', `Bearer ${token}`)
            .send({
              targetType: ReportTargetType.PUZZLE,
              targetId: 'puzzle-escalation',
              reason: `Report ${i}`,
            })
        );
      }

      await Promise.all(promises);

      // Check that reports were escalated
      const escalatedReports = await reportsRepository.find({
        where: {
          targetType: ReportTargetType.PUZZLE,
          targetId: 'puzzle-escalation',
        },
      });

      expect(escalatedReports.length).toBe(5);
      expect(escalatedReports.every(r => r.priority === ReportPriority.CRITICAL)).toBe(true);
    });
  });
});
