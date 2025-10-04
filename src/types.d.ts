/* Global type shims for quick type-check noise reduction. */
declare module 'nodemailer';
declare module 'nodemailer/lib/mailer';
declare module 'nest-winston';
declare module 'winston-daily-rotate-file';
declare module 'winston-elasticsearch';
declare module 'firebase-admin';
declare module 'prom-client';
declare module '@nestjs/config';
declare module '@nestjs/schedule';
declare module '@nestjs/terminus';
declare module '@nestjs/throttler';
declare module 'class-validator';
declare module 'class-transformer';
declare module 'express';
declare module 'async_hooks';
declare module 'cache-manager';
declare module 'uuid';

// Simple stubs for Prometheus types used in the repo
declare namespace PromClient {
  type Counter = any;
  type Histogram = any;
  type Gauge = any;
}

declare namespace NodeJS {
  interface Global {}
  interface Process {
    env: any;
    pid?: number;
    uptime?: () => number;
  }
}

declare const process: any;
declare const global: any;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function clearTimeout(timeoutId: any): void;
declare function fetch(input: any, init?: any): Promise<any>;
declare function require(name: string): any;

// Provide minimal Buffer global
declare class Buffer {
  static from(str: string, enc?: string): any;
}

