import { Module, Global } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TerminusModule } from "@nestjs/terminus"
import { PrometheusModule } from "@willsoto/nestjs-prometheus"
import { LoggingService } from "./services/logging.service"
import { MonitoringService } from "./services/monitoring.service"
import { HealthService } from "./services/health.service"
import { AlertingService } from "./services/alerting.service"
import { MetricsService } from "./services/metrics.service"
import { PerformanceService } from "./services/performance.service"
import { LoggingInterceptor } from "./interceptors/logging.interceptor"
import { PerformanceInterceptor } from "./interceptors/performance.interceptor"
import { LoggingMiddleware } from "./middleware/logging.middleware"
import { CorrelationMiddleware } from "./middleware/correlation.middleware"
import { HealthController } from "./controllers/health.controller"
import { MetricsController } from "./controllers/metrics.controller"
import { loggingConfig } from "./config/logging.config"

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(loggingConfig),
    TerminusModule,
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: "nestjs_",
        },
      },
    }),
  ],
  providers: [
    LoggingService,
    MonitoringService,
    HealthService,
    AlertingService,
    MetricsService,
    PerformanceService,
    LoggingInterceptor,
    PerformanceInterceptor,
    LoggingMiddleware,
    CorrelationMiddleware,
  ],
  controllers: [HealthController, MetricsController],
  exports: [
    LoggingService,
    MonitoringService,
    HealthService,
    AlertingService,
    MetricsService,
    PerformanceService,
    LoggingInterceptor,
    PerformanceInterceptor,
    LoggingMiddleware,
    CorrelationMiddleware,
  ],
})
export class LoggingModule {}
