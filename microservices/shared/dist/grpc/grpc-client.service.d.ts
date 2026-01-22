import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import { GrpcServiceOptions } from '../interfaces';
export declare class GrpcClientService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private clients;
    private packageDefinitions;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private loadProtoFiles;
    createClient(serviceName: string, options: GrpcServiceOptions): any;
    getClient(serviceName: string): any;
    private getServiceConstructor;
    callWithTimeout<T>(client: any, methodName: string, request: any, timeout?: number): Promise<T>;
    createStream<T>(client: any, methodName: string, request: any): grpc.ClientReadableStream<T>;
}
