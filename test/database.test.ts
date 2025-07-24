// tests/database.test.ts

describe('Database Service', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';

    databaseService = DatabaseService.getInstance();
    await databaseService.initialize();
  });

  afterAll(async () => {
    await databaseService.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    const dataSource = databaseService.getDataSource();
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
    }
  });

  describe('Connection Management', () => {
    it('should connect to database successfully', async () => {
      const dataSource = databaseService.getDataSource();
      expect(dataSource.isInitialized).toBe(true);
    });

    it('should perform health check', async () => {
      const health: DatabaseHealth = await databaseService.checkHealth();

      expect(health.status).toBe('healthy');
      expect(health.connection).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it('should get connection stats', async () => {
      const stats = await databaseService.getConnectionStats();

      expect(stats.totalConnections).toBeGreaterThanOrEqual(0);
      expect(stats.activeConnections).toBeGreaterThanOrEqual(0);
      expect(stats.idleConnections).toBeGreaterThanOrEqual(0);
      expect(stats.waitingConnections).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration', () => {
    it('should use test database configuration', () => {
      const configService = DatabaseConfigService.getInstance();
      const config = configService.getConfig();

      expect(config.database).toContain('test');
      expect(config.port).toBe(5433); // Test database port
    });

    it('should have proper connection pooling settings', () => {
      const configService = DatabaseConfigService.getInstance();
      const config = configService.getConfig();

      expect(config.maxConnections).toBeGreaterThan(0);
      expect(config.minConnections).toBeGreaterThan(0);
      expect(config.maxConnections).toBeGreaterThanOrEqual(
        config.minConnections,
      );
    });
  });

  describe('Migration System', () => {
    it('should run migrations successfully', async () => {
      await expect(databaseService.runMigrations()).resolves.not.toThrow();
    });

    it('should revert migrations successfully', async () => {
      // First run migrations
      await databaseService.runMigrations();

      // Then revert
      await expect(databaseService.revertMigration()).resolves.not.toThrow();
    });
  });
});
