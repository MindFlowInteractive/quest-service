/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/achievements/achievements.controller.ts":
/*!*****************************************************!*\
  !*** ./src/achievements/achievements.controller.ts ***!
  \*****************************************************/
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
exports.AchievementsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const achievements_service_1 = __webpack_require__(/*! ./achievements.service */ "./src/achievements/achievements.service.ts");
const create_achievement_dto_1 = __webpack_require__(/*! ./dto/create-achievement.dto */ "./src/achievements/dto/create-achievement.dto.ts");
const update_achievement_dto_1 = __webpack_require__(/*! ./dto/update-achievement.dto */ "./src/achievements/dto/update-achievement.dto.ts");
let AchievementsController = class AchievementsController {
    achievementsService;
    constructor(achievementsService) {
        this.achievementsService = achievementsService;
    }
    create(createAchievementDto) {
        return this.achievementsService.create(createAchievementDto);
    }
    findAll() {
        return this.achievementsService.findAll();
    }
    findOne(id) {
        return this.achievementsService.findOne(+id);
    }
    update(id, updateAchievementDto) {
        return this.achievementsService.update(+id, updateAchievementDto);
    }
    remove(id) {
        return this.achievementsService.remove(+id);
    }
};
exports.AchievementsController = AchievementsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_achievement_dto_1.CreateAchievementDto !== "undefined" && create_achievement_dto_1.CreateAchievementDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], AchievementsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AchievementsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AchievementsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof update_achievement_dto_1.UpdateAchievementDto !== "undefined" && update_achievement_dto_1.UpdateAchievementDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], AchievementsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AchievementsController.prototype, "remove", null);
exports.AchievementsController = AchievementsController = __decorate([
    (0, common_1.Controller)('achievements'),
    __metadata("design:paramtypes", [typeof (_a = typeof achievements_service_1.AchievementsService !== "undefined" && achievements_service_1.AchievementsService) === "function" ? _a : Object])
], AchievementsController);


/***/ }),

/***/ "./src/achievements/achievements.module.ts":
/*!*************************************************!*\
  !*** ./src/achievements/achievements.module.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AchievementsModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const achievements_service_1 = __webpack_require__(/*! ./achievements.service */ "./src/achievements/achievements.service.ts");
const achievements_controller_1 = __webpack_require__(/*! ./achievements.controller */ "./src/achievements/achievements.controller.ts");
let AchievementsModule = class AchievementsModule {
};
exports.AchievementsModule = AchievementsModule;
exports.AchievementsModule = AchievementsModule = __decorate([
    (0, common_1.Module)({
        controllers: [achievements_controller_1.AchievementsController],
        providers: [achievements_service_1.AchievementsService],
    })
], AchievementsModule);


/***/ }),

/***/ "./src/achievements/achievements.service.ts":
/*!**************************************************!*\
  !*** ./src/achievements/achievements.service.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AchievementsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let AchievementsService = class AchievementsService {
    create(createAchievementDto) {
        return 'This action adds a new achievement';
    }
    findAll() {
        return `This action returns all achievements`;
    }
    findOne(id) {
        return `This action returns a #${id} achievement`;
    }
    update(id, updateAchievementDto) {
        return `This action updates a #${id} achievement`;
    }
    remove(id) {
        return `This action removes a #${id} achievement`;
    }
};
exports.AchievementsService = AchievementsService;
exports.AchievementsService = AchievementsService = __decorate([
    (0, common_1.Injectable)()
], AchievementsService);


/***/ }),

/***/ "./src/achievements/dto/create-achievement.dto.ts":
/*!********************************************************!*\
  !*** ./src/achievements/dto/create-achievement.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateAchievementDto = void 0;
class CreateAchievementDto {
}
exports.CreateAchievementDto = CreateAchievementDto;


/***/ }),

/***/ "./src/achievements/dto/update-achievement.dto.ts":
/*!********************************************************!*\
  !*** ./src/achievements/dto/update-achievement.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateAchievementDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_achievement_dto_1 = __webpack_require__(/*! ./create-achievement.dto */ "./src/achievements/dto/create-achievement.dto.ts");
class UpdateAchievementDto extends (0, mapped_types_1.PartialType)(create_achievement_dto_1.CreateAchievementDto) {
}
exports.UpdateAchievementDto = UpdateAchievementDto;


/***/ }),

