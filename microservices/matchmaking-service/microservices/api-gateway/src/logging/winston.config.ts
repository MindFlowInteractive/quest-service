import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        let msg = `${timestamp} [${level}] ${context ? `[${context}]` : ''} ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    }),
);

export const winstonConfig = {
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.LOG_LEVEL || 'info',
        }),
        new DailyRotateFile({
            filename: 'logs/api-gateway-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat,
            level: 'info',
        }),
        new DailyRotateFile({
            filename: 'logs/api-gateway-error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            format: logFormat,
            level: 'error',
        }),
    ],
};
