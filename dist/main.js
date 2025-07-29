/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(3);
const nest_winston_1 = __webpack_require__(4);
const helmet_1 = __importDefault(__webpack_require__(5));
const app_module_1 = __webpack_require__(6);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const logger = app.get(nest_winston_1.WINSTON_MODULE_NEST_PROVIDER);
    app.useLogger(logger);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port') || 3000;
    const apiPrefix = configService.get('app.apiPrefix') || 'api/v1';
    const corsOrigin = configService.get('app.cors.origin') || 'http://localhost:3000';
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.setGlobalPrefix(apiPrefix);
    await app.listen(port);
    logger.log(`🚀 LogiQuest Backend is running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
}
bootstrap().catch((error) => {
    common_1.Logger.error('Failed to start the application', error);
    process.exit(1);
});


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("helmet");

/***/ }),
/* 6 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(3);
const throttler_1 = __webpack_require__(7);
const core_1 = __webpack_require__(1);
const nest_winston_1 = __webpack_require__(4);
const app_controller_1 = __webpack_require__(8);
const app_service_1 = __webpack_require__(9);
const env_validation_1 = __webpack_require__(10);
const app_config_1 = __importDefault(__webpack_require__(13));
const logger_config_1 = __webpack_require__(14);
const users_module_1 = __webpack_require__(16);
const puzzles_module_1 = __webpack_require__(22);
const health_module_1 = __webpack_require__(39);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validate: env_validation_1.validateEnvironment,
                load: [app_config_1.default],
                envFilePath: ['.env.local', '.env'],
            }),
            nest_winston_1.WinstonModule.forRootAsync({
                useFactory: (configService) => (0, logger_config_1.createLoggerConfig)(configService),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                useFactory: (configService) => [
                    {
                        ttl: configService.get('app.throttle.ttl') || 60000,
                        limit: configService.get('app.throttle.limit') || 100,
                    },
                ],
                inject: [config_1.ConfigService],
            }),
            users_module_1.UsersModule,
            puzzles_module_1.PuzzlesModule,
            health_module_1.HealthModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);


/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/throttler");

/***/ }),
/* 8 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const common_1 = __webpack_require__(2);
const app_service_1 = __webpack_require__(9);
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
    getAppInfo() {
        return this.appService.getAppInfo();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getAppInfo", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof app_service_1.AppService !== "undefined" && app_service_1.AppService) === "function" ? _a : Object])
], AppController);


/***/ }),
/* 9 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(3);
let AppService = class AppService {
    constructor(configService) {
        this.configService = configService;
    }
    getHello() {
        return {
            message: 'Welcome to LogiQuest Backend API! 🧩',
            timestamp: new Date().toISOString(),
        };
    }
    getAppInfo() {
        return {
            name: 'LogiQuest Backend',
            version: this.configService.get('npm_package_version', '1.0.0'),
            environment: this.configService.get('NODE_ENV', 'development'),
            apiPrefix: this.configService.get('API_PREFIX', 'api/v1'),
            description: 'A puzzle-solving game backend built with NestJS',
        };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], AppService);


/***/ }),
/* 10 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EnvironmentVariables = exports.Environment = void 0;
exports.validateEnvironment = validateEnvironment;
const class_validator_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(12);
var Environment;
(function (Environment) {
    Environment["Development"] = "development";
    Environment["Production"] = "production";
    Environment["Test"] = "test";
})(Environment || (exports.Environment = Environment = {}));
class EnvironmentVariables {
    constructor() {
        this.NODE_ENV = Environment.Development;
        this.PORT = 3000;
        this.API_PREFIX = 'api/v1';
        this.CORS_ORIGIN = 'http://localhost:3000';
        this.THROTTLE_TTL = 60000;
        this.THROTTLE_LIMIT = 100;
        this.LOG_LEVEL = 'info';
        this.JWT_EXPIRES_IN = '1d';
    }
}
exports.EnvironmentVariables = EnvironmentVariables;
__decorate([
    (0, class_validator_1.IsEnum)(Environment),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "NODE_ENV", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "PORT", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "API_PREFIX", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CORS_ORIGIN", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "THROTTLE_TTL", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "THROTTLE_LIMIT", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "LOG_LEVEL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "DATABASE_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_EXPIRES_IN", void 0);
function validateEnvironment(config) {
    const validatedConfig = (0, class_transformer_1.plainToInstance)(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = (0, class_validator_1.validateSync)(validatedConfig, {
        skipMissingProperties: false,
    });
    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const config_1 = __webpack_require__(3);
exports["default"] = (0, config_1.registerAs)('app', () => ({
    name: 'LogiQuest Backend',
    version: process.env.npm_package_version || '1.0.0',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    },
}));


/***/ }),
/* 14 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createLoggerConfig = void 0;
const winston = __importStar(__webpack_require__(15));
const env_validation_1 = __webpack_require__(10);
const createLoggerConfig = (configService) => {
    const env = configService.get('NODE_ENV', { infer: true });
    const logLevel = configService.get('LOG_LEVEL', { infer: true });
    const isDevelopment = env === env_validation_1.Environment.Development;
    return {
        level: logLevel,
        format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json(), ...(isDevelopment
            ? [
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.printf(({ timestamp, level, message, context, stack }) => {
                    const contextStr = context ? `[${context}]` : '';
                    const stackStr = stack ? `\n${stack}` : '';
                    return `${timestamp} [${level}] ${contextStr} ${message}${stackStr}`;
                }),
            ]
            : [])),
        transports: [
            new winston.transports.Console({
                silent: env === env_validation_1.Environment.Test,
            }),
            ...(env === env_validation_1.Environment.Production
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
exports.createLoggerConfig = createLoggerConfig;


/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 16 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersModule = void 0;
const common_1 = __webpack_require__(2);
const users_service_1 = __webpack_require__(17);
const users_controller_1 = __webpack_require__(18);
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        controllers: [users_controller_1.UsersController],
        providers: [users_service_1.UsersService],
    })
], UsersModule);


/***/ }),
/* 17 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersService = void 0;
const common_1 = __webpack_require__(2);
let UsersService = class UsersService {
    create(createUserDto) {
        return 'This action adds a new user';
    }
    findAll() {
        return `This action returns all users`;
    }
    findOne(id) {
        return `This action returns a user with id #${id}`;
    }
    update(id, updateUserDto) {
        return `This action updates a user with id #${id}`;
    }
    remove(id) {
        return `This action removes a user with id #${id}`;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);