/***/ "./src/app.controller.ts":
/*!*******************************!*\
  !*** ./src/app.controller.ts ***!
  \*******************************/
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
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const app_service_1 = __webpack_require__(/*! ./app.service */ "./src/app.service.ts");
let AppController = class AppController {
    appService;
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

/***/ "./src/app.module.ts":
/*!***************************!*\
  !*** ./src/app.module.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const throttler_1 = __webpack_require__(/*! @nestjs/throttler */ "@nestjs/throttler");
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const nest_winston_1 = __webpack_require__(/*! nest-winston */ "nest-winston");
const app_controller_1 = __webpack_require__(/*! ./app.controller */ "./src/app.controller.ts");
const app_service_1 = __webpack_require__(/*! ./app.service */ "./src/app.service.ts");
const env_validation_1 = __webpack_require__(/*! ./config/env.validation */ "./src/config/env.validation.ts");
const app_config_1 = __webpack_require__(/*! ./config/app.config */ "./src/config/app.config.ts");
const logger_config_1 = __webpack_require__(/*! ./config/logger.config */ "./src/config/logger.config.ts");
const users_module_1 = __webpack_require__(/*! ./users/users.module */ "./src/users/users.module.ts");
const puzzles_module_1 = __webpack_require__(/*! ./puzzles/puzzles.module */ "./src/puzzles/puzzles.module.ts");
const achievements_module_1 = __webpack_require__(/*! ./achievements/achievements.module */ "./src/achievements/achievements.module.ts");
const health_module_1 = __webpack_require__(/*! ./health/health.module */ "./src/health/health.module.ts");
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
            achievements_module_1.AchievementsModule,
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

/***/ "./src/app.service.ts":
/*!****************************!*\
  !*** ./src/app.service.ts ***!
  \****************************/
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
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
let AppService = class AppService {
    configService;
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

/***/ "./src/config/app.config.ts":
/*!**********************************!*\
  !*** ./src/config/app.config.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
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

/***/ "./src/config/database-service.ts":
/*!****************************************!*\
  !*** ./src/config/database-service.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseService = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const database_config_1 = __webpack_require__(/*! ../config/database.config */ "./src/config/database.config.ts");
class DatabaseService {
    static instance;
    dataSource = null;
    healthCheckInterval = null;
    lastHealthCheck = null;
    constructor() {
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

/***/ "./src/config/database.config.ts":
/*!***************************************!*\
  !*** ./src/config/database.config.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseConfigService = void 0;
const dotenv_1 = __webpack_require__(/*! dotenv */ "dotenv");
const path = __webpack_require__(/*! path */ "path");
(0, dotenv_1.config)();
class DatabaseConfigService {
    static instance;
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

/***/ "./src/config/env.validation.ts":
/*!**************************************!*\
  !*** ./src/config/env.validation.ts ***!
  \**************************************/
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
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
var Environment;
(function (Environment) {
    Environment["Development"] = "development";
    Environment["Production"] = "production";
    Environment["Test"] = "test";
})(Environment || (exports.Environment = Environment = {}));
class EnvironmentVariables {
    NODE_ENV = Environment.Development;
    PORT = 3000;
    API_PREFIX = 'api/v1';
    CORS_ORIGIN = 'http://localhost:3000';
    THROTTLE_TTL = 60000;
    THROTTLE_LIMIT = 100;
    LOG_LEVEL = 'info';
    DATABASE_URL;
    JWT_SECRET;
    JWT_EXPIRES_IN = '1d';
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

/***/ "./src/config/logger.config.ts":
/*!*************************************!*\
  !*** ./src/config/logger.config.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createLoggerConfig = void 0;
const winston = __webpack_require__(/*! winston */ "winston");
const env_validation_1 = __webpack_require__(/*! ./env.validation */ "./src/config/env.validation.ts");
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

/***/ "./src/health/health.controller.ts":
/*!*****************************************!*\
  !*** ./src/health/health.controller.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthController = void 0;
const database_service_1 = __webpack_require__(/*! src/config/database-service */ "./src/config/database-service.ts");
const performance_service_1 = __webpack_require__(/*! src/monitoring/performance.service */ "./src/monitoring/performance.service.ts");
class HealthController {
    databaseService = database_service_1.DatabaseService.getInstance();
    performanceService;
    constructor() {
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

/***/ "./src/health/health.module.ts":
/*!*************************************!*\
  !*** ./src/health/health.module.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const terminus_1 = __webpack_require__(/*! @nestjs/terminus */ "@nestjs/terminus");
const health_controller_1 = __webpack_require__(/*! ./health.controller */ "./src/health/health.controller.ts");
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

/***/ "./src/monitoring/performance.service.ts":
/*!***********************************************!*\
  !*** ./src/monitoring/performance.service.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PerformanceMonitoringService = void 0;
class PerformanceMonitoringService {
    dataSource;
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


/***/ }),

