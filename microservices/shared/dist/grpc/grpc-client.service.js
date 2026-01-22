"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const grpc = require("@grpc/grpc-js");
const proto_loader_1 = require("@grpc/proto-loader");
let GrpcClientService = class GrpcClientService {
    constructor(configService) {
        this.configService = configService;
        this.clients = new Map();
        this.packageDefinitions = new Map();
    }
    async onModuleInit() {
        await this.loadProtoFiles();
    }
    async onModuleDestroy() {
        for (const [serviceName, client] of this.clients) {
            try {
                if (client.close) {
                    client.close();
                }
            }
            catch (error) {
                console.error(`Error closing gRPC client for ${serviceName}:`, error);
            }
        }
        this.clients.clear();
    }
    async loadProtoFiles() {
        const protoPath = this.configService.get('PROTO_PATH', './proto');
        const socialProtoPath = `${protoPath}/social.proto`;
        const socialPackageDefinition = (0, proto_loader_1.loadSync)(socialProtoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        this.packageDefinitions.set('social', socialPackageDefinition);
        const notificationProtoPath = `${protoPath}/notification.proto`;
        const notificationPackageDefinition = (0, proto_loader_1.loadSync)(notificationProtoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        this.packageDefinitions.set('notification', notificationPackageDefinition);
    }
    createClient(serviceName, options) {
        const packageDefinition = this.packageDefinitions.get(options.package);
        if (!packageDefinition) {
            throw new Error(`Proto package ${options.package} not found`);
        }
        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
        const ServiceConstructor = this.getServiceConstructor(protoDescriptor, options.package, options.protoPath);
        const credentials = options.credentials || grpc.credentials.createInsecure();
        const client = new ServiceConstructor(options.url, credentials);
        this.clients.set(serviceName, client);
        return client;
    }
    getClient(serviceName) {
        const client = this.clients.get(serviceName);
        if (!client) {
            throw new Error(`gRPC client ${serviceName} not found`);
        }
        return client;
    }
    getServiceConstructor(protoDescriptor, packageName, protoPath) {
        const parts = protoPath.split('.');
        let service = protoDescriptor[packageName];
        for (const part of parts) {
            if (service && service[part]) {
                service = service[part];
            }
        }
        if (!service) {
            throw new Error(`Service ${protoPath} not found in proto package ${packageName}`);
        }
        return service;
    }
    async callWithTimeout(client, methodName, request, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const deadline = Date.now() + timeout;
            client[methodName](request, { deadline }, (error, response) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(response);
                }
            });
        });
    }
    createStream(client, methodName, request) {
        return client[methodName](request);
    }
};
exports.GrpcClientService = GrpcClientService;
exports.GrpcClientService = GrpcClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GrpcClientService);
//# sourceMappingURL=grpc-client.service.js.map