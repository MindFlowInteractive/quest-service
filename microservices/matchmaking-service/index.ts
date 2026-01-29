// src/index.ts
import 'reflect-metadata';
import express from 'express';
import { HealthController } from './src/health/health.controller';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health endpoints
const healthController = new HealthController();
app.get('/health', (req, res) => healthController.checkHealth(req, res));
app.get('/health/metrics', (req, res) => healthController.getMetrics(req, res));
app.get('/health/connections', (req, res) =>
  healthController.getConnectionStats(req, res),
);

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  try {
    const databaseService = DatabaseService.getInstance();
    await databaseService.close();
    console.log('Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

async function startServer() {
  try {
    // Initialize database
    const databaseService = DatabaseService.getInstance();
    await databaseService.initialize();

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`Metrics: http://localhost:${port}/health/metrics`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);

    // Retry connection
    try {
      const databaseService = DatabaseService.getInstance();
      await databaseService.retryConnection();
      console.log('Database connection retry successful');

      app.listen(port, () => {
        console.log(`Server running on port ${port} (after retry)`);
      });
    } catch (retryError) {
      console.error(
        'Failed to establish database connection after retries:',
        retryError,
      );
      process.exit(1);
    }
  }
}

startServer();