/***/ "./src/puzzles/dto/create-puzzle.dto.ts":
/*!**********************************************!*\
  !*** ./src/puzzles/dto/create-puzzle.dto.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreatePuzzleDto = void 0;
class CreatePuzzleDto {
}
exports.CreatePuzzleDto = CreatePuzzleDto;


/***/ }),

/***/ "./src/puzzles/dto/update-puzzle.dto.ts":
/*!**********************************************!*\
  !*** ./src/puzzles/dto/update-puzzle.dto.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdatePuzzleDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_puzzle_dto_1 = __webpack_require__(/*! ./create-puzzle.dto */ "./src/puzzles/dto/create-puzzle.dto.ts");
class UpdatePuzzleDto extends (0, mapped_types_1.PartialType)(create_puzzle_dto_1.CreatePuzzleDto) {
}
exports.UpdatePuzzleDto = UpdatePuzzleDto;


/***/ }),

/***/ "./src/puzzles/puzzles.controller.ts":
/*!*******************************************!*\
  !*** ./src/puzzles/puzzles.controller.ts ***!
  \*******************************************/
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
exports.PuzzlesController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const puzzles_service_1 = __webpack_require__(/*! ./puzzles.service */ "./src/puzzles/puzzles.service.ts");
const create_puzzle_dto_1 = __webpack_require__(/*! ./dto/create-puzzle.dto */ "./src/puzzles/dto/create-puzzle.dto.ts");
const update_puzzle_dto_1 = __webpack_require__(/*! ./dto/update-puzzle.dto */ "./src/puzzles/dto/update-puzzle.dto.ts");
let PuzzlesController = class PuzzlesController {
    puzzlesService;
    constructor(puzzlesService) {
        this.puzzlesService = puzzlesService;
    }
    create(createPuzzleDto) {
        return this.puzzlesService.create(createPuzzleDto);
    }
    findAll() {
        return this.puzzlesService.findAll();
    }
    findOne(id) {
        return this.puzzlesService.findOne(+id);
    }
    update(id, updatePuzzleDto) {
        return this.puzzlesService.update(+id, updatePuzzleDto);
    }
    remove(id) {
        return this.puzzlesService.remove(+id);
    }
};
exports.PuzzlesController = PuzzlesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_puzzle_dto_1.CreatePuzzleDto !== "undefined" && create_puzzle_dto_1.CreatePuzzleDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], PuzzlesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PuzzlesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PuzzlesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof update_puzzle_dto_1.UpdatePuzzleDto !== "undefined" && update_puzzle_dto_1.UpdatePuzzleDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], PuzzlesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PuzzlesController.prototype, "remove", null);
exports.PuzzlesController = PuzzlesController = __decorate([
    (0, common_1.Controller)('puzzles'),
    __metadata("design:paramtypes", [typeof (_a = typeof puzzles_service_1.PuzzlesService !== "undefined" && puzzles_service_1.PuzzlesService) === "function" ? _a : Object])
], PuzzlesController);


/***/ }),

/***/ "./src/puzzles/puzzles.module.ts":
/*!***************************************!*\
  !*** ./src/puzzles/puzzles.module.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzlesModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const puzzles_service_1 = __webpack_require__(/*! ./puzzles.service */ "./src/puzzles/puzzles.service.ts");
const puzzles_controller_1 = __webpack_require__(/*! ./puzzles.controller */ "./src/puzzles/puzzles.controller.ts");
let PuzzlesModule = class PuzzlesModule {
};
exports.PuzzlesModule = PuzzlesModule;
exports.PuzzlesModule = PuzzlesModule = __decorate([
    (0, common_1.Module)({
        controllers: [puzzles_controller_1.PuzzlesController],
        providers: [puzzles_service_1.PuzzlesService],
    })
], PuzzlesModule);


/***/ }),

