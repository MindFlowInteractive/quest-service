import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';
import { Environment, EnvironmentVariables } from './env.validation';

export const createLoggerConfig = (
  configService: ConfigService<EnvironmentVariables>,
): WinstonModuleOptions => {
  const env = configService.get('NODE_ENV', { infer: true });
  const logLevel = configService.get('LOG_LEVEL', { infer: true });

  const isDevelopment = env === Environment.Development;

  return {
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
      ...(isDevelopment
        ? [
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(
              ({ timestamp, level, message, context, stack }) => {
                const contextStr = context ? `[${context}]` : '';
                const stackStr = stack ? `\n${stack}` : '';
                return `${timestamp} [${level}] ${contextStr} ${message}${stackStr}`;
              },
            ),
          ]
        : []),
    ),
    transports: [
      new winston.transports.Console({
        silent: env === Environment.Test,
      }),
      ...(env === Environment.Production
        ? [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
            }),
          ]
        : []),
    ],
  };
};