/***/ }),
/* 18 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersController = void 0;
const common_1 = __webpack_require__(2);
const users_service_1 = __webpack_require__(17);
const create_user_dto_1 = __webpack_require__(19);
const update_user_dto_1 = __webpack_require__(20);
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    create(createUserDto) {
        return this.usersService.create(createUserDto);
    }
    findAll() {
        return this.usersService.findAll();
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    update(id, updateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }
    remove(id) {
        return this.usersService.remove(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_user_dto_1.CreateUserDto !== "undefined" && create_user_dto_1.CreateUserDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof update_user_dto_1.UpdateUserDto !== "undefined" && update_user_dto_1.UpdateUserDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object])
], UsersController);


/***/ }),
/* 19 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateUserDto = void 0;
const class_validator_1 = __webpack_require__(11);
class CreateUserDto {
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateUserDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "lastName", void 0);


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateUserDto = void 0;
const mapped_types_1 = __webpack_require__(21);
const create_user_dto_1 = __webpack_require__(19);
class UpdateUserDto extends (0, mapped_types_1.PartialType)(create_user_dto_1.CreateUserDto) {
}
exports.UpdateUserDto = UpdateUserDto;


/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("@nestjs/mapped-types");

/***/ }),
/* 22 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzlesModule = void 0;
const common_1 = __webpack_require__(2);
const typeorm_1 = __webpack_require__(23);
const puzzles_service_1 = __webpack_require__(24);
const puzzles_controller_1 = __webpack_require__(38);
const puzzle_entity_1 = __webpack_require__(26);
const puzzle_progress_entity_1 = __webpack_require__(27);
const puzzle_rating_entity_1 = __webpack_require__(28);
let PuzzlesModule = class PuzzlesModule {
};
exports.PuzzlesModule = PuzzlesModule;
exports.PuzzlesModule = PuzzlesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                puzzle_entity_1.Puzzle,
                puzzle_progress_entity_1.PuzzleProgress,
                puzzle_rating_entity_1.PuzzleRating
            ])
        ],
        controllers: [puzzles_controller_1.PuzzlesController],
        providers: [puzzles_service_1.PuzzlesService],
        exports: [puzzles_service_1.PuzzlesService]
    })
], PuzzlesModule);


/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("@nestjs/typeorm");

/***/ }),
/* 24 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PuzzlesService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzlesService = void 0;
const common_1 = __webpack_require__(2);
const typeorm_1 = __webpack_require__(23);
const typeorm_2 = __webpack_require__(25);
const puzzle_entity_1 = __webpack_require__(26);
const puzzle_progress_entity_1 = __webpack_require__(27);
const puzzle_rating_entity_1 = __webpack_require__(28);
const dto_1 = __webpack_require__(33);
let PuzzlesService = PuzzlesService_1 = class PuzzlesService {
    constructor(puzzleRepository, progressRepository, ratingRepository) {
        this.puzzleRepository = puzzleRepository;
        this.progressRepository = progressRepository;
        this.ratingRepository = ratingRepository;
        this.logger = new common_1.Logger(PuzzlesService_1.name);
    }
    async create(createPuzzleDto, createdBy) {
        try {
            const puzzleData = {
                title: createPuzzleDto.title,
                description: createPuzzleDto.description,
                category: createPuzzleDto.category,
                difficulty: createPuzzleDto.difficulty,
                difficultyRating: createPuzzleDto.difficultyRating,
                basePoints: createPuzzleDto.basePoints,
                timeLimit: createPuzzleDto.timeLimit,
                maxHints: createPuzzleDto.maxHints,
                content: createPuzzleDto.content,
                hints: createPuzzleDto.hints || [],
                tags: createPuzzleDto.tags || [],
                prerequisites: createPuzzleDto.prerequisites || [],
                scoring: createPuzzleDto.scoring || {},
                isFeatured: createPuzzleDto.isFeatured || false,
                createdBy,
                publishedAt: undefined,
                analytics: {
                    completionRate: 0,
                    averageAttempts: 0,
                    commonErrors: [],
                    timeDistribution: {
                        min: 0,
                        max: 0,
                        median: 0,
                        q1: 0,
                        q3: 0
                    }
                },
                metadata: {
                    version: '1.0',
                    lastModifiedBy: createdBy,
                    reviewStatus: 'pending'
                }
            };
            const puzzle = this.puzzleRepository.create(puzzleData);
            const savedPuzzle = await this.puzzleRepository.save(puzzle);
            this.logger.log(`Created puzzle: ${savedPuzzle.id} by user: ${createdBy}`);
            return savedPuzzle;
        }
        catch (error) {
            this.logger.error(`Failed to create puzzle: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findAll(searchDto) {
        try {
            const { search, category, difficulty, minRating, maxRating, tags, isFeatured, isPublished, createdBy, page = 1, limit = 20, sortBy = dto_1.SortBy.CREATED_AT, sortOrder = dto_1.SortOrder.DESC } = searchDto;
            const queryBuilder = this.puzzleRepository
                .createQueryBuilder('puzzle')
                .where('puzzle.deletedAt IS NULL');
            if (search) {
                queryBuilder.andWhere('(puzzle.title ILIKE :search OR puzzle.description ILIKE :search)', { search: `%${search}%` });
            }
            if (category) {
                queryBuilder.andWhere('puzzle.category = :category', { category });
            }
            if (difficulty) {
                queryBuilder.andWhere('puzzle.difficulty = :difficulty', { difficulty });
            }
            if (minRating !== undefined) {
                queryBuilder.andWhere('puzzle.difficultyRating >= :minRating', { minRating });
            }
            if (maxRating !== undefined) {
                queryBuilder.andWhere('puzzle.difficultyRating <= :maxRating', { maxRating });
            }
            if (isFeatured !== undefined) {
                queryBuilder.andWhere('puzzle.isFeatured = :isFeatured', { isFeatured });
            }
            if (isPublished !== undefined) {
                if (isPublished) {
                    queryBuilder.andWhere('puzzle.publishedAt IS NOT NULL');
                }
                else {
                    queryBuilder.andWhere('puzzle.publishedAt IS NULL');
                }
            }
            if (createdBy) {
                queryBuilder.andWhere('puzzle.createdBy = :createdBy', { createdBy });
            }
            this.applySorting(queryBuilder, sortBy, sortOrder);
            const [puzzles, total] = await queryBuilder
                .skip((page - 1) * limit)
                .take(limit)
                .getManyAndCount();
            const puzzlesWithStats = await this.enhanceWithStats(puzzles);
            return {
                puzzles: puzzlesWithStats,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            this.logger.error(`Failed to search puzzles: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findOne(id, userId) {
        try {
            const puzzle = await this.puzzleRepository
                .createQueryBuilder('puzzle')
                .where('puzzle.id = :id', { id })
                .andWhere('puzzle.deletedAt IS NULL')
                .getOne();
            if (!puzzle) {
                throw new common_1.NotFoundException(`Puzzle with ID ${id} not found`);
            }
            if (!puzzle.publishedAt && userId !== puzzle.createdBy) {
                throw new common_1.NotFoundException(`Puzzle with ID ${id} not found`);
            }
            const [enhancedPuzzle] = await this.enhanceWithStats([puzzle]);
            return enhancedPuzzle;
        }
        catch (error) {
            this.logger.error(`Failed to find puzzle ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async update(id, updatePuzzleDto, userId) {
        try {
            const puzzle = await this.findOne(id, userId);
            if (puzzle.createdBy !== userId) {
                throw new common_1.BadRequestException('You can only update puzzles you created');
            }
            const updateData = { ...updatePuzzleDto };
            if (updateData.isPublished !== undefined) {
                updateData.publishedAt = updateData.isPublished ? new Date() : null;
                delete updateData.isPublished;
            }
            await this.puzzleRepository.update(id, updateData);
            const updatedPuzzle = await this.findOne(id, userId);
            this.logger.log(`Updated puzzle: ${id}`);
            return updatedPuzzle;
        }
        catch (error) {
            this.logger.error(`Failed to update puzzle ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async remove(id, userId) {
        try {
            const puzzle = await this.findOne(id, userId);
            if (puzzle.createdBy !== userId) {
                throw new common_1.BadRequestException('You can only delete puzzles you created');
            }
            await this.puzzleRepository.softDelete(id);
            this.logger.log(`Deleted puzzle: ${id}`);
        }
        catch (error) {
            this.logger.error(`Failed to remove puzzle ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async bulkUpdate(puzzleIds, bulkUpdateDto, userId) {
        const errors = [];
        let updated = 0;
        try {
            for (const puzzleId of puzzleIds) {
                try {
                    await this.executeBulkAction(puzzleId, bulkUpdateDto, userId);
                    updated++;
                }
                catch (error) {
                    errors.push(`${puzzleId}: ${error.message}`);
                }
            }
            this.logger.log(`Bulk update completed: ${updated} updated, ${errors.length} errors`);
            return { updated, errors };
        }
        catch (error) {
            this.logger.error(`Bulk update failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getAnalytics(period = 'all') {
        try {
            const baseQuery = this.puzzleRepository.createQueryBuilder('puzzle')
                .where('puzzle.deletedAt IS NULL');
            const [totalPuzzles, publishedPuzzles, topPuzzles] = await Promise.all([
                baseQuery.getCount(),
                baseQuery.clone().andWhere('puzzle.publishedAt IS NOT NULL').getCount(),
                this.puzzleRepository.find({
                    where: { deletedAt: (0, typeorm_2.IsNull)(), publishedAt: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
                    order: { completions: 'DESC' },
                    take: 10
                })
            ]);
            return {
                totalPuzzles,
                publishedPuzzles,
                categoryCounts: {},
                difficultyDistribution: {},
                averageRating: 0,
                topPerformingPuzzles: topPuzzles,
                recentActivity: {
                    created: 0,
                    published: 0,
                    played: 0
                }
            };
        }
        catch (error) {
            this.logger.error(`Failed to get analytics: ${error.message}`, error.stack);
            throw error;
        }
    }
    applySorting(queryBuilder, sortBy, sortOrder) {
        switch (sortBy) {
            case dto_1.SortBy.TITLE:
                queryBuilder.orderBy('puzzle.title', sortOrder);
                break;
            case dto_1.SortBy.DIFFICULTY:
                queryBuilder.orderBy('puzzle.difficultyRating', sortOrder);
                break;
            case dto_1.SortBy.RATING:
                queryBuilder.orderBy('puzzle.averageRating', sortOrder);
                break;
            case dto_1.SortBy.PLAYS:
                queryBuilder.orderBy('puzzle.attempts', sortOrder);
                break;
            case dto_1.SortBy.COMPLETION_RATE:
                queryBuilder.orderBy('puzzle.completions', sortOrder);
                break;
            default:
                queryBuilder.orderBy('puzzle.createdAt', sortOrder);
        }
    }
    async enhanceWithStats(puzzles) {
        return puzzles.map(puzzle => ({
            ...puzzle,
            totalPlays: puzzle.attempts,
            uniquePlayers: 0,
            completionRate: puzzle.attempts > 0 ? (puzzle.completions / puzzle.attempts) * 100 : 0,
            averageRating: puzzle.averageRating,
            averageCompletionTime: puzzle.averageCompletionTime
        }));
    }
    async executeBulkAction(puzzleId, bulkUpdateDto, userId) {
        const { action, value } = bulkUpdateDto;
        switch (action) {
            case dto_1.BulkAction.PUBLISH:
                await this.puzzleRepository.update(puzzleId, { publishedAt: new Date() });
                break;
            case dto_1.BulkAction.UNPUBLISH:
                await this.puzzleRepository.update(puzzleId, { publishedAt: undefined });
                break;
            case dto_1.BulkAction.ARCHIVE:
                await this.puzzleRepository.softDelete(puzzleId);
                break;
            default:
                throw new common_1.BadRequestException(`Unsupported bulk action: ${action}`);
        }
    }
};
exports.PuzzlesService = PuzzlesService;
exports.PuzzlesService = PuzzlesService = PuzzlesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(puzzle_entity_1.Puzzle)),
    __param(1, (0, typeorm_1.InjectRepository)(puzzle_progress_entity_1.PuzzleProgress)),
    __param(2, (0, typeorm_1.InjectRepository)(puzzle_rating_entity_1.PuzzleRating)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object])
], PuzzlesService);


/***/ }),
/* 25 */
/***/ ((module) => {

module.exports = require("typeorm");

/***/ }),
/* 26 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Puzzle = void 0;
const typeorm_1 = __webpack_require__(25);
let Puzzle = class Puzzle {
};
exports.Puzzle = Puzzle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Puzzle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Puzzle.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Puzzle.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Puzzle.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'medium' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Puzzle.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Puzzle.prototype, "difficultyRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 100 }),
    __metadata("design:type", Number)
], Puzzle.prototype, "basePoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 300 }),
    __metadata("design:type", Number)
], Puzzle.prototype, "timeLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 3 }),
    __metadata("design:type", Number)
], Puzzle.prototype, "maxHints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Puzzle.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Puzzle.prototype, "completions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Puzzle.prototype, "averageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Puzzle.prototype, "ratingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Puzzle.prototype, "averageCompletionTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], Puzzle.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], Puzzle.prototype, "isFeatured", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Puzzle.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Puzzle.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Puzzle.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", typeof (_b = typeof Array !== "undefined" && Array) === "function" ? _b : Object)
], Puzzle.prototype, "hints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: [] }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Array)
], Puzzle.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], Puzzle.prototype, "prerequisites", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Puzzle.prototype, "scoring", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Puzzle.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Puzzle.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Puzzle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Puzzle.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Puzzle.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('PuzzleProgress', 'puzzle'),
    __metadata("design:type", Array)
], Puzzle.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Puzzle, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parentPuzzleId' }),
    __metadata("design:type", Puzzle)
], Puzzle.prototype, "parentPuzzle", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Puzzle, (puzzle) => puzzle.parentPuzzle),
    __metadata("design:type", Array)
], Puzzle.prototype, "childPuzzles", void 0);
exports.Puzzle = Puzzle = __decorate([
    (0, typeorm_1.Entity)('puzzles'),
    (0, typeorm_1.Index)(['category', 'difficulty']),
    (0, typeorm_1.Index)(['isActive', 'publishedAt']),
    (0, typeorm_1.Index)(['createdBy'])
], Puzzle);


/***/ }),
/* 27 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzleProgress = void 0;
const typeorm_1 = __webpack_require__(25);
let PuzzleProgress = class PuzzleProgress {
};
exports.PuzzleProgress = PuzzleProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PuzzleProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleProgress.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleProgress.prototype, "puzzleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'not_started' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleProgress.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], PuzzleProgress.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PuzzleProgress.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PuzzleProgress.prototype, "bestScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PuzzleProgress.prototype, "hintsUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PuzzleProgress.prototype, "timeSpent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], PuzzleProgress.prototype, "bestTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], PuzzleProgress.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], PuzzleProgress.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], PuzzleProgress.prototype, "lastAttemptAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PuzzleProgress.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], PuzzleProgress.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], PuzzleProgress.prototype, "metrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], PuzzleProgress.prototype, "sessionData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], PuzzleProgress.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], PuzzleProgress.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('User', 'puzzleProgress', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", Object)
], PuzzleProgress.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Puzzle', 'progress', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'puzzleId' }),
    __metadata("design:type", Object)
], PuzzleProgress.prototype, "puzzle", void 0);
exports.PuzzleProgress = PuzzleProgress = __decorate([
    (0, typeorm_1.Entity)('puzzle_progress'),
    (0, typeorm_1.Index)(['userId', 'puzzleId'], { unique: true }),
    (0, typeorm_1.Index)(['userId', 'status']),
    (0, typeorm_1.Index)(['puzzleId', 'status'])
], PuzzleProgress);


/***/ }),
/* 28 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzleRating = void 0;
const typeorm_1 = __webpack_require__(25);
const user_entity_1 = __webpack_require__(29);
const puzzle_entity_1 = __webpack_require__(26);
let PuzzleRating = class PuzzleRating {
};
exports.PuzzleRating = PuzzleRating;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PuzzleRating.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleRating.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleRating.prototype, "puzzleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], PuzzleRating.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], PuzzleRating.prototype, "difficultyVote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PuzzleRating.prototype, "review", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: [] }),
    __metadata("design:type", Array)
], PuzzleRating.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], PuzzleRating.prototype, "isReported", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], PuzzleRating.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], PuzzleRating.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], PuzzleRating.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], PuzzleRating.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_c = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _c : Object)
], PuzzleRating.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => puzzle_entity_1.Puzzle, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'puzzleId' }),
    __metadata("design:type", typeof (_d = typeof puzzle_entity_1.Puzzle !== "undefined" && puzzle_entity_1.Puzzle) === "function" ? _d : Object)
], PuzzleRating.prototype, "puzzle", void 0);
exports.PuzzleRating = PuzzleRating = __decorate([
    (0, typeorm_1.Entity)('puzzle_ratings'),
    (0, typeorm_1.Index)(['userId', 'puzzleId'], { unique: true }),
    (0, typeorm_1.Index)(['puzzleId', 'rating'])
], PuzzleRating);


/***/ }),
/* 29 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.User = void 0;
const typeorm_1 = __webpack_require__(25);
const user_achievement_entity_1 = __webpack_require__(30);
const game_session_entity_1 = __webpack_require__(32);
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], User.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'active' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'player' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], User.prototype, "totalScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], User.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "experience", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "puzzlesSolved", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "achievementsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], User.prototype, "lastLoginAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], User.prototype, "lastActiveAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], User.prototype, "preferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], User.prototype, "profile", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], User.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], User.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_achievement_entity_1.UserAchievement, (userAchievement) => userAchievement.user),
    __metadata("design:type", Array)
], User.prototype, "achievements", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('PuzzleProgress', 'user'),
    __metadata("design:type", Array)
], User.prototype, "puzzleProgress", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => game_session_entity_1.GameSession, (session) => session.user),
    __metadata("design:type", Array)
], User.prototype, "gameSessions", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users'),
    (0, typeorm_1.Index)(['email'], { unique: true }),
    (0, typeorm_1.Index)(['username'], { unique: true })
], User);


/***/ }),
/* 30 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserAchievement = void 0;
const typeorm_1 = __webpack_require__(25);
const user_entity_1 = __webpack_require__(29);
const achievement_entity_1 = __webpack_require__(31);
let UserAchievement = class UserAchievement {
};
exports.UserAchievement = UserAchievement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserAchievement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserAchievement.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserAchievement.prototype, "achievementId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserAchievement.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 100 }),
    __metadata("design:type", Number)
], UserAchievement.prototype, "progressTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], UserAchievement.prototype, "isUnlocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserAchievement.prototype, "isNotified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserAchievement.prototype, "isViewed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], UserAchievement.prototype, "unlockedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], UserAchievement.prototype, "notifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], UserAchievement.prototype, "viewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserAchievement.prototype, "unlockContext", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserAchievement.prototype, "progressDetails", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], UserAchievement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.achievements, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_e = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _e : Object)
], UserAchievement.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => achievement_entity_1.Achievement, (achievement) => achievement.userAchievements, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'achievementId' }),
    __metadata("design:type", typeof (_f = typeof achievement_entity_1.Achievement !== "undefined" && achievement_entity_1.Achievement) === "function" ? _f : Object)
], UserAchievement.prototype, "achievement", void 0);
exports.UserAchievement = UserAchievement = __decorate([
    (0, typeorm_1.Entity)('user_achievements'),
    (0, typeorm_1.Index)(['userId', 'achievementId'], { unique: true }),
    (0, typeorm_1.Index)(['userId', 'unlockedAt']),
    (0, typeorm_1.Index)(['achievementId', 'unlockedAt'])
], UserAchievement);


/***/ }),
/* 31 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Achievement = void 0;
const typeorm_1 = __webpack_require__(25);
const user_achievement_entity_1 = __webpack_require__(30);
let Achievement = class Achievement {
};
exports.Achievement = Achievement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Achievement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Achievement.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Achievement.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Achievement.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'common' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Achievement.prototype, "rarity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 10 }),
    __metadata("design:type", Number)
], Achievement.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Achievement.prototype, "iconUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Achievement.prototype, "badgeUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], Achievement.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Achievement.prototype, "isSecret", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Achievement.prototype, "unlockedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Achievement.prototype, "unlockRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Achievement.prototype, "unlockConditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: [] }),
    __metadata("design:type", Array)
], Achievement.prototype, "prerequisites", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Achievement.prototype, "progression", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Achievement.prototype, "timeConstraints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Achievement.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Achievement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Achievement.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Achievement.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_achievement_entity_1.UserAchievement, (userAchievement) => userAchievement.achievement),
    __metadata("design:type", Array)
], Achievement.prototype, "userAchievements", void 0);
exports.Achievement = Achievement = __decorate([
    (0, typeorm_1.Entity)('achievements'),
    (0, typeorm_1.Index)(['category', 'isActive']),
    (0, typeorm_1.Index)(['rarity'])
], Achievement);


/***/ }),
/* 32 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameSession = void 0;
const typeorm_1 = __webpack_require__(25);
const user_entity_1 = __webpack_require__(29);
let GameSession = class GameSession {
};
exports.GameSession = GameSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GameSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], GameSession.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], GameSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'web' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], GameSession.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], GameSession.prototype, "deviceInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], GameSession.prototype, "browserInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], GameSession.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], GameSession.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GameSession.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], GameSession.prototype, "puzzlesAttempted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], GameSession.prototype, "puzzlesCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GameSession.prototype, "puzzlesFailed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GameSession.prototype, "puzzlesSkipped", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], GameSession.prototype, "totalScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GameSession.prototype, "totalHintsUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GameSession.prototype, "achievementsUnlocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], GameSession.prototype, "averageAccuracy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GameSession.prototype, "longestStreak", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: [] }),
    __metadata("design:type", Array)
], GameSession.prototype, "puzzleIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: [] }),
    __metadata("design:type", Array)
], GameSession.prototype, "categoriesPlayed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], GameSession.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], GameSession.prototype, "sessionConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], GameSession.prototype, "sessionState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], GameSession.prototype, "contextData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], GameSession.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'ongoing' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], GameSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], GameSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], GameSession.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.gameSessions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_e = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _e : Object)
], GameSession.prototype, "user", void 0);
exports.GameSession = GameSession = __decorate([
    (0, typeorm_1.Entity)('game_sessions'),
    (0, typeorm_1.Index)(['userId', 'startTime']),
    (0, typeorm_1.Index)(['sessionId'], { unique: true }),
    (0, typeorm_1.Index)(['userId', 'isActive']),
    (0, typeorm_1.Index)(['endTime'])
], GameSession);


/***/ }),
/* 33 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(34), exports);
__exportStar(__webpack_require__(35), exports);
__exportStar(__webpack_require__(36), exports);
__exportStar(__webpack_require__(37), exports);


/***/ }),
/* 34 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreatePuzzleDto = exports.PuzzleScoringDto = exports.PuzzleHintDto = exports.PuzzleContentDto = exports.PuzzleContentType = exports.PuzzleDifficulty = void 0;
const class_validator_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(12);
var PuzzleDifficulty;
(function (PuzzleDifficulty) {
    PuzzleDifficulty["EASY"] = "easy";
    PuzzleDifficulty["MEDIUM"] = "medium";
    PuzzleDifficulty["HARD"] = "hard";
    PuzzleDifficulty["EXPERT"] = "expert";
})(PuzzleDifficulty || (exports.PuzzleDifficulty = PuzzleDifficulty = {}));
var PuzzleContentType;
(function (PuzzleContentType) {
    PuzzleContentType["MULTIPLE_CHOICE"] = "multiple-choice";
    PuzzleContentType["FILL_BLANK"] = "fill-blank";
    PuzzleContentType["DRAG_DROP"] = "drag-drop";
    PuzzleContentType["CODE"] = "code";
    PuzzleContentType["VISUAL"] = "visual";
    PuzzleContentType["LOGIC_GRID"] = "logic-grid";
})(PuzzleContentType || (exports.PuzzleContentType = PuzzleContentType = {}));
class PuzzleContentDto {
}
exports.PuzzleContentDto = PuzzleContentDto;
__decorate([
    (0, class_validator_1.IsEnum)(PuzzleContentType),
    __metadata("design:type", String)
], PuzzleContentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], PuzzleContentDto.prototype, "question", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], PuzzleContentDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PuzzleContentDto.prototype, "explanation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PuzzleContentDto.prototype, "media", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PuzzleContentDto.prototype, "interactive", void 0);
class PuzzleHintDto {
}
exports.PuzzleHintDto = PuzzleHintDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PuzzleHintDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], PuzzleHintDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PuzzleHintDto.prototype, "pointsPenalty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PuzzleHintDto.prototype, "unlockAfter", void 0);
class PuzzleScoringDto {
}
exports.PuzzleScoringDto = PuzzleScoringDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PuzzleScoringDto.prototype, "timeBonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PuzzleScoringDto.prototype, "accuracyBonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PuzzleScoringDto.prototype, "streakBonus", void 0);
class CreatePuzzleDto {
}
exports.CreatePuzzleDto = CreatePuzzleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreatePuzzleDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(20),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreatePuzzleDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreatePuzzleDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PuzzleDifficulty),
    __metadata("design:type", String)
], CreatePuzzleDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreatePuzzleDto.prototype, "difficultyRating", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], CreatePuzzleDto.prototype, "basePoints", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(30),
    (0, class_validator_1.Max)(3600),
    __metadata("design:type", Number)
], CreatePuzzleDto.prototype, "timeLimit", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreatePuzzleDto.prototype, "maxHints", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PuzzleContentDto),
    __metadata("design:type", PuzzleContentDto)
], CreatePuzzleDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PuzzleHintDto),
    __metadata("design:type", Array)
], CreatePuzzleDto.prototype, "hints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePuzzleDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(4, { each: true }),
    __metadata("design:type", Array)
], CreatePuzzleDto.prototype, "prerequisites", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PuzzleScoringDto),
    __metadata("design:type", PuzzleScoringDto)
], CreatePuzzleDto.prototype, "scoring", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePuzzleDto.prototype, "isFeatured", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePuzzleDto.prototype, "parentPuzzleId", void 0);


/***/ }),
/* 35 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdatePuzzleDto = void 0;
const mapped_types_1 = __webpack_require__(21);
const create_puzzle_dto_1 = __webpack_require__(34);
const class_validator_1 = __webpack_require__(11);
class UpdatePuzzleDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_puzzle_dto_1.CreatePuzzleDto, ['parentPuzzleId'])) {
}
exports.UpdatePuzzleDto = UpdatePuzzleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePuzzleDto.prototype, "isPublished", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePuzzleDto.prototype, "isArchived", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdatePuzzleDto.prototype, "updateReason", void 0);


/***/ }),
/* 36 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzleStatsDto = exports.SearchPuzzleDto = exports.SortOrder = exports.SortBy = void 0;
const class_validator_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(12);
const create_puzzle_dto_1 = __webpack_require__(34);
var SortBy;
(function (SortBy) {
    SortBy["CREATED_AT"] = "createdAt";
    SortBy["TITLE"] = "title";
    SortBy["DIFFICULTY"] = "difficulty";
    SortBy["RATING"] = "rating";
    SortBy["PLAYS"] = "totalPlays";
    SortBy["COMPLETION_RATE"] = "completionRate";
})(SortBy || (exports.SortBy = SortBy = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "ASC";
    SortOrder["DESC"] = "DESC";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
class SearchPuzzleDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortBy = SortBy.CREATED_AT;
        this.sortOrder = SortOrder.DESC;
    }
}
exports.SearchPuzzleDto = SearchPuzzleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchPuzzleDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchPuzzleDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_puzzle_dto_1.PuzzleDifficulty),
    __metadata("design:type", typeof (_a = typeof create_puzzle_dto_1.PuzzleDifficulty !== "undefined" && create_puzzle_dto_1.PuzzleDifficulty) === "function" ? _a : Object)
], SearchPuzzleDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SearchPuzzleDto.prototype, "minRating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SearchPuzzleDto.prototype, "maxRating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.split(',') : value),
    __metadata("design:type", Array)
], SearchPuzzleDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    __metadata("design:type", Boolean)
], SearchPuzzleDto.prototype, "isFeatured", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    __metadata("design:type", Boolean)
], SearchPuzzleDto.prototype, "isPublished", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchPuzzleDto.prototype, "createdBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SearchPuzzleDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SearchPuzzleDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SortBy),
    __metadata("design:type", String)
], SearchPuzzleDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SortOrder),
    __metadata("design:type", String)
], SearchPuzzleDto.prototype, "sortOrder", void 0);
class PuzzleStatsDto {
    constructor() {
        this.includeStats = false;
        this.period = 'all';
    }
}
exports.PuzzleStatsDto = PuzzleStatsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    __metadata("design:type", Boolean)
], PuzzleStatsDto.prototype, "includeStats", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PuzzleStatsDto.prototype, "period", void 0);


/***/ }),
/* 37 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ImportPuzzleDto = exports.ExportPuzzleDto = exports.BulkUpdateDto = exports.BulkAction = void 0;
const class_validator_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(12);
var BulkAction;
(function (BulkAction) {
    BulkAction["PUBLISH"] = "publish";
    BulkAction["UNPUBLISH"] = "unpublish";
    BulkAction["ARCHIVE"] = "archive";
    BulkAction["DELETE"] = "delete";
    BulkAction["UPDATE_CATEGORY"] = "update_category";
    BulkAction["ADD_TAGS"] = "add_tags";
    BulkAction["REMOVE_TAGS"] = "remove_tags";
})(BulkAction || (exports.BulkAction = BulkAction = {}));
class BulkUpdateDto {
}
exports.BulkUpdateDto = BulkUpdateDto;
__decorate([
    (0, class_validator_1.IsEnum)(BulkAction),
    __metadata("design:type", String)
], BulkUpdateDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkUpdateDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkUpdateDto.prototype, "reason", void 0);
class ExportPuzzleDto {
    constructor() {
        this.format = 'json';
        this.limit = 1000;
    }
}
exports.ExportPuzzleDto = ExportPuzzleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportPuzzleDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportPuzzleDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ExportPuzzleDto.prototype, "limit", void 0);
class ImportPuzzleDto {
    constructor() {
        this.importMode = 'create';
        this.validateOnly = false;
    }
}
exports.ImportPuzzleDto = ImportPuzzleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportPuzzleDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportPuzzleDto.prototype, "importMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ImportPuzzleDto.prototype, "validateOnly", void 0);


/***/ }),
/* 38 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PuzzlesController_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzlesController = void 0;
const common_1 = __webpack_require__(2);
const puzzles_service_1 = __webpack_require__(24);
const dto_1 = __webpack_require__(33);
let PuzzlesController = PuzzlesController_1 = class PuzzlesController {
    constructor(puzzlesService) {
        this.puzzlesService = puzzlesService;
        this.logger = new common_1.Logger(PuzzlesController_1.name);
    }
    async create(createPuzzleDto) {
        const userId = 'temp-user-id';
        this.logger.log(`Creating puzzle: ${createPuzzleDto.title} by user: ${userId}`);
        return await this.puzzlesService.create(createPuzzleDto, userId);
    }
    async findAll(searchDto) {
        this.logger.log(`Searching puzzles with filters: ${JSON.stringify(searchDto)}`);
        return await this.puzzlesService.findAll(searchDto);
    }
    async getAnalytics(period) {
        return await this.puzzlesService.getAnalytics(period);
    }
    async bulkUpdate(puzzleIds, bulkUpdateDto) {
        const userId = 'temp-user-id';
        this.logger.log(`Bulk updating ${puzzleIds.length} puzzles with action: ${bulkUpdateDto.action}`);
        return await this.puzzlesService.bulkUpdate(puzzleIds, bulkUpdateDto, userId);
    }
    async findOne(id) {
        return await this.puzzlesService.findOne(id);
    }
    async getPuzzleStats(id, statsDto) {
        const puzzle = await this.puzzlesService.findOne(id);
        return {
            puzzle,
            stats: {
                period: statsDto.period,
                includeStats: statsDto.includeStats,
            },
        };
    }
    async update(id, updatePuzzleDto) {
        const userId = 'temp-user-id';
        this.logger.log(`Updating puzzle: ${id} by user: ${userId}`);
        return await this.puzzlesService.update(id, updatePuzzleDto, userId);
    }
    async remove(id) {
        const userId = 'temp-user-id';
        this.logger.log(`Deleting puzzle: ${id} by user: ${userId}`);
        await this.puzzlesService.remove(id, userId);
    }
    async publish(id) {
        const userId = 'temp-user-id';
        this.logger.log(`Publishing puzzle: ${id} by user: ${userId}`);
        return await this.puzzlesService.update(id, { isPublished: true }, userId);
    }
    async unpublish(id) {
        const userId = 'temp-user-id';
        this.logger.log(`Unpublishing puzzle: ${id} by user: ${userId}`);
        return await this.puzzlesService.update(id, { isPublished: false }, userId);
    }
    async duplicate(id) {
        const userId = 'temp-user-id';
        this.logger.log(`Duplicating puzzle: ${id} by user: ${userId}`);
        const originalPuzzle = await this.puzzlesService.findOne(id);
        const duplicateDto = {
            title: `${originalPuzzle.title} (Copy)`,
            description: originalPuzzle.description,
            category: originalPuzzle.category,
            difficulty: originalPuzzle.difficulty,
            difficultyRating: originalPuzzle.difficultyRating,
            basePoints: originalPuzzle.basePoints,
            timeLimit: originalPuzzle.timeLimit,
            maxHints: originalPuzzle.maxHints,
            content: originalPuzzle.content,
            hints: originalPuzzle.hints,
            tags: originalPuzzle.tags,
            scoring: originalPuzzle.scoring,
            isFeatured: false,
        };
        return await this.puzzlesService.create(duplicateDto, userId);
    }
};
exports.PuzzlesController = PuzzlesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof dto_1.CreatePuzzleDto !== "undefined" && dto_1.CreatePuzzleDto) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], PuzzlesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof dto_1.SearchPuzzleDto !== "undefined" && dto_1.SearchPuzzleDto) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], PuzzlesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], PuzzlesController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Patch)('bulk'),
    __param(0, (0, common_1.Body)('puzzleIds', new common_1.ParseArrayPipe({ items: String }))),
    __param(1, (0, common_1.Body)('bulkUpdate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, typeof (_g = typeof dto_1.BulkUpdateDto !== "undefined" && dto_1.BulkUpdateDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], PuzzlesController.prototype, "bulkUpdate", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], PuzzlesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_j = typeof dto_1.PuzzleStatsDto !== "undefined" && dto_1.PuzzleStatsDto) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], PuzzlesController.prototype, "getPuzzleStats", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_k = typeof dto_1.UpdatePuzzleDto !== "undefined" && dto_1.UpdatePuzzleDto) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], PuzzlesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], PuzzlesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], PuzzlesController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/unpublish'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], PuzzlesController.prototype, "unpublish", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], PuzzlesController.prototype, "duplicate", null);
exports.PuzzlesController = PuzzlesController = PuzzlesController_1 = __decorate([
    (0, common_1.Controller)('puzzles'),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    __metadata("design:paramtypes", [typeof (_a = typeof puzzles_service_1.PuzzlesService !== "undefined" && puzzles_service_1.PuzzlesService) === "function" ? _a : Object])
], PuzzlesController);


/***/ }),
/* 39 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthModule = void 0;
const common_1 = __webpack_require__(2);
const terminus_1 = __webpack_require__(40);
const health_controller_1 = __webpack_require__(41);
let HealthModule = class HealthModule {
};
exports.HealthModule = HealthModule;
exports.HealthModule = HealthModule = __decorate([
    (0, common_1.Module)({
        imports: [terminus_1.TerminusModule],
        controllers: [health_controller_1.HealthController],
    })
], HealthModule);


/***/ }),
/* 40 */
/***/ ((module) => {

module.exports = require("@nestjs/terminus");

/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthController = void 0;
const database_service_1 = __webpack_require__(42);
const performance_service_1 = __webpack_require__(46);
class HealthController {
    constructor() {
        this.databaseService = database_service_1.DatabaseService.getInstance();
        this.performanceService = new performance_service_1.PerformanceMonitoringService(this.databaseService.getDataSource());
    }
    async checkHealth(req, res) {
        try {
            const health = await this.databaseService.checkHealth();
            const status = health.status === 'healthy' ? 200 : 503;
            res.status(status).json({
                status: health.status,
                timestamp: health.timestamp,
                database: {
                    connection: health.connection,
                    latency: `${health.latency}ms`,
                    activeConnections: health.activeConnections,
                },
                error: health.error,
            });
        }
        catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getMetrics(req, res) {
        try {
            const metrics = await this.performanceService.getMetrics();
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch metrics',
            });
        }
    }
    async getConnectionStats(req, res) {
        try {
            const stats = await this.databaseService.getConnectionStats();
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error
                    ? error.message
                    : 'Failed to fetch connection stats',
            });
        }
    }
}
exports.HealthController = HealthController;