/***/ "./src/puzzles/puzzles.service.ts":
/*!****************************************!*\
  !*** ./src/puzzles/puzzles.service.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzlesService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let PuzzlesService = class PuzzlesService {
    create(createPuzzleDto) {
        return 'This action adds a new puzzle';
    }
    findAll() {
        return `This action returns all puzzles`;
    }
    findOne(id) {
        return `This action returns a #${id} puzzle`;
    }
    update(id, updatePuzzleDto) {
        return `This action updates a #${id} puzzle`;
    }
    remove(id) {
        return `This action removes a #${id} puzzle`;
    }
};
exports.PuzzlesService = PuzzlesService;
exports.PuzzlesService = PuzzlesService = __decorate([
    (0, common_1.Injectable)()
], PuzzlesService);


/***/ }),

/***/ "./src/users/dto/create-user.dto.ts":
/*!******************************************!*\
  !*** ./src/users/dto/create-user.dto.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateUserDto = void 0;
class CreateUserDto {
}
exports.CreateUserDto = CreateUserDto;


/***/ }),

/***/ "./src/users/dto/update-user.dto.ts":
/*!******************************************!*\
  !*** ./src/users/dto/update-user.dto.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateUserDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_user_dto_1 = __webpack_require__(/*! ./create-user.dto */ "./src/users/dto/create-user.dto.ts");
class UpdateUserDto extends (0, mapped_types_1.PartialType)(create_user_dto_1.CreateUserDto) {
}
exports.UpdateUserDto = UpdateUserDto;


/***/ }),

/***/ "./src/users/users.controller.ts":
/*!***************************************!*\
  !*** ./src/users/users.controller.ts ***!
  \***************************************/
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
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const users_service_1 = __webpack_require__(/*! ./users.service */ "./src/users/users.service.ts");
const create_user_dto_1 = __webpack_require__(/*! ./dto/create-user.dto */ "./src/users/dto/create-user.dto.ts");
const update_user_dto_1 = __webpack_require__(/*! ./dto/update-user.dto */ "./src/users/dto/update-user.dto.ts");
let UsersController = class UsersController {
    usersService;
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
        return this.usersService.findOne(+id);
    }
    update(id, updateUserDto) {
        return this.usersService.update(+id, updateUserDto);
    }
    remove(id) {
        return this.usersService.remove(+id);
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

/***/ "./src/users/users.module.ts":
/*!***********************************!*\
  !*** ./src/users/users.module.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const users_service_1 = __webpack_require__(/*! ./users.service */ "./src/users/users.service.ts");
const users_controller_1 = __webpack_require__(/*! ./users.controller */ "./src/users/users.controller.ts");
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

/***/ "./src/users/users.service.ts":
/*!************************************!*\
  !*** ./src/users/users.service.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let UsersService = class UsersService {
    create(createUserDto) {
        return 'This action adds a new user';
    }
    findAll() {
        return `This action returns all users`;
    }
    findOne(id) {
        return `This action returns a #${id} user`;
    }
    update(id, updateUserDto) {
        return `This action updates a #${id} user`;
    }
    remove(id) {
        return `This action removes a #${id} user`;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);


/***/ }),

/***/ "@nestjs/common":
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),

/***/ "@nestjs/config":
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),

/***/ "@nestjs/core":
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),

/***/ "@nestjs/mapped-types":
/*!***************************************!*\
  !*** external "@nestjs/mapped-types" ***!
  \***************************************/
/***/ ((module) => {

module.exports = require("@nestjs/mapped-types");

/***/ }),

/***/ "@nestjs/terminus":
/*!***********************************!*\
  !*** external "@nestjs/terminus" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("@nestjs/terminus");

/***/ }),

/***/ "@nestjs/throttler":
/*!************************************!*\
  !*** external "@nestjs/throttler" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("@nestjs/throttler");

/***/ }),

/***/ "class-transformer":
/*!************************************!*\
  !*** external "class-transformer" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),

/***/ "class-validator":
/*!**********************************!*\
  !*** external "class-validator" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),

/***/ "dotenv":
/*!*************************!*\
  !*** external "dotenv" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),

/***/ "helmet":
/*!*************************!*\
  !*** external "helmet" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("helmet");

/***/ }),

/***/ "nest-winston":
/*!*******************************!*\
  !*** external "nest-winston" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),

/***/ "typeorm":
/*!**************************!*\
  !*** external "typeorm" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("typeorm");

/***/ }),

/***/ "winston":
/*!**************************!*\
  !*** external "winston" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("winston");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
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
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const nest_winston_1 = __webpack_require__(/*! nest-winston */ "nest-winston");
const helmet_1 = __webpack_require__(/*! helmet */ "helmet");
const app_module_1 = __webpack_require__(/*! ./app.module */ "./src/app.module.ts");
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

})();

/******/ })()
;