/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseService = void 0;
const typeorm_1 = __webpack_require__(25);
const database_config_1 = __webpack_require__(43);
class DatabaseService {
    constructor() {
        this.dataSource = null;
        this.healthCheckInterval = null;
        this.lastHealthCheck = null;
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    getDataSourceInstance() {
        if (!this.dataSource) {
            const configService = database_config_1.DatabaseConfigService.getInstance();
            this.dataSource = new typeorm_1.DataSource(configService.getTypeOrmConfig());
        }
        return this.dataSource;
    }
    async initialize() {
        try {
            console.log('Initializing database connection...');
            const dataSource = this.getDataSourceInstance();
            if (!dataSource.isInitialized) {
                await dataSource.initialize();
            }
            console.log('Database connection initialized successfully');
            this.startHealthChecks();
            if (process.env.NODE_ENV === 'production') {
                await this.runMigrations();
            }
        }
        catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }
    async runMigrations() {
        try {
            console.log('Running database migrations...');
            const dataSource = this.getDataSourceInstance();
            await dataSource.runMigrations();
            console.log('Migrations completed successfully');
        }
        catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }
    async revertMigration() {
        try {
            console.log('Reverting last migration...');
            const dataSource = this.getDataSourceInstance();
            await dataSource.undoLastMigration();
            console.log('Migration reverted successfully');
        }
        catch (error) {
            console.error('Migration revert failed:', error);
            throw error;
        }
    }
    async checkHealth() {
        const startTime = Date.now();
        try {
            const dataSource = this.getDataSourceInstance();
            const queryRunner = dataSource.createQueryRunner();
            await queryRunner.connect();
            const result = await queryRunner.query('SELECT 1 as test');
            const stats = await this.getConnectionStats(queryRunner);
            await queryRunner.release();
            const latency = Date.now() - startTime;
            this.lastHealthCheck = {
                status: 'healthy',
                connection: true,
                latency,
                activeConnections: stats.activeConnections,
                timestamp: new Date(),
            };
            return this.lastHealthCheck;
        }
        catch (error) {
            this.lastHealthCheck = {
                status: 'unhealthy',
                connection: false,
                latency: Date.now() - startTime,
                activeConnections: 0,
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            return this.lastHealthCheck;
        }
    }
    async getConnectionStats(queryRunner) {
        const dataSource = this.getDataSourceInstance();
        const runner = queryRunner || dataSource.createQueryRunner();
        try {
            if (!queryRunner)
                await runner.connect();
            const result = await runner.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
            return {
                totalConnections: parseInt(result[0].total_connections),
                activeConnections: parseInt(result[0].active_connections),
                idleConnections: parseInt(result[0].idle_connections),
                waitingConnections: parseInt(result[0].waiting_connections),
            };
        }
        finally {
            if (!queryRunner)
                await runner.release();
        }
    }
    getLastHealthCheck() {
        return this.lastHealthCheck;
    }
    startHealthChecks() {
        this.healthCheckInterval = setInterval(async () => {
            await this.checkHealth();
        }, 30000);
    }
    async retryConnection(maxRetries = 5, delay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const dataSource = this.getDataSourceInstance();
                if (!dataSource.isInitialized) {
                    await dataSource.initialize();
                }
                await this.checkHealth();
                if (this.lastHealthCheck?.status === 'healthy') {
                    console.log(`Connection retry successful on attempt ${attempt}`);
                    return;
                }
            }
            catch (error) {
                console.log(`Connection attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) {
                    throw new Error(`Failed to establish database connection after ${maxRetries} attempts`);
                }
                await new Promise((resolve) => setTimeout(resolve, delay * attempt));
            }
        }
    }
    async close() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        const dataSource = this.getDataSourceInstance();
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('Database connection closed');
        }
    }
    getDataSource() {
        return this.getDataSourceInstance();
    }
}
exports.DatabaseService = DatabaseService;


/***/ }),
/* 43 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseConfigService = void 0;
const dotenv_1 = __webpack_require__(44);
const path = __importStar(__webpack_require__(45));
(0, dotenv_1.config)();
class DatabaseConfigService {
    constructor() { }
    static getInstance() {
        if (!DatabaseConfigService.instance) {
            DatabaseConfigService.instance = new DatabaseConfigService();
        }
        return DatabaseConfigService.instance;
    }
    getConfig() {
        const isTest = process.env.NODE_ENV === 'test';
        return {
            host: isTest
                ? process.env.TEST_DB_HOST || 'localhost'
                : process.env.DB_HOST || 'localhost',
            port: isTest
                ? parseInt(process.env.TEST_DB_PORT || '5433')
                : parseInt(process.env.DB_PORT || '5432'),
            username: isTest
                ? process.env.TEST_DB_USER || 'postgres'
                : process.env.DB_USER || 'postgres',
            password: isTest
                ? process.env.TEST_DB_PASSWORD || 'password'
                : process.env.DB_PASSWORD || 'password',
            database: isTest
                ? process.env.TEST_DB_NAME || 'myapp_test'
                : process.env.DB_NAME || 'myapp',
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
            minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
            acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '20000'),
            timeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '20000'),
            idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
            logging: process.env.DB_LOGGING === 'true',
            logLevel: process.env.LOG_LEVEL || 'info',
        };
    }
    getTypeOrmConfig() {
        const config = this.getConfig();
        return {
            type: 'postgres',
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            database: config.database,
            entities: [path.join(__dirname, '../entities/*.{ts,js}')],
            migrations: [path.join(__dirname, '../migrations/*.{ts,js}')],
            subscribers: [path.join(__dirname, '../subscribers/*.{ts,js}')],
            synchronize: false,
            logging: config.logging
                ? ['query', 'error', 'schema', 'warn', 'info', 'log']
                : false,
            logger: 'advanced-console',
            maxQueryExecutionTime: 5000,
            poolSize: config.maxConnections,
            extra: {
                connectionTimeoutMillis: config.timeout,
                idleTimeoutMillis: config.idleTimeout,
                max: config.maxConnections,
                min: config.minConnections,
                acquireTimeoutMillis: config.acquireTimeout,
                createTimeoutMillis: 8000,
                destroyTimeoutMillis: 5000,
                reapIntervalMillis: 1000,
                createRetryIntervalMillis: 200,
            },
            cache: {
                type: 'database',
                tableName: 'query_result_cache',
                duration: 30000,
            },
        };
    }
}
exports.DatabaseConfigService = DatabaseConfigService;


/***/ }),
/* 44 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 45 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PerformanceMonitoringService = void 0;
class PerformanceMonitoringService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getSlowQueries(limit = 10) {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            const result = await queryRunner.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          min_time,
          max_time,
          rows
        FROM pg_stat_statements 
        WHERE calls > 5
        ORDER BY mean_time DESC 
        LIMIT $1
      `, [limit]);
            return result;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getCacheHitRatio() {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            const result = await queryRunner.query(`
        SELECT 
          round(
            sum(blks_hit) * 100.0 / sum(blks_hit + blks_read), 2
          ) as cache_hit_ratio
        FROM pg_stat_database
        WHERE datname = current_database()
      `);
            return result[0]?.cache_hit_ratio || 0;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getIndexUsage() {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            const result = await queryRunner.query(`
        SELECT 
          round(
            sum(idx_scan) * 100.0 / sum(seq_scan + idx_scan), 2
          ) as index_usage_ratio
        FROM pg_stat_user_tables
        WHERE seq_scan + idx_scan > 0
      `);
            return result[0]?.index_usage_ratio || 0;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getDatabaseSize() {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            const result = await queryRunner.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
            return result[0]?.size || '0 bytes';
        }
        finally {
            await queryRunner.release();
        }
    }
    async getTablesSizes() {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            const result = await queryRunner.query(`
        SELECT 
          schemaname||'.'||tablename as table,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);
            return result;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getMetrics() {
        const [slowQueries, cacheHitRatio, indexUsage, databaseSize, tablesSizes] = await Promise.all([
            this.getSlowQueries(),
            this.getCacheHitRatio(),
            this.getIndexUsage(),
            this.getDatabaseSize(),
            this.getTablesSizes(),
        ]);
        const connectionStats = await this.getConnectionStats();
        return {
            connections: connectionStats,
            performance: {
                slowQueries,
                cacheHitRatio,
                indexUsage,
            },
            storage: {
                databaseSize,
                tablesSizes,
            },
        };
    }
    async getConnectionStats() {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            const result = await queryRunner.query(`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
            return {
                total: parseInt(result[0].total),
                active: parseInt(result[0].active),
                idle: parseInt(result[0].idle),
                waiting: parseInt(result[0].waiting),
            };
        }
        finally {
            await queryRunner.release();
        }
    }
}
exports.PerformanceMonitoringService = PerformanceMonitoringService;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ })()
;