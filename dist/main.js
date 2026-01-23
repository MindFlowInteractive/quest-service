/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/achievements/entities/achievement.entity.ts":
/*!*********************************************************!*\
  !*** ./src/achievements/entities/achievement.entity.ts ***!
  \*********************************************************/
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
exports.Achievement = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_achievement_entity_1 = __webpack_require__(/*! ./user-achievement.entity */ "./src/achievements/entities/user-achievement.entity.ts");
const achievement_condition_types_1 = __webpack_require__(/*! ../types/achievement-condition.types */ "./src/achievements/types/achievement-condition.types.ts");
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
    __metadata("design:type", typeof (_a = typeof achievement_condition_types_1.AchievementConditionGroup !== "undefined" && achievement_condition_types_1.AchievementConditionGroup) === "function" ? _a : Object)
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
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Achievement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Achievement.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
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

/***/ "./src/achievements/entities/user-achievement.entity.ts":
/*!**************************************************************!*\
  !*** ./src/achievements/entities/user-achievement.entity.ts ***!
  \**************************************************************/
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
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const achievement_entity_1 = __webpack_require__(/*! ./achievement.entity */ "./src/achievements/entities/achievement.entity.ts");
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

/***/ "./src/achievements/types/achievement-condition.types.ts":
/*!***************************************************************!*\
  !*** ./src/achievements/types/achievement-condition.types.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const app_config_1 = __importDefault(__webpack_require__(/*! ./config/app.config */ "./src/config/app.config.ts"));
const logger_config_1 = __webpack_require__(/*! ./config/logger.config */ "./src/config/logger.config.ts");
const users_module_1 = __webpack_require__(/*! ./users/users.module */ "./src/users/users.module.ts");
const puzzles_module_1 = __webpack_require__(/*! ./puzzles/puzzles.module */ "./src/puzzles/puzzles.module.ts");
const health_module_1 = __webpack_require__(/*! ./health/health.module */ "./src/health/health.module.ts");
const hints_module_1 = __webpack_require__(/*! ./hints/hints.module */ "./src/hints/hints.module.ts");
const notifications_module_1 = __webpack_require__(/*! ./notifications/notifications.module */ "./src/notifications/notifications.module.ts");
const difficulty_scaling_module_1 = __webpack_require__(/*! ./difficulty-scaling/difficulty-scaling.module */ "./src/difficulty-scaling/difficulty-scaling.module.ts");
const tournaments_module_1 = __webpack_require__(/*! ./tournaments/tournaments.module */ "./src/tournaments/tournaments.module.ts");
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
            notifications_module_1.NotificationsModule,
            health_module_1.HealthModule,
            hints_module_1.HintsModule,
            difficulty_scaling_module_1.DifficultyScalingModule,
            tournaments_module_1.TournamentsModule,
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

/***/ "./src/auth/guards/jwt-auth.guard.ts":
/*!*******************************************!*\
  !*** ./src/auth/guards/jwt-auth.guard.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtAuthGuard = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const passport_1 = __webpack_require__(/*! @nestjs/passport */ "@nestjs/passport");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)("jwt") {
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);


/***/ }),

/***/ "./src/common/exceptions/http-exception.filter.ts":
/*!********************************************************!*\
  !*** ./src/common/exceptions/http-exception.filter.ts ***!
  \********************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.AllExceptionsFilter = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const Sentry = __importStar(__webpack_require__(/*! @sentry/node */ "@sentry/node"));
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'An unexpected error occurred.';
        let errorCode = 'INTERNAL_ERROR';
        let errors = undefined;
        if (exception instanceof common_1.HttpException) {
            const httpEx = exception;
            status = httpEx.getStatus();
            const res = httpEx.getResponse();
            if (typeof res === 'string') {
                message = res;
            }
            else if (typeof res === 'object' && res !== null) {
                const r = res;
                message = r.message || message;
                errorCode = r.errorCode || errorCode;
                errors = r.errors;
            }
            if (status >= 500) {
                Sentry.captureException(exception);
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
            Sentry.captureException(exception);
        }
        if (status === common_1.HttpStatus.NOT_FOUND) {
            message = 'The requested resource was not found.';
            errorCode = 'NOT_FOUND';
        }
        else if (status === common_1.HttpStatus.UNAUTHORIZED) {
            message = 'You are not authorized to access this resource.';
            errorCode = 'UNAUTHORIZED';
        }
        else if (status === common_1.HttpStatus.FORBIDDEN) {
            message = 'You do not have permission to perform this action.';
            errorCode = 'FORBIDDEN';
        }
        else if (status === common_1.HttpStatus.BAD_REQUEST) {
            message = 'The request was invalid or cannot be served.';
            errorCode = 'BAD_REQUEST';
        }
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
            errorCode,
            errors,
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);


/***/ }),

/***/ "./src/common/interceptors/sanitize.interceptor.ts":
/*!*********************************************************!*\
  !*** ./src/common/interceptors/sanitize.interceptor.ts ***!
  \*********************************************************/
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
exports.SanitizeInterceptor = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const operators_1 = __webpack_require__(/*! rxjs/operators */ "rxjs/operators");
const xss_1 = __importDefault(__webpack_require__(/*! xss */ "xss"));
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return (0, xss_1.default)(obj);
    }
    else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    else if (typeof obj === 'object' && obj !== null) {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    return obj;
}
let SanitizeInterceptor = class SanitizeInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.body) {
            request.body = sanitizeObject(request.body);
        }
        if (request.query) {
            request.query = sanitizeObject(request.query);
        }
        if (request.params) {
            request.params = sanitizeObject(request.params);
        }
        return next.handle().pipe((0, operators_1.map)(data => sanitizeObject(data)));
    }
};
exports.SanitizeInterceptor = SanitizeInterceptor;
exports.SanitizeInterceptor = SanitizeInterceptor = __decorate([
    (0, common_1.Injectable)()
], SanitizeInterceptor);


/***/ }),

/***/ "./src/common/validators/file-upload.validator.ts":
/*!********************************************************!*\
  !*** ./src/common/validators/file-upload.validator.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fileFilter = fileFilter;
exports.fileSizeLimit = fileSizeLimit;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const path_1 = __webpack_require__(/*! path */ "path");
function fileFilter(allowedTypes, allowedMimeTypes) {
    return (req, file, callback) => {
        const ext = (0, path_1.extname)(file.originalname).toLowerCase();
        const mime = file.mimetype;
        const extAllowed = allowedTypes.includes(ext);
        const mimeAllowed = allowedMimeTypes ? allowedMimeTypes.includes(mime) : true;
        if (!extAllowed || !mimeAllowed) {
            return callback(new common_1.BadRequestException(`File type not allowed. Allowed extensions: ${allowedTypes.join(', ')}${allowedMimeTypes ? '; allowed MIME types: ' + allowedMimeTypes.join(', ') : ''}`), false);
        }
        callback(null, true);
    };
}
function fileSizeLimit(maxSize) {
    return (req, file, callback) => {
        if (file.size > maxSize) {
            return callback(new common_1.BadRequestException(`File size exceeds ${maxSize} bytes.`), false);
        }
        callback(null, true);
    };
}


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

/***/ "./src/config/database.config.ts":
/*!***************************************!*\
  !*** ./src/config/database.config.ts ***!
  \***************************************/
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
const dotenv_1 = __webpack_require__(/*! dotenv */ "dotenv");
const path = __importStar(__webpack_require__(/*! path */ "path"));
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

/***/ "./src/config/logger.config.ts":
/*!*************************************!*\
  !*** ./src/config/logger.config.ts ***!
  \*************************************/
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
const winston = __importStar(__webpack_require__(/*! winston */ "winston"));
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

/***/ "./src/difficulty-scaling/difficulty-scaling.module.ts":
/*!*************************************************************!*\
  !*** ./src/difficulty-scaling/difficulty-scaling.module.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DifficultyScalingModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const difficulty_scaling_service_1 = __webpack_require__(/*! ./difficulty-scaling.service */ "./src/difficulty-scaling/difficulty-scaling.service.ts");
const player_skill_service_1 = __webpack_require__(/*! ./player-skill.service */ "./src/difficulty-scaling/player-skill.service.ts");
const puzzle_difficulty_service_1 = __webpack_require__(/*! ./puzzle-difficulty.service */ "./src/difficulty-scaling/puzzle-difficulty.service.ts");
let DifficultyScalingModule = class DifficultyScalingModule {
};
exports.DifficultyScalingModule = DifficultyScalingModule;
exports.DifficultyScalingModule = DifficultyScalingModule = __decorate([
    (0, common_1.Module)({
        providers: [difficulty_scaling_service_1.DifficultyScalingService, player_skill_service_1.PlayerSkillService, puzzle_difficulty_service_1.PuzzleDifficultyService],
        exports: [difficulty_scaling_service_1.DifficultyScalingService, player_skill_service_1.PlayerSkillService, puzzle_difficulty_service_1.PuzzleDifficultyService],
    })
], DifficultyScalingModule);


/***/ }),

/***/ "./src/difficulty-scaling/difficulty-scaling.service.ts":
/*!**************************************************************!*\
  !*** ./src/difficulty-scaling/difficulty-scaling.service.ts ***!
  \**************************************************************/
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DifficultyScalingService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const player_skill_service_1 = __webpack_require__(/*! ./player-skill.service */ "./src/difficulty-scaling/player-skill.service.ts");
const puzzle_difficulty_service_1 = __webpack_require__(/*! ./puzzle-difficulty.service */ "./src/difficulty-scaling/puzzle-difficulty.service.ts");
let DifficultyScalingService = class DifficultyScalingService {
    constructor(playerSkillService, puzzleDifficultyService) {
        this.playerSkillService = playerSkillService;
        this.puzzleDifficultyService = puzzleDifficultyService;
    }
    async getRecommendedDifficulty(playerId) {
        const skill = await this.playerSkillService.getPlayerSkill(playerId);
        return Math.min(Math.max(skill + 0.5, 1), 5);
    }
    async getRecommendedDifficultyRange(playerId) {
        const recommended = await this.getRecommendedDifficulty(playerId);
        return {
            min: Math.max(1, recommended - 0.5),
            max: Math.min(5, recommended + 0.5),
        };
    }
};
exports.DifficultyScalingService = DifficultyScalingService;
exports.DifficultyScalingService = DifficultyScalingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof player_skill_service_1.PlayerSkillService !== "undefined" && player_skill_service_1.PlayerSkillService) === "function" ? _a : Object, typeof (_b = typeof puzzle_difficulty_service_1.PuzzleDifficultyService !== "undefined" && puzzle_difficulty_service_1.PuzzleDifficultyService) === "function" ? _b : Object])
], DifficultyScalingService);


/***/ }),

/***/ "./src/difficulty-scaling/player-skill-algorithm.ts":
/*!**********************************************************!*\
  !*** ./src/difficulty-scaling/player-skill-algorithm.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculatePlayerSkill = calculatePlayerSkill;
function calculatePlayerSkill(stats) {
    if (!stats)
        return 1;
    const accuracy = Number(stats.overallAccuracy) || 0;
    const completionRate = stats.totalPuzzlesCompleted / Math.max(1, stats.totalPuzzlesAttempted);
    const avgTime = Number(stats.averageCompletionTime) || 0;
    const normAccuracy = Math.min(accuracy / 100, 1);
    const normCompletion = Math.min(completionRate, 1);
    const normTime = 1 - Math.min(Math.max((avgTime - 60) / 540, 0), 1);
    const skill = 1 + 4 * (0.5 * normAccuracy + 0.3 * normCompletion + 0.2 * normTime);
    return Math.round(skill * 10) / 10;
}


/***/ }),

/***/ "./src/difficulty-scaling/player-skill.service.ts":
/*!********************************************************!*\
  !*** ./src/difficulty-scaling/player-skill.service.ts ***!
  \********************************************************/
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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerSkillService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const user_stats_entity_1 = __webpack_require__(/*! ../users/entities/user-stats.entity */ "./src/users/entities/user-stats.entity.ts");
const player_skill_algorithm_1 = __webpack_require__(/*! ./player-skill-algorithm */ "./src/difficulty-scaling/player-skill-algorithm.ts");
let PlayerSkillService = class PlayerSkillService {
    constructor(userStatsRepository) {
        this.userStatsRepository = userStatsRepository;
    }
    async getPlayerSkill(playerId) {
        const stats = await this.userStatsRepository.findOne({ where: { userId: playerId } });
        return (0, player_skill_algorithm_1.calculatePlayerSkill)(stats);
    }
};
exports.PlayerSkillService = PlayerSkillService;
exports.PlayerSkillService = PlayerSkillService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_stats_entity_1.UserStats)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], PlayerSkillService);


/***/ }),

/***/ "./src/difficulty-scaling/puzzle-difficulty-algorithm.ts":
/*!***************************************************************!*\
  !*** ./src/difficulty-scaling/puzzle-difficulty-algorithm.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculatePuzzleDifficulty = calculatePuzzleDifficulty;
function calculatePuzzleDifficulty(puzzle, ratings) {
    if (!puzzle)
        return 1;
    const completionRate = puzzle.analytics?.completionRate ?? (puzzle.completions / Math.max(1, puzzle.attempts));
    const avgTime = puzzle.averageCompletionTime || 0;
    const votes = { easy: 0, medium: 0, hard: 0, expert: 0 };
    for (const r of ratings) {
        if (r.difficultyVote && votes.hasOwnProperty(r.difficultyVote)) {
            votes[r.difficultyVote]++;
        }
    }
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
    const voteScore = (votes.easy * 1 + votes.medium * 2 + votes.hard * 3 + votes.expert * 4) / totalVotes;
    const normCompletion = 1 - Math.min(completionRate, 1);
    const normTime = Math.min(Math.max((avgTime - 60) / 540, 0), 1);
    const difficulty = 1 + 4 * (0.4 * normCompletion + 0.3 * normTime + 0.3 * (voteScore / 4));
    return Math.round(difficulty * 10) / 10;
}


/***/ }),

/***/ "./src/difficulty-scaling/puzzle-difficulty.service.ts":
/*!*************************************************************!*\
  !*** ./src/difficulty-scaling/puzzle-difficulty.service.ts ***!
  \*************************************************************/
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzleDifficultyService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const puzzle_entity_1 = __webpack_require__(/*! ../puzzles/entities/puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
const puzzle_rating_entity_1 = __webpack_require__(/*! ../puzzles/entities/puzzle-rating.entity */ "./src/puzzles/entities/puzzle-rating.entity.ts");
const puzzle_difficulty_algorithm_1 = __webpack_require__(/*! ./puzzle-difficulty-algorithm */ "./src/difficulty-scaling/puzzle-difficulty-algorithm.ts");
let PuzzleDifficultyService = class PuzzleDifficultyService {
    constructor(puzzleRepository, puzzleRatingRepository) {
        this.puzzleRepository = puzzleRepository;
        this.puzzleRatingRepository = puzzleRatingRepository;
    }
    async getPuzzleDifficulty(puzzleId) {
        const puzzle = await this.puzzleRepository.findOne({ where: { id: puzzleId } });
        const ratings = await this.puzzleRatingRepository.find({ where: { puzzleId } });
        return (0, puzzle_difficulty_algorithm_1.calculatePuzzleDifficulty)(puzzle, ratings);
    }
};
exports.PuzzleDifficultyService = PuzzleDifficultyService;
exports.PuzzleDifficultyService = PuzzleDifficultyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(puzzle_entity_1.Puzzle)),
    __param(1, (0, typeorm_1.InjectRepository)(puzzle_rating_entity_1.PuzzleRating)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], PuzzleDifficultyService);


/***/ }),

/***/ "./src/game-engine/entities/game-session.entity.ts":
/*!*********************************************************!*\
  !*** ./src/game-engine/entities/game-session.entity.ts ***!
  \*********************************************************/
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
exports.GameSession = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
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
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], GameSession.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], GameSession.prototype, "sessionData", void 0);
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
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], GameSession.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
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
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], GameSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], GameSession.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.gameSessions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_f = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _f : Object)
], GameSession.prototype, "user", void 0);
exports.GameSession = GameSession = __decorate([
    (0, typeorm_1.Entity)('game_sessions'),
    (0, typeorm_1.Index)(['userId', 'startTime']),
    (0, typeorm_1.Index)(['sessionId'], { unique: true }),
    (0, typeorm_1.Index)(['userId', 'isActive']),
    (0, typeorm_1.Index)(['endTime'])
], GameSession);


/***/ }),

/***/ "./src/game-logic/entities/puzzle-progress.entity.ts":
/*!***********************************************************!*\
  !*** ./src/game-logic/entities/puzzle-progress.entity.ts ***!
  \***********************************************************/
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
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
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

/***/ "./src/hints/algorithms/engine.ts":
/*!****************************************!*\
  !*** ./src/hints/algorithms/engine.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateAlgorithmicHints = generateAlgorithmicHints;
function generateAlgorithmicHints(ctx) {
    const { puzzleType, difficulty, puzzleState, playerState } = ctx;
    const progress = puzzleState?.progress ?? 0;
    const errors = puzzleState?.errors ?? [];
    const generic = {
        order: 1,
        type: 'general',
        content: baseGuidance(puzzleType, difficulty),
    };
    const contextual = {
        order: 2,
        type: 'contextual',
        content: contextualGuidance(puzzleType, progress, errors),
    };
    const strategic = {
        order: 3,
        type: 'strategic',
        content: strategicGuidance(puzzleType, difficulty),
    };
    const specific = {
        order: 4,
        type: 'specific',
        content: specificNudge(puzzleType, puzzleState),
    };
    specific.content = maskPotentialSpoilers(specific.content);
    return [generic, contextual, strategic, specific];
}
function baseGuidance(type, difficulty) {
    switch (type) {
        case 'multiple-choice':
            return 'Eliminate clearly wrong options first to narrow your choices.';
        case 'fill-blank':
            return 'Break the problem into smaller parts and verify each piece.';
        case 'drag-drop':
            return 'Group related items before placing them to see patterns.';
        case 'code':
            return 'Recreate the failing case in a minimal example and test iteratively.';
        case 'visual':
            return 'Scan for symmetry and repeated shapes; start from the edges.';
        case 'logic-grid':
            return 'Use process of elimination and mark contradictions immediately.';
    }
}
function contextualGuidance(type, progress, errors) {
    if (progress < 0.33) {
        return 'Focus on the initial constraints before exploring alternatives.';
    }
    if (errors?.length) {
        return `Review recent steps; watch out for: ${errors.slice(0, 2).join(', ')}.`;
    }
    return 'You are on track—double-check the last step for consistency.';
}
function strategicGuidance(type, difficulty) {
    if (difficulty === 'hard' || difficulty === 'expert') {
        return 'Consider tackling sub-problems first and merging insights later.';
    }
    return 'Try a simpler path first; verify assumptions before proceeding.';
}
function specificNudge(type, puzzleState) {
    switch (type) {
        case 'multiple-choice':
            return 'Re-check the option contradicting the main clue from earlier.';
        case 'logic-grid':
            return 'Look at the intersection of the two most constrained categories.';
        case 'code':
            return 'Inspect boundary conditions around the input size and null handling.';
        default:
            return 'Revisit the step where your approach first diverged.';
    }
}
function maskPotentialSpoilers(text) {
    return text.replace(/[A-Z]\)/g, 'option').replace(/\b\d+\b/g, 'n');
}


/***/ }),

/***/ "./src/hints/dto/create-hint.dto.ts":
/*!******************************************!*\
  !*** ./src/hints/dto/create-hint.dto.ts ***!
  \******************************************/
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
exports.HintUsageDto = exports.RequestHintDto = exports.CreateHintDto = exports.HintType = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
var HintType;
(function (HintType) {
    HintType["GENERAL"] = "general";
    HintType["CONTEXTUAL"] = "contextual";
    HintType["STRATEGIC"] = "strategic";
    HintType["SPECIFIC"] = "specific";
    HintType["TUTORIAL"] = "tutorial";
})(HintType || (exports.HintType = HintType = {}));
class CreateHintDto {
}
exports.CreateHintDto = CreateHintDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateHintDto.prototype, "puzzleId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateHintDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(HintType),
    __metadata("design:type", String)
], CreateHintDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHintDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateHintDto.prototype, "contextualData", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateHintDto.prototype, "cost", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateHintDto.prototype, "pointsPenalty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateHintDto.prototype, "unlockAfterSeconds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateHintDto.prototype, "unlockAfterAttempts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateHintDto.prototype, "skillLevelTarget", void 0);
class RequestHintDto {
}
exports.RequestHintDto = RequestHintDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestHintDto.prototype, "puzzleId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestHintDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RequestHintDto.prototype, "attemptNumber", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RequestHintDto.prototype, "timeSpent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RequestHintDto.prototype, "playerState", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RequestHintDto.prototype, "puzzleState", void 0);
class HintUsageDto {
}
exports.HintUsageDto = HintUsageDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HintUsageDto.prototype, "hintId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HintUsageDto.prototype, "puzzleId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HintUsageDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], HintUsageDto.prototype, "attemptNumber", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], HintUsageDto.prototype, "timeSpent", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], HintUsageDto.prototype, "ledToCompletion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HintUsageDto.prototype, "timeToCompletion", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], HintUsageDto.prototype, "satisfactionRating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], HintUsageDto.prototype, "playerState", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], HintUsageDto.prototype, "puzzleState", void 0);


/***/ }),

/***/ "./src/hints/entities/hint-template.entity.ts":
/*!****************************************************!*\
  !*** ./src/hints/entities/hint-template.entity.ts ***!
  \****************************************************/
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HintTemplate = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let HintTemplate = class HintTemplate {
};
exports.HintTemplate = HintTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], HintTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], HintTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], HintTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], HintTemplate.prototype, "puzzleType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], HintTemplate.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], HintTemplate.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], HintTemplate.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], HintTemplate.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], HintTemplate.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], HintTemplate.prototype, "variables", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], HintTemplate.prototype, "conditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], HintTemplate.prototype, "cost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], HintTemplate.prototype, "pointsPenalty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], HintTemplate.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], HintTemplate.prototype, "usageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], HintTemplate.prototype, "effectiveness", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], HintTemplate.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], HintTemplate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], HintTemplate.prototype, "updatedAt", void 0);
exports.HintTemplate = HintTemplate = __decorate([
    (0, typeorm_1.Entity)('hint_templates'),
    (0, typeorm_1.Index)(['puzzleType', 'difficulty']),
    (0, typeorm_1.Index)(['category', 'isActive'])
], HintTemplate);


/***/ }),

/***/ "./src/hints/entities/hint-usage.entity.ts":
/*!*************************************************!*\
  !*** ./src/hints/entities/hint-usage.entity.ts ***!
  \*************************************************/
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
exports.HintUsage = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let HintUsage = class HintUsage {
};
exports.HintUsage = HintUsage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], HintUsage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], HintUsage.prototype, "hintId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], HintUsage.prototype, "puzzleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], HintUsage.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], HintUsage.prototype, "attemptNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], HintUsage.prototype, "timeSpent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HintUsage.prototype, "ledToCompletion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], HintUsage.prototype, "timeToCompletion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], HintUsage.prototype, "satisfactionRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], HintUsage.prototype, "playerState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], HintUsage.prototype, "puzzleState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HintUsage.prototype, "isAbuseAttempt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HintUsage.prototype, "abuseReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], HintUsage.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], HintUsage.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => 'Hint', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'hintId' }),
    __metadata("design:type", Object)
], HintUsage.prototype, "hint", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => 'Puzzle', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'puzzleId' }),
    __metadata("design:type", Object)
], HintUsage.prototype, "puzzle", void 0);
exports.HintUsage = HintUsage = __decorate([
    (0, typeorm_1.Entity)('hint_usages'),
    (0, typeorm_1.Index)(['userId', 'puzzleId']),
    (0, typeorm_1.Index)(['hintId', 'createdAt'])
], HintUsage);


/***/ }),

/***/ "./src/hints/entities/hint.entity.ts":
/*!*******************************************!*\
  !*** ./src/hints/entities/hint.entity.ts ***!
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Hint = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Hint = class Hint {
};
exports.Hint = Hint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Hint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Hint.prototype, "puzzleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Hint.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Hint.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Hint.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Hint.prototype, "contextualData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Hint.prototype, "cost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Hint.prototype, "pointsPenalty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Hint.prototype, "unlockAfterSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Hint.prototype, "unlockAfterAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Hint.prototype, "skillLevelTarget", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Hint.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Hint.prototype, "effectiveness", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Hint.prototype, "usageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Hint.prototype, "successCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Hint.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Hint.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Hint.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => 'Puzzle', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'puzzleId' }),
    __metadata("design:type", Object)
], Hint.prototype, "puzzle", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => HintUsage, (usage) => usage.hint),
    __metadata("design:type", Array)
], Hint.prototype, "usages", void 0);
exports.Hint = Hint = __decorate([
    (0, typeorm_1.Entity)('hints'),
    (0, typeorm_1.Index)(['puzzleId', 'order']),
    (0, typeorm_1.Index)(['type', 'difficulty'])
], Hint);


/***/ }),

/***/ "./src/hints/hints.controller.ts":
/*!***************************************!*\
  !*** ./src/hints/hints.controller.ts ***!
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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HintsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const hints_service_1 = __webpack_require__(/*! ./hints.service */ "./src/hints/hints.service.ts");
const create_hint_dto_1 = __webpack_require__(/*! ./dto/create-hint.dto */ "./src/hints/dto/create-hint.dto.ts");
let HintsController = class HintsController {
    constructor(hintsService) {
        this.hintsService = hintsService;
    }
    async create(dto) {
        return this.hintsService.createHint(dto);
    }
    async request(dto) {
        return this.hintsService.requestHint(dto);
    }
    async recordUsage(dto) {
        return this.hintsService.recordUsage(dto);
    }
    async listTemplates(puzzleType, difficulty, activeOnly) {
        return this.hintsService.listTemplates({
            puzzleType,
            difficulty,
            activeOnly: activeOnly ? activeOnly === 'true' : undefined,
        });
    }
    async updateTemplate(id, body) {
        return this.hintsService.updateTemplate(id, body);
    }
    async toggleTemplate(id, active) {
        return this.hintsService.toggleTemplate(id, active === 'true');
    }
    async seedTemplates() {
        return this.hintsService.seedDefaultTemplates();
    }
};
exports.HintsController = HintsController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_hint_dto_1.CreateHintDto !== "undefined" && create_hint_dto_1.CreateHintDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], HintsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof create_hint_dto_1.RequestHintDto !== "undefined" && create_hint_dto_1.RequestHintDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], HintsController.prototype, "request", null);
__decorate([
    (0, common_1.Post)('usage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof create_hint_dto_1.HintUsageDto !== "undefined" && create_hint_dto_1.HintUsageDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], HintsController.prototype, "recordUsage", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, common_1.Query)('puzzleType')),
    __param(1, (0, common_1.Query)('difficulty')),
    __param(2, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HintsController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Patch)('templates'),
    __param(0, (0, common_1.Query)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HintsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Post)('templates/toggle'),
    __param(0, (0, common_1.Query)('id')),
    __param(1, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HintsController.prototype, "toggleTemplate", null);
__decorate([
    (0, common_1.Post)('templates/seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HintsController.prototype, "seedTemplates", null);
exports.HintsController = HintsController = __decorate([
    (0, common_1.Controller)('hints'),
    __metadata("design:paramtypes", [typeof (_a = typeof hints_service_1.HintsService !== "undefined" && hints_service_1.HintsService) === "function" ? _a : Object])
], HintsController);


/***/ }),

/***/ "./src/hints/hints.module.ts":
/*!***********************************!*\
  !*** ./src/hints/hints.module.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HintsModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const hints_service_1 = __webpack_require__(/*! ./hints.service */ "./src/hints/hints.service.ts");
const hints_controller_1 = __webpack_require__(/*! ./hints.controller */ "./src/hints/hints.controller.ts");
const hint_entity_1 = __webpack_require__(/*! ./entities/hint.entity */ "./src/hints/entities/hint.entity.ts");
const hint_usage_entity_1 = __webpack_require__(/*! ./entities/hint-usage.entity */ "./src/hints/entities/hint-usage.entity.ts");
const hint_template_entity_1 = __webpack_require__(/*! ./entities/hint-template.entity */ "./src/hints/entities/hint-template.entity.ts");
const puzzles_module_1 = __webpack_require__(/*! ../puzzles/puzzles.module */ "./src/puzzles/puzzles.module.ts");
let HintsModule = class HintsModule {
};
exports.HintsModule = HintsModule;
exports.HintsModule = HintsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([hint_entity_1.Hint, hint_usage_entity_1.HintUsage, hint_template_entity_1.HintTemplate]),
            puzzles_module_1.PuzzlesModule,
        ],
        controllers: [hints_controller_1.HintsController],
        providers: [hints_service_1.HintsService],
        exports: [hints_service_1.HintsService],
    })
], HintsModule);


/***/ }),

/***/ "./src/hints/hints.service.ts":
/*!************************************!*\
  !*** ./src/hints/hints.service.ts ***!
  \************************************/
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
exports.HintsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const hint_entity_1 = __webpack_require__(/*! ./entities/hint.entity */ "./src/hints/entities/hint.entity.ts");
const hint_usage_entity_1 = __webpack_require__(/*! ./entities/hint-usage.entity */ "./src/hints/entities/hint-usage.entity.ts");
const hint_template_entity_1 = __webpack_require__(/*! ./entities/hint-template.entity */ "./src/hints/entities/hint-template.entity.ts");
const create_hint_dto_1 = __webpack_require__(/*! ./dto/create-hint.dto */ "./src/hints/dto/create-hint.dto.ts");
const engine_1 = __webpack_require__(/*! ./algorithms/engine */ "./src/hints/algorithms/engine.ts");
let HintsService = class HintsService {
    constructor(hintRepo, usageRepo, templateRepo) {
        this.hintRepo = hintRepo;
        this.usageRepo = usageRepo;
        this.templateRepo = templateRepo;
    }
    async createHint(dto) {
        const hint = this.hintRepo.create({
            ...dto,
            type: dto.type,
            skillLevelTarget: dto.skillLevelTarget ?? {},
            contextualData: dto.contextualData,
        });
        return this.hintRepo.save(hint);
    }
    async requestHint(dto) {
        this.assertNotAbusing(dto);
        await this.enforceHintLimits(dto.userId, dto.puzzleId);
        const where = {
            puzzleId: dto.puzzleId,
            isActive: true,
        };
        const candidates = await this.hintRepo.find({
            where,
            order: { order: 'ASC' },
        });
        if (candidates.length === 0) {
            const generated = await this.generateFromTemplates(dto);
            if (!generated) {
                throw new common_1.BadRequestException('No hints available for this puzzle');
            }
            return generated;
        }
        const priorCount = await this.usageRepo.count({
            where: { userId: dto.userId, puzzleId: dto.puzzleId },
        });
        const progressive = candidates.find((h) => h.order > priorCount) ?? candidates[candidates.length - 1];
        const filtered = this.rankByContextAndPersonalization(candidates, dto, progressive.order);
        const selected = filtered[0];
        await this.recordUsageInternal({
            hintId: selected.id,
            puzzleId: dto.puzzleId,
            userId: dto.userId,
            attemptNumber: dto.attemptNumber,
            timeSpent: dto.timeSpent,
            ledToCompletion: false,
            satisfactionRating: 3,
            playerState: dto.playerState,
            puzzleState: dto.puzzleState,
        });
        void this.hintRepo.update(selected.id, {
            usageCount: (selected.usageCount ?? 0) + 1,
            analytics: {
                ...selected.analytics,
            },
        });
        return selected;
    }
    async recordUsage(dto) {
        const usage = await this.recordUsageInternal(dto);
        const hint = await this.hintRepo.findOne({ where: { id: dto.hintId } });
        if (hint) {
            const successCount = (hint.successCount ?? 0) + (dto.ledToCompletion ? 1 : 0);
            const usageCount = (hint.usageCount ?? 0) + 1;
            const completionRate = successCount > 0 ? successCount / usageCount : 0;
            const effectiveness = Math.min(1, Math.max(0, 0.6 * completionRate + 0.4 * (dto.satisfactionRating / 5)));
            await this.hintRepo.update(hint.id, {
                successCount,
                usageCount,
                effectiveness,
                analytics: {
                    ...hint.analytics,
                    completionRate,
                },
            });
        }
        return usage;
    }
    async listTemplates(params) {
        const where = {};
        if (params?.puzzleType)
            where.puzzleType = params.puzzleType;
        if (params?.difficulty)
            where.difficulty = params.difficulty;
        if (params?.activeOnly)
            where.isActive = true;
        return this.templateRepo.find({ where, order: { order: 'ASC' } });
    }
    async createTemplate(input) {
        const template = this.templateRepo.create({
            ...input,
            isActive: input.isActive ?? true,
            usageCount: 0,
            effectiveness: 0,
            analytics: {},
        });
        return this.templateRepo.save(template);
    }
    async updateTemplate(id, input) {
        const existing = await this.templateRepo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.BadRequestException('Template not found');
        const updated = { ...existing, ...input, id: existing.id };
        await this.templateRepo.save(updated);
        return updated;
    }
    async toggleTemplate(id, isActive) {
        const existing = await this.templateRepo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.BadRequestException('Template not found');
        existing.isActive = isActive;
        return this.templateRepo.save(existing);
    }
    async seedDefaultTemplates() {
        const defaults = [
            {
                name: 'MCQ General 1',
                description: 'General guidance for MCQ without spoilers',
                puzzleType: 'multiple-choice',
                category: 'general',
                difficulty: 'medium',
                order: 1,
                type: 'general',
                template: 'Eliminate obviously wrong options and compare remaining choices.',
                variables: {},
                conditions: {},
                cost: 0,
                pointsPenalty: 0,
                isActive: true,
            },
            {
                name: 'Logic Grid Context 2',
                description: 'Contextual nudge based on constraints',
                puzzleType: 'logic-grid',
                category: 'contextual',
                difficulty: 'medium',
                order: 2,
                type: 'contextual',
                template: 'Look again at the constraint linking {{currentStep}}; resolve contradictions first.',
                variables: { currentStep: { type: 'string', description: 'Current solving focus', required: false } },
                conditions: {},
                cost: 0,
                pointsPenalty: 0,
                isActive: true,
            },
            {
                name: 'Code Strategic 3',
                description: 'Strategy hint for code puzzles',
                puzzleType: 'code',
                category: 'strategic',
                difficulty: 'hard',
                order: 3,
                type: 'strategic',
                template: 'Create a minimal repro for the failing case and add an assertion around {{progress}}.',
                variables: { progress: { type: 'number', description: 'Progress percent', required: false } },
                conditions: { minSkillLevel: 2 },
                cost: 1,
                pointsPenalty: 0,
                isActive: true,
            },
            {
                name: 'Visual Specific 4',
                description: 'Specific but non-spoiling nudge',
                puzzleType: 'visual',
                category: 'specific',
                difficulty: 'easy',
                order: 4,
                type: 'specific',
                template: 'Focus on the outer boundary; check repeated shapes before moving inward.',
                variables: {},
                conditions: {},
                cost: 2,
                pointsPenalty: 1,
                isActive: true,
            },
        ];
        let created = 0;
        for (const d of defaults) {
            const exists = await this.templateRepo.findOne({ where: { name: d.name } });
            if (!exists) {
                const t = this.templateRepo.create(d);
                await this.templateRepo.save(t);
                created += 1;
            }
        }
        return { created };
    }
    async generateFromTemplates(dto) {
        const puzzleType = dto.puzzleState?.type ?? 'logic-grid';
        const difficulty = dto.puzzleState?.difficulty ?? 'medium';
        const templates = await this.listTemplates({ puzzleType, difficulty, activeOnly: true });
        if (templates.length === 0) {
            const alg = (0, engine_1.generateAlgorithmicHints)({
                puzzleType: dto.puzzleState?.type ?? 'logic-grid',
                difficulty: dto.puzzleState?.difficulty ?? 'medium',
                puzzleState: dto.puzzleState,
                playerState: dto.playerState,
            });
            if (!alg.length)
                return null;
            const chosen = alg[0];
            const hint = this.hintRepo.create({
                puzzleId: dto.puzzleId,
                order: chosen.order,
                type: chosen.type,
                content: chosen.content,
                cost: 0,
                pointsPenalty: 0,
                isActive: true,
                skillLevelTarget: {},
            });
            return this.hintRepo.save(hint);
        }
        const priorCount = await this.usageRepo.count({ where: { userId: dto.userId, puzzleId: dto.puzzleId } });
        const selectedTemplate = templates.find((t) => t.order > priorCount) ?? templates[templates.length - 1];
        const content = this.fillTemplate(selectedTemplate.template, {
            progress: dto.puzzleState?.progress ?? 0,
            errors: dto.puzzleState?.errors ?? [],
            currentStep: dto.puzzleState?.currentStep ?? 'start',
        });
        const hint = this.hintRepo.create({
            puzzleId: dto.puzzleId,
            order: selectedTemplate.order,
            type: selectedTemplate.type,
            content,
            cost: selectedTemplate.cost ?? 0,
            pointsPenalty: selectedTemplate.pointsPenalty ?? 0,
            isActive: true,
            skillLevelTarget: selectedTemplate.conditions
                ? { minLevel: selectedTemplate.conditions.minSkillLevel, maxLevel: selectedTemplate.conditions.maxSkillLevel }
                : {},
        });
        return this.hintRepo.save(hint);
    }
    fillTemplate(template, vars) {
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
            const value = vars[key];
            if (Array.isArray(value))
                return value.join(', ');
            if (value === undefined || value === null)
                return '';
            return String(value);
        });
    }
    rankByContextAndPersonalization(candidates, dto, minOrder) {
        const skill = dto.playerState?.skillLevel ?? 0;
        const prevHints = dto.playerState?.previousHintsUsed ?? 0;
        const time = dto.timeSpent ?? 0;
        const attempt = dto.attemptNumber ?? 1;
        const orderWeight = 3;
        const typeWeight = 2;
        const personalizationWeight = 2;
        const effectivenessWeight = 1;
        const typeBaseScore = (t) => {
            switch (t) {
                case create_hint_dto_1.HintType.GENERAL:
                    return 3;
                case create_hint_dto_1.HintType.CONTEXTUAL:
                    return 4;
                case create_hint_dto_1.HintType.STRATEGIC:
                    return 4;
                case create_hint_dto_1.HintType.SPECIFIC:
                    return 1;
                case create_hint_dto_1.HintType.TUTORIAL:
                    return attempt <= 1 ? 5 : 2;
                default:
                    return 2;
            }
        };
        const scored = candidates
            .filter((h) => h.order >= minOrder)
            .map((h) => {
            const typeScore = typeBaseScore(h.type);
            const inRange = this.isSkillInRange(skill, h.skillLevelTarget);
            const personalizationScore = inRange ? 1 : 0;
            const effScore = Number(h.effectiveness ?? 0);
            const orderScore = 1 / (1 + Math.max(0, h.order - minOrder));
            const score = orderWeight * orderScore +
                typeWeight * typeScore +
                personalizationWeight * personalizationScore +
                effectivenessWeight * effScore +
                (time > 120 ? 0.5 : 0) +
                (prevHints > 0 ? -0.2 * prevHints : 0);
            return { h, score };
        })
            .sort((a, b) => b.score - a.score)
            .map((x) => x.h);
        return scored.length > 0 ? scored : candidates;
    }
    isSkillInRange(skill, target) {
        if (!target)
            return true;
        const min = target.minLevel ?? -Infinity;
        const max = target.maxLevel ?? Infinity;
        return skill >= min && skill <= max;
    }
    async enforceHintLimits(userId, puzzleId) {
        const now = new Date();
        const since = new Date(now.getTime() - 15 * 1000);
        const count = await this.usageRepo.count({ where: { userId, puzzleId } });
        if (count >= 3) {
            throw new common_1.ForbiddenException('Hint limit reached for this puzzle');
        }
        const recent = await this.usageRepo.find({
            where: {
                userId,
                puzzleId,
                createdAt: (0, typeorm_2.MoreThanOrEqual)(since),
            },
            order: { createdAt: 'DESC' },
            take: 1,
        });
        if (recent.length > 0) {
            throw new common_1.ForbiddenException('Please wait before requesting another hint');
        }
    }
    assertNotAbusing(dto) {
        const rapidAttempts = dto.attemptNumber > 5 && (dto.timeSpent ?? 0) < 5;
        if (rapidAttempts) {
            throw new common_1.ForbiddenException('Hint abuse detected');
        }
    }
    async recordUsageInternal(dto) {
        const usage = this.usageRepo.create({
            ...dto,
            isAbuseAttempt: false,
        });
        return this.usageRepo.save(usage);
    }
};
exports.HintsService = HintsService;
exports.HintsService = HintsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hint_entity_1.Hint)),
    __param(1, (0, typeorm_1.InjectRepository)(hint_usage_entity_1.HintUsage)),
    __param(2, (0, typeorm_1.InjectRepository)(hint_template_entity_1.HintTemplate)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object])
], HintsService);


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const nest_winston_1 = __webpack_require__(/*! nest-winston */ "nest-winston");
const helmet_1 = __importDefault(__webpack_require__(/*! helmet */ "helmet"));
const app_module_1 = __webpack_require__(/*! ./app.module */ "./src/app.module.ts");
const http_exception_filter_1 = __webpack_require__(/*! ./common/exceptions/http-exception.filter */ "./src/common/exceptions/http-exception.filter.ts");
const sanitize_interceptor_1 = __webpack_require__(/*! ./common/interceptors/sanitize.interceptor */ "./src/common/interceptors/sanitize.interceptor.ts");
const Sentry = __importStar(__webpack_require__(/*! @sentry/node */ "@sentry/node"));
const throttler_1 = __webpack_require__(/*! @nestjs/throttler */ "@nestjs/throttler");
async function bootstrap() {
    Sentry.init({
        dsn: process.env.SENTRY_DSN || '',
        tracesSampleRate: 1.0,
        environment: process.env.NODE_ENV || 'development',
    });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const logger = app.get(nest_winston_1.WINSTON_MODULE_NEST_PROVIDER);
    app.useLogger(logger);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port') || 3000;
    const apiPrefix = configService.get('app.apiPrefix') || 'api/v1';
    const corsOrigin = configService.get('app.cors.origin') || 'http://localhost:3000';
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
        crossOriginEmbedderPolicy: false,
    }));
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
    }));
    app.useGlobalGuards(new throttler_1.ThrottlerGuard());
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new sanitize_interceptor_1.SanitizeInterceptor());
    app.setGlobalPrefix(apiPrefix);
    await app.listen(port);
    logger.log(`🚀 LogiQuest Backend is running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
}
bootstrap().catch((error) => {
    common_1.Logger.error('Failed to start the application', error);
    process.exit(1);
});


/***/ }),

/***/ "./src/monitoring/performance.service.ts":
/*!***********************************************!*\
  !*** ./src/monitoring/performance.service.ts ***!
  \***********************************************/
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


/***/ }),

/***/ "./src/notifications/devices.controller.ts":
/*!*************************************************!*\
  !*** ./src/notifications/devices.controller.ts ***!
  \*************************************************/
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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DevicesController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const typeorm_2 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const device_entity_1 = __webpack_require__(/*! ./entities/device.entity */ "./src/notifications/entities/device.entity.ts");
let DevicesController = class DevicesController {
    constructor(repo) {
        this.repo = repo;
    }
    async register(userId, body) {
        let device = await this.repo.findOne({ where: { token: body.token } });
        if (!device) {
            device = this.repo.create({ userId, token: body.token, platform: body.platform, meta: body.meta ?? {} });
        }
        else {
            device.userId = userId;
            device.platform = body.platform ?? device.platform;
            device.meta = { ...(device.meta ?? {}), ...(body.meta ?? {}) };
        }
        await this.repo.save(device);
        return { ok: true, device };
    }
    async deregister(userId, token) {
        await this.repo.delete({ token, userId });
        return { ok: true };
    }
    async list(userId) {
        const devices = await this.repo.find({ where: { userId } });
        return { ok: true, devices };
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Post)(':userId/register'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "register", null);
__decorate([
    (0, common_1.Delete)(':userId/:token'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "deregister", null);
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "list", null);
exports.DevicesController = DevicesController = __decorate([
    (0, common_1.Controller)('devices'),
    __param(0, (0, typeorm_2.InjectRepository)(device_entity_1.Device)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _a : Object])
], DevicesController);


/***/ }),

/***/ "./src/notifications/dto/create-notification.dto.ts":
/*!**********************************************************!*\
  !*** ./src/notifications/dto/create-notification.dto.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateNotificationDto = void 0;
class CreateNotificationDto {
}
exports.CreateNotificationDto = CreateNotificationDto;


/***/ }),

/***/ "./src/notifications/dto/feedback.dto.ts":
/*!***********************************************!*\
  !*** ./src/notifications/dto/feedback.dto.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationFeedbackDto = void 0;
class NotificationFeedbackDto {
}
exports.NotificationFeedbackDto = NotificationFeedbackDto;


/***/ }),

/***/ "./src/notifications/dto/preference.dto.ts":
/*!*************************************************!*\
  !*** ./src/notifications/dto/preference.dto.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationPreferenceDto = void 0;
class NotificationPreferenceDto {
}
exports.NotificationPreferenceDto = NotificationPreferenceDto;


/***/ }),

/***/ "./src/notifications/email.service.ts":
/*!********************************************!*\
  !*** ./src/notifications/email.service.ts ***!
  \********************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const nodemailer = __importStar(__webpack_require__(/*! nodemailer */ "nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(EmailService_1.name);
        const host = this.config.get('EMAIL_HOST') || 'localhost';
        const port = Number(this.config.get('EMAIL_PORT') || 1025);
        const user = this.config.get('EMAIL_USER') || '';
        const pass = this.config.get('EMAIL_PASS') || '';
        this.transporter = nodemailer.createTransport({ host, port, auth: user ? { user, pass } : undefined });
    }
    async sendEmail(to, subject, text, html) {
        const from = this.config.get('EMAIL_FROM') || 'no-reply@example.com';
        const info = await this.transporter.sendMail({ from, to, subject, text, html });
        this.logger.log(`Email sent to ${to}: ${info.messageId}`);
        return info;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], EmailService);


/***/ }),

/***/ "./src/notifications/entities/device.entity.ts":
/*!*****************************************************!*\
  !*** ./src/notifications/entities/device.entity.ts ***!
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Device = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Device = class Device {
};
exports.Device = Device;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Device.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Device.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Device.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Device.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Device.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Device.prototype, "updatedAt", void 0);
exports.Device = Device = __decorate([
    (0, typeorm_1.Entity)('devices')
], Device);


/***/ }),

/***/ "./src/notifications/entities/notification-delivery.entity.ts":
/*!********************************************************************!*\
  !*** ./src/notifications/entities/notification-delivery.entity.ts ***!
  \********************************************************************/
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
exports.NotificationDelivery = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let NotificationDelivery = class NotificationDelivery {
};
exports.NotificationDelivery = NotificationDelivery;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NotificationDelivery.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], NotificationDelivery.prototype, "notificationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], NotificationDelivery.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], NotificationDelivery.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], NotificationDelivery.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], NotificationDelivery.prototype, "createdAt", void 0);
exports.NotificationDelivery = NotificationDelivery = __decorate([
    (0, typeorm_1.Entity)('notification_deliveries')
], NotificationDelivery);


/***/ }),

/***/ "./src/notifications/entities/notification.entity.ts":
/*!***********************************************************!*\
  !*** ./src/notifications/entities/notification.entity.ts ***!
  \***********************************************************/
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
exports.Notification = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Notification = class Notification {
};
exports.Notification = Notification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Notification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Notification.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Notification.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Notification.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Notification.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Notification.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Notification.prototype, "createdAt", void 0);
exports.Notification = Notification = __decorate([
    (0, typeorm_1.Entity)('notifications')
], Notification);


/***/ }),

/***/ "./src/notifications/notification.service.ts":
/*!***************************************************!*\
  !*** ./src/notifications/notification.service.ts ***!
  \***************************************************/
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
var NotificationService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const typeorm_2 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const notification_entity_1 = __webpack_require__(/*! ./entities/notification.entity */ "./src/notifications/entities/notification.entity.ts");
const notification_delivery_entity_1 = __webpack_require__(/*! ./entities/notification-delivery.entity */ "./src/notifications/entities/notification-delivery.entity.ts");
const user_entity_1 = __webpack_require__(/*! ../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const device_entity_1 = __webpack_require__(/*! ./entities/device.entity */ "./src/notifications/entities/device.entity.ts");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(notificationRepo, deliveryRepo, userRepo, deviceRepo, emailService, scheduler, pushService) {
        this.notificationRepo = notificationRepo;
        this.deliveryRepo = deliveryRepo;
        this.userRepo = userRepo;
        this.deviceRepo = deviceRepo;
        this.emailService = emailService;
        this.scheduler = scheduler;
        this.pushService = pushService;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async notifyAchievementUnlocked(userId, achievement) {
        this.logger.log(`User ${userId} unlocked achievement: ${achievement.name}`);
        const notif = this.notificationRepo.create({
            userId,
            type: 'achievement',
            title: `Achievement unlocked: ${achievement.name}`,
            body: achievement.description,
            meta: { iconUrl: achievement.iconUrl, celebrationMessage: achievement.celebrationMessage },
        });
        await this.notificationRepo.save(notif);
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            return false;
        const prefs = user.preferences?.notifications ?? { email: false, push: false };
        if (prefs.email) {
            try {
                await this.emailService.sendEmail(user.email, `You unlocked ${achievement.name}`, achievement.description);
                await this.recordDelivery(notif.id, 'email', 'sent');
            }
            catch (err) {
                this.logger.error('Email send failed', err);
                await this.recordDelivery(notif.id, 'email', 'failed', String(err));
            }
        }
        if (prefs.push) {
            const devices = await this.deviceRepo.find({ where: { userId } });
            if (devices?.length) {
                for (const d of devices) {
                    const res = await this.pushService.sendToToken(d.token, { title: notif.title, body: notif.body });
                    if (res?.success) {
                        await this.recordDelivery(notif.id, 'push', 'sent', JSON.stringify(res));
                    }
                    else if (res?.queued) {
                        await this.recordDelivery(notif.id, 'push', 'queued');
                    }
                    else {
                        await this.recordDelivery(notif.id, 'push', 'failed', JSON.stringify(res));
                    }
                }
            }
            else {
                await this.recordDelivery(notif.id, 'push', 'no_devices');
            }
        }
        await this.recordDelivery(notif.id, 'in_app', 'delivered');
        return true;
    }
    async createNotificationForUsers(opts) {
        const targets = [];
        if (opts.userIds?.length)
            targets.push(...opts.userIds);
        if (opts.segment) {
            const users = await this.userRepo.find({ where: {} });
            for (const u of users) {
                const val = u.metadata?.[opts.segment.key];
                if (val === opts.segment.value)
                    targets.push(u.id);
            }
        }
        for (const userId of [...new Set(targets)]) {
            const notif = this.notificationRepo.create({
                userId,
                type: opts.type,
                title: opts.title,
                body: opts.body,
                meta: opts.meta ?? {},
                variantId: opts.variantId,
            });
            await this.notificationRepo.save(notif);
            if (opts.sendAt && opts.sendAt > new Date()) {
                const jobName = `notification-send-${notif.id}`;
                const timeout = setTimeout(async () => {
                    await this.dispatchNotification(notif.id);
                    this.scheduler.deleteTimeout(jobName);
                }, opts.sendAt.getTime() - Date.now());
                this.scheduler.addTimeout(jobName, timeout);
                await this.recordDelivery(notif.id, 'scheduler', 'scheduled');
            }
            else {
                await this.dispatchNotification(notif.id);
            }
        }
    }
    async dispatchNotification(notificationId) {
        const notif = await this.notificationRepo.findOne({ where: { id: notificationId } });
        if (!notif)
            return;
        const user = await this.userRepo.findOne({ where: { id: notif.userId } });
        if (!user)
            return;
        const prefs = user.preferences?.notifications ?? { email: false, push: false };
        await this.recordDelivery(notif.id, 'in_app', 'delivered');
        if (prefs.email) {
            try {
                await this.emailService.sendEmail(user.email, notif.title, notif.body ?? '');
                await this.recordDelivery(notif.id, 'email', 'sent');
            }
            catch (err) {
                this.logger.error('Email send failed', err);
                await this.recordDelivery(notif.id, 'email', 'failed', String(err));
            }
        }
        if (prefs.push) {
            const devices = await this.deviceRepo.find({ where: { userId: notif.userId } });
            if (devices?.length) {
                for (const d of devices) {
                    const res = await this.pushService.sendToToken(d.token, { title: notif.title, body: notif.body });
                    if (res?.success) {
                        await this.recordDelivery(notif.id, 'push', 'sent', JSON.stringify(res));
                    }
                    else if (res?.queued) {
                        await this.recordDelivery(notif.id, 'push', 'queued');
                    }
                    else {
                        await this.recordDelivery(notif.id, 'push', 'failed', JSON.stringify(res));
                    }
                }
            }
            else {
                await this.recordDelivery(notif.id, 'push', 'no_devices');
            }
        }
    }
    async recordDelivery(notificationId, channel, status, details) {
        const d = this.deliveryRepo.create({ notificationId, channel, status, details });
        await this.deliveryRepo.save(d);
    }
    async setPreferences(userId, preferencesPatch) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            return null;
        user.preferences = { ...(user.preferences ?? {}), ...preferencesPatch };
        return this.userRepo.save(user);
    }
    async getPreferences(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        return user?.preferences ?? null;
    }
    async recordFeedback(notificationId, userId, feedback) {
        const notif = await this.notificationRepo.findOne({ where: { id: notificationId } });
        if (!notif)
            return null;
        notif.meta = notif.meta ?? {};
        notif.meta.feedback = notif.meta.feedback ?? [];
        notif.meta.feedback.push({ userId, action: feedback.action, comment: feedback.comment, at: new Date() });
        await this.notificationRepo.save(notif);
        await this.recordDelivery(notificationId, 'feedback', 'received', feedback.action);
        return notif;
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_2.InjectRepository)(notification_delivery_entity_1.NotificationDelivery)),
    __param(2, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_2.InjectRepository)(device_entity_1.Device)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _d : Object, Object, Object, Object])
], NotificationService);


/***/ }),

/***/ "./src/notifications/notifications.controller.ts":
/*!*******************************************************!*\
  !*** ./src/notifications/notifications.controller.ts ***!
  \*******************************************************/
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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const notification_service_1 = __webpack_require__(/*! ./notification.service */ "./src/notifications/notification.service.ts");
const create_notification_dto_1 = __webpack_require__(/*! ./dto/create-notification.dto */ "./src/notifications/dto/create-notification.dto.ts");
const preference_dto_1 = __webpack_require__(/*! ./dto/preference.dto */ "./src/notifications/dto/preference.dto.ts");
const feedback_dto_1 = __webpack_require__(/*! ./dto/feedback.dto */ "./src/notifications/dto/feedback.dto.ts");
let NotificationsController = class NotificationsController {
    constructor(service) {
        this.service = service;
    }
    async create(body) {
        await this.service.createNotificationForUsers({
            userIds: body.userIds,
            segment: body.segment,
            type: body.type,
            title: body.title,
            body: body.body,
            meta: body.meta,
            sendAt: body.sendAt ? new Date(body.sendAt) : undefined,
            variantId: body.variantId,
        });
        return { ok: true };
    }
    async setPreferences(userId, prefs) {
        const updated = await this.service.setPreferences(userId, { notifications: prefs });
        return { ok: true, preferences: updated?.preferences };
    }
    async getPreferences(userId) {
        const prefs = await this.service.getPreferences(userId);
        return { ok: true, preferences: prefs };
    }
    async feedback(notificationId, body) {
        const res = await this.service.recordFeedback(notificationId, body.userId ?? 'unknown', { action: body.action, comment: body.comment });
        return { ok: !!res };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_notification_dto_1.CreateNotificationDto !== "undefined" && create_notification_dto_1.CreateNotificationDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':userId/preferences'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof preference_dto_1.NotificationPreferenceDto !== "undefined" && preference_dto_1.NotificationPreferenceDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "setPreferences", null);
__decorate([
    (0, common_1.Get)(':userId/preferences'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Post)(':notificationId/feedback'),
    __param(0, (0, common_1.Param)('notificationId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof feedback_dto_1.NotificationFeedbackDto !== "undefined" && feedback_dto_1.NotificationFeedbackDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "feedback", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [typeof (_a = typeof notification_service_1.NotificationService !== "undefined" && notification_service_1.NotificationService) === "function" ? _a : Object])
], NotificationsController);


/***/ }),

/***/ "./src/notifications/notifications.module.ts":
/*!***************************************************!*\
  !*** ./src/notifications/notifications.module.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationsModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const notification_entity_1 = __webpack_require__(/*! ./entities/notification.entity */ "./src/notifications/entities/notification.entity.ts");
const notification_delivery_entity_1 = __webpack_require__(/*! ./entities/notification-delivery.entity */ "./src/notifications/entities/notification-delivery.entity.ts");
const device_entity_1 = __webpack_require__(/*! ./entities/device.entity */ "./src/notifications/entities/device.entity.ts");
const notification_service_1 = __webpack_require__(/*! ./notification.service */ "./src/notifications/notification.service.ts");
const email_service_1 = __webpack_require__(/*! ./email.service */ "./src/notifications/email.service.ts");
const notifications_controller_1 = __webpack_require__(/*! ./notifications.controller */ "./src/notifications/notifications.controller.ts");
const push_service_1 = __webpack_require__(/*! ./push.service */ "./src/notifications/push.service.ts");
const devices_controller_1 = __webpack_require__(/*! ./devices.controller */ "./src/notifications/devices.controller.ts");
const user_entity_1 = __webpack_require__(/*! ../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([notification_entity_1.Notification, notification_delivery_entity_1.NotificationDelivery, device_entity_1.Device, user_entity_1.User]), config_1.ConfigModule],
        providers: [notification_service_1.NotificationService, email_service_1.EmailService, push_service_1.PushService],
        controllers: [notifications_controller_1.NotificationsController, devices_controller_1.DevicesController],
        exports: [notification_service_1.NotificationService],
    })
], NotificationsModule);


/***/ }),

/***/ "./src/notifications/push.service.ts":
/*!*******************************************!*\
  !*** ./src/notifications/push.service.ts ***!
  \*******************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PushService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PushService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const admin = __importStar(__webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'firebase-admin'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())));
let PushService = PushService_1 = class PushService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(PushService_1.name);
        this.enabled = false;
        const key = this.config.get('FCM_SERVICE_ACCOUNT_JSON');
        if (key) {
            try {
                const serviceAccount = JSON.parse(key);
                admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                this.enabled = true;
                this.logger.log('FCM initialized');
            }
            catch (err) {
                this.logger.error('Failed to initialize FCM', err);
            }
        }
        else {
            this.logger.log('FCM not configured; push disabled');
        }
    }
    async sendToToken(token, payload) {
        if (!this.enabled) {
            this.logger.debug('Push disabled - token would be:', token);
            return { success: false, queued: true };
        }
        try {
            const message = { token, notification: payload.notification };
            const res = await admin.messaging().send(message);
            return { success: true, result: res };
        }
        catch (err) {
            this.logger.error('FCM send failed', err);
            return { success: false, error: err };
        }
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], PushService);


/***/ }),

/***/ "./src/puzzles/community-puzzles.module.ts":
/*!*************************************************!*\
  !*** ./src/puzzles/community-puzzles.module.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommunityPuzzlesModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const schedule_1 = __webpack_require__(/*! @nestjs/schedule */ "@nestjs/schedule");
const jwt_auth_guard_1 = __webpack_require__(/*! ../auth/guards/jwt-auth.guard */ "./src/auth/guards/jwt-auth.guard.ts");
const user_puzzle_submission_entity_1 = __webpack_require__(/*! ./entities/user-puzzle-submission.entity */ "./src/puzzles/entities/user-puzzle-submission.entity.ts");
const puzzle_comment_entity_1 = __webpack_require__(/*! ./entities/puzzle-comment.entity */ "./src/puzzles/entities/puzzle-comment.entity.ts");
const user_puzzle_submission_service_1 = __webpack_require__(/*! ./services/user-puzzle-submission.service */ "./src/puzzles/services/user-puzzle-submission.service.ts");
const puzzle_validation_service_1 = __webpack_require__(/*! ./services/puzzle-validation.service */ "./src/puzzles/services/puzzle-validation.service.ts");
const puzzle_moderation_service_1 = __webpack_require__(/*! ./services/puzzle-moderation.service */ "./src/puzzles/services/puzzle-moderation.service.ts");
const community_puzzles_service_1 = __webpack_require__(/*! ./services/community-puzzles.service */ "./src/puzzles/services/community-puzzles.service.ts");
const featured_puzzles_service_1 = __webpack_require__(/*! ./services/featured-puzzles.service */ "./src/puzzles/services/featured-puzzles.service.ts");
const creator_rewards_service_1 = __webpack_require__(/*! ./services/creator-rewards.service */ "./src/puzzles/services/creator-rewards.service.ts");
const community_puzzles_controller_1 = __webpack_require__(/*! ./controllers/community-puzzles.controller */ "./src/puzzles/controllers/community-puzzles.controller.ts");
let CommunityPuzzlesModule = class CommunityPuzzlesModule {
};
exports.CommunityPuzzlesModule = CommunityPuzzlesModule;
exports.CommunityPuzzlesModule = CommunityPuzzlesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_puzzle_submission_entity_1.UserPuzzleSubmission, puzzle_comment_entity_1.PuzzleComment]),
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [community_puzzles_controller_1.CommunityPuzzlesController],
        providers: [
            user_puzzle_submission_service_1.UserPuzzleSubmissionService,
            puzzle_validation_service_1.PuzzleValidationService,
            puzzle_moderation_service_1.PuzzleModerationService,
            community_puzzles_service_1.CommunityPuzzlesService,
            featured_puzzles_service_1.FeaturedPuzzlesService,
            creator_rewards_service_1.CreatorRewardsService,
            jwt_auth_guard_1.JwtAuthGuard,
        ],
        exports: [
            user_puzzle_submission_service_1.UserPuzzleSubmissionService,
            puzzle_validation_service_1.PuzzleValidationService,
            puzzle_moderation_service_1.PuzzleModerationService,
            community_puzzles_service_1.CommunityPuzzlesService,
            featured_puzzles_service_1.FeaturedPuzzlesService,
            creator_rewards_service_1.CreatorRewardsService,
        ],
    })
], CommunityPuzzlesModule);


/***/ }),

/***/ "./src/puzzles/controllers/community-puzzles.controller.ts":
/*!*****************************************************************!*\
  !*** ./src/puzzles/controllers/community-puzzles.controller.ts ***!
  \*****************************************************************/
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommunityPuzzlesController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const jwt_auth_guard_1 = __webpack_require__(/*! ../../auth/guards/jwt-auth.guard */ "./src/auth/guards/jwt-auth.guard.ts");
const user_puzzle_submission_service_1 = __webpack_require__(/*! ../services/user-puzzle-submission.service */ "./src/puzzles/services/user-puzzle-submission.service.ts");
const community_puzzles_service_1 = __webpack_require__(/*! ../services/community-puzzles.service */ "./src/puzzles/services/community-puzzles.service.ts");
const featured_puzzles_service_1 = __webpack_require__(/*! ../services/featured-puzzles.service */ "./src/puzzles/services/featured-puzzles.service.ts");
const creator_rewards_service_1 = __webpack_require__(/*! ../services/creator-rewards.service */ "./src/puzzles/services/creator-rewards.service.ts");
const puzzle_moderation_service_1 = __webpack_require__(/*! ../services/puzzle-moderation.service */ "./src/puzzles/services/puzzle-moderation.service.ts");
const user_puzzle_submission_dto_1 = __webpack_require__(/*! ../dto/user-puzzle-submission.dto */ "./src/puzzles/dto/user-puzzle-submission.dto.ts");
const community_puzzles_dto_1 = __webpack_require__(/*! ../dto/community-puzzles.dto */ "./src/puzzles/dto/community-puzzles.dto.ts");
let CommunityPuzzlesController = class CommunityPuzzlesController {
    constructor(submissionService, communityService, featuredService, rewardsService, moderationService) {
        this.submissionService = submissionService;
        this.communityService = communityService;
        this.featuredService = featuredService;
        this.rewardsService = rewardsService;
        this.moderationService = moderationService;
    }
    async createSubmission(req, createDto) {
        const submission = await this.submissionService.createSubmission(req.user.id, createDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Puzzle submission created successfully',
            data: submission,
        };
    }
    async getUserSubmissions(req, status, page, limit) {
        const result = await this.submissionService.getUserSubmissions(req.user.id, status, page, limit);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'User submissions retrieved successfully',
            data: result,
        };
    }
    async getSubmission(req, id) {
        const submission = await this.submissionService.getSubmissionById(id, req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Submission retrieved successfully',
            data: submission,
        };
    }
    async updateSubmission(req, id, updateDto) {
        const submission = await this.submissionService.updateSubmission(id, req.user.id, updateDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Submission updated successfully',
            data: submission,
        };
    }
    async deleteSubmission(req, id) {
        await this.submissionService.deleteSubmission(id, req.user.id);
    }
    async submitForReview(req, id, reviewData) {
        const submission = await this.submissionService.submitForReview(id, req.user.id, reviewData);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle submitted for review',
            data: submission,
        };
    }
    async publishPuzzle(req, id) {
        const submission = await this.submissionService.publishPuzzle(id, req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle published successfully',
            data: submission,
        };
    }
    async searchPuzzles(searchDto) {
        const result = await this.submissionService.searchCommunityPuzzles(searchDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzles retrieved successfully',
            data: result,
        };
    }
    async getFeaturedPuzzles(limit) {
        const puzzles = await this.featuredService.getFeaturedPuzzles(limit);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Featured puzzles retrieved successfully',
            data: puzzles,
        };
    }
    async getTrendingPuzzles(limit) {
        const puzzles = await this.submissionService.getTrendingPuzzles(limit);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Trending puzzles retrieved successfully',
            data: puzzles,
        };
    }
    async getRecommendedPuzzles(req, limit) {
        const puzzles = await this.submissionService.getRecommendedPuzzles(req.user.id, limit);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Recommended puzzles retrieved successfully',
            data: puzzles,
        };
    }
    async getPuzzleByShareableLink(shareableLink) {
        const puzzle = await this.submissionService.getSubmissionByShareableLink(shareableLink);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle retrieved successfully',
            data: puzzle,
        };
    }
    async ratePuzzle(req, id, ratingDto) {
        const rating = await this.communityService.ratePuzzle(id, req.user.id, ratingDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Puzzle rated successfully',
            data: rating,
        };
    }
    async getPuzzleRatings(id, page, limit) {
        const result = await this.communityService.getPuzzleRatings(id, page, limit);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle ratings retrieved successfully',
            data: result,
        };
    }
    async getUserRating(req, id) {
        const rating = await this.communityService.getUserRating(id, req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'User rating retrieved successfully',
            data: rating,
        };
    }
    async createComment(req, id, commentDto) {
        const comment = await this.communityService.createComment(id, req.user.id, commentDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Comment created successfully',
            data: comment,
        };
    }
    async getPuzzleComments(id, page, limit) {
        const result = await this.communityService.getPuzzleComments(id, page, limit);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle comments retrieved successfully',
            data: result,
        };
    }
    async updateComment(req, id, updateDto) {
        const comment = await this.communityService.updateComment(id, req.user.id, updateDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Comment updated successfully',
            data: comment,
        };
    }
    async deleteComment(req, id) {
        await this.communityService.deleteComment(id, req.user.id);
    }
    async voteOnComment(req, id, voteDto) {
        const comment = await this.communityService.voteOnComment(id, req.user.id, voteDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vote recorded successfully',
            data: comment,
        };
    }
    async sharePuzzle(req, id, shareDto) {
        const result = await this.communityService.sharePuzzle(id, req.user.id, shareDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle shared successfully',
            data: result,
        };
    }
    async getShareStats(id) {
        const stats = await this.communityService.getShareStats(id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Share statistics retrieved successfully',
            data: stats,
        };
    }
    async reportPuzzle(req, id, reportDto) {
        await this.communityService.reportPuzzle(id, req.user.id, reportDto.reason, reportDto.category);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle reported successfully',
        };
    }
    async reportComment(req, id, reportData) {
        await this.communityService.reportComment(id, req.user.id, reportData.reason);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Comment reported successfully',
        };
    }
    async getCreatorStats(req) {
        const stats = await this.submissionService.getCreatorStats(req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Creator statistics retrieved successfully',
            data: stats,
        };
    }
    async getLeaderboard(limit, timeframe) {
        const leaderboard = await this.rewardsService.getLeaderboard(limit, timeframe);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Leaderboard retrieved successfully',
            data: leaderboard,
        };
    }
    async getTopCreators(limit) {
        const creators = await this.communityService.getTopCreators(limit);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Top creators retrieved successfully',
            data: creators,
        };
    }
    async getMyRewards(req) {
        const stats = await this.rewardsService.getCreatorStats(req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Creator rewards retrieved successfully',
            data: stats,
        };
    }
    async trackPlay(req, id) {
        await this.submissionService.incrementPlayCount(id);
        await this.rewardsService.onPuzzlePlayed(id, req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Play tracked successfully',
        };
    }
    async getModerationQueue(status, page, limit) {
        const result = await this.moderationService.getModerationQueue(status, page, limit);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Moderation queue retrieved successfully',
            data: result,
        };
    }
    async moderatePuzzle(req, id, decisionDto) {
        const submission = await this.moderationService.moderatePuzzle(id, req.user.id, decisionDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle moderated successfully',
            data: submission,
        };
    }
    async featurePuzzle(req, id) {
        const puzzle = await this.featuredService.manuallyFeaturePuzzle(id, req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle featured successfully',
            data: puzzle,
        };
    }
    async unfeaturePuzzle(req, id) {
        const puzzle = await this.featuredService.unfeaturePuzzle(id, req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Puzzle unfeatured successfully',
            data: puzzle,
        };
    }
    async getFeaturedStats() {
        const stats = await this.featuredService.getFeaturedPuzzleStats();
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Featured puzzle statistics retrieved successfully',
            data: stats,
        };
    }
    async getModerationStats(timeframe) {
        const stats = await this.moderationService.getModerationStats(timeframe);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Moderation statistics retrieved successfully',
            data: stats,
        };
    }
};
exports.CommunityPuzzlesController = CommunityPuzzlesController;
__decorate([
    (0, common_1.Post)('submissions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_f = typeof user_puzzle_submission_dto_1.CreatePuzzleSubmissionDto !== "undefined" && user_puzzle_submission_dto_1.CreatePuzzleSubmissionDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "createSubmission", null);
__decorate([
    (0, common_1.Get)('submissions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getUserSubmissions", null);
__decorate([
    (0, common_1.Get)('submissions/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getSubmission", null);
__decorate([
    (0, common_1.Put)('submissions/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_g = typeof user_puzzle_submission_dto_1.UpdatePuzzleSubmissionDto !== "undefined" && user_puzzle_submission_dto_1.UpdatePuzzleSubmissionDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "updateSubmission", null);
__decorate([
    (0, common_1.Delete)('submissions/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "deleteSubmission", null);
__decorate([
    (0, common_1.Post)('submissions/:id/submit-review'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_h = typeof user_puzzle_submission_dto_1.SubmitForReviewDto !== "undefined" && user_puzzle_submission_dto_1.SubmitForReviewDto) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "submitForReview", null);
__decorate([
    (0, common_1.Post)('submissions/:id/publish'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "publishPuzzle", null);
__decorate([
    (0, common_1.Get)('discover'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof community_puzzles_dto_1.SearchPuzzlesDto !== "undefined" && community_puzzles_dto_1.SearchPuzzlesDto) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "searchPuzzles", null);
__decorate([
    (0, common_1.Get)('featured'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getFeaturedPuzzles", null);
__decorate([
    (0, common_1.Get)('trending'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getTrendingPuzzles", null);
__decorate([
    (0, common_1.Get)('recommended'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getRecommendedPuzzles", null);
__decorate([
    (0, common_1.Get)('shared/:shareableLink'),
    __param(0, (0, common_1.Param)('shareableLink')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getPuzzleByShareableLink", null);
__decorate([
    (0, common_1.Post)(':id/rate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_k = typeof community_puzzles_dto_1.CreatePuzzleRatingDto !== "undefined" && community_puzzles_dto_1.CreatePuzzleRatingDto) === "function" ? _k : Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "ratePuzzle", null);
__decorate([
    (0, common_1.Get)(':id/ratings'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getPuzzleRatings", null);
__decorate([
    (0, common_1.Get)(':id/my-rating'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getUserRating", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_l = typeof community_puzzles_dto_1.CreatePuzzleCommentDto !== "undefined" && community_puzzles_dto_1.CreatePuzzleCommentDto) === "function" ? _l : Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "createComment", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getPuzzleComments", null);
__decorate([
    (0, common_1.Put)('comments/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "updateComment", null);
__decorate([
    (0, common_1.Delete)('comments/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Post)('comments/:id/vote'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_m = typeof community_puzzles_dto_1.PuzzleCommentVoteDto !== "undefined" && community_puzzles_dto_1.PuzzleCommentVoteDto) === "function" ? _m : Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "voteOnComment", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_o = typeof community_puzzles_dto_1.SharePuzzleDto !== "undefined" && community_puzzles_dto_1.SharePuzzleDto) === "function" ? _o : Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "sharePuzzle", null);
__decorate([
    (0, common_1.Get)(':id/share-stats'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getShareStats", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_p = typeof community_puzzles_dto_1.ReportPuzzleDto !== "undefined" && community_puzzles_dto_1.ReportPuzzleDto) === "function" ? _p : Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "reportPuzzle", null);
__decorate([
    (0, common_1.Post)('comments/:id/report'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "reportComment", null);
__decorate([
    (0, common_1.Get)('creator-stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getCreatorStats", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('top-creators'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getTopCreators", null);
__decorate([
    (0, common_1.Get)('my-rewards'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getMyRewards", null);
__decorate([
    (0, common_1.Post)(':id/play'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "trackPlay", null);
__decorate([
    (0, common_1.Get)('admin/moderation-queue'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getModerationQueue", null);
__decorate([
    (0, common_1.Post)('admin/:id/moderate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "moderatePuzzle", null);
__decorate([
    (0, common_1.Post)('admin/:id/feature'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "featurePuzzle", null);
__decorate([
    (0, common_1.Post)('admin/:id/unfeature'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "unfeaturePuzzle", null);
__decorate([
    (0, common_1.Get)('admin/featured-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getFeaturedStats", null);
__decorate([
    (0, common_1.Get)('admin/moderation-stats'),
    __param(0, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityPuzzlesController.prototype, "getModerationStats", null);
exports.CommunityPuzzlesController = CommunityPuzzlesController = __decorate([
    (0, common_1.Controller)('community-puzzles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof user_puzzle_submission_service_1.UserPuzzleSubmissionService !== "undefined" && user_puzzle_submission_service_1.UserPuzzleSubmissionService) === "function" ? _a : Object, typeof (_b = typeof community_puzzles_service_1.CommunityPuzzlesService !== "undefined" && community_puzzles_service_1.CommunityPuzzlesService) === "function" ? _b : Object, typeof (_c = typeof featured_puzzles_service_1.FeaturedPuzzlesService !== "undefined" && featured_puzzles_service_1.FeaturedPuzzlesService) === "function" ? _c : Object, typeof (_d = typeof creator_rewards_service_1.CreatorRewardsService !== "undefined" && creator_rewards_service_1.CreatorRewardsService) === "function" ? _d : Object, typeof (_e = typeof puzzle_moderation_service_1.PuzzleModerationService !== "undefined" && puzzle_moderation_service_1.PuzzleModerationService) === "function" ? _e : Object])
], CommunityPuzzlesController);


/***/ }),

/***/ "./src/puzzles/dto/bulk-operations.dto.ts":
/*!************************************************!*\
  !*** ./src/puzzles/dto/bulk-operations.dto.ts ***!
  \************************************************/
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
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
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

/***/ "./src/puzzles/dto/community-puzzles.dto.ts":
/*!**************************************************!*\
  !*** ./src/puzzles/dto/community-puzzles.dto.ts ***!
  \**************************************************/
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
exports.SharePuzzleDto = exports.SearchPuzzlesDto = exports.ReportPuzzleDto = exports.ReportPuzzleCommentDto = exports.PuzzleCommentVoteDto = exports.UpdatePuzzleCommentDto = exports.CreatePuzzleCommentDto = exports.RatingMetadataDto = exports.RatingBreakdownDto = exports.CreatePuzzleRatingDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
class CreatePuzzleRatingDto {
}
exports.CreatePuzzleRatingDto = CreatePuzzleRatingDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreatePuzzleRatingDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 1000),
    __metadata("design:type", String)
], CreatePuzzleRatingDto.prototype, "review", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RatingBreakdownDto),
    __metadata("design:type", RatingBreakdownDto)
], CreatePuzzleRatingDto.prototype, "ratingBreakdown", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RatingMetadataDto),
    __metadata("design:type", RatingMetadataDto)
], CreatePuzzleRatingDto.prototype, "metadata", void 0);
class RatingBreakdownDto {
}
exports.RatingBreakdownDto = RatingBreakdownDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], RatingBreakdownDto.prototype, "creativity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], RatingBreakdownDto.prototype, "clarity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], RatingBreakdownDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], RatingBreakdownDto.prototype, "enjoyment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], RatingBreakdownDto.prototype, "educational", void 0);
class RatingMetadataDto {
}
exports.RatingMetadataDto = RatingMetadataDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RatingMetadataDto.prototype, "playTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RatingMetadataDto.prototype, "hintsUsed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RatingMetadataDto.prototype, "completed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RatingMetadataDto.prototype, "wouldRecommend", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RatingMetadataDto.prototype, "reportReason", void 0);
class CreatePuzzleCommentDto {
}
exports.CreatePuzzleCommentDto = CreatePuzzleCommentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 1000),
    __metadata("design:type", String)
], CreatePuzzleCommentDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePuzzleCommentDto.prototype, "parentId", void 0);
class UpdatePuzzleCommentDto {
}
exports.UpdatePuzzleCommentDto = UpdatePuzzleCommentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 1000),
    __metadata("design:type", String)
], UpdatePuzzleCommentDto.prototype, "content", void 0);
class PuzzleCommentVoteDto {
}
exports.PuzzleCommentVoteDto = PuzzleCommentVoteDto;
__decorate([
    (0, class_validator_1.IsEnum)(['upvote', 'downvote']),
    __metadata("design:type", String)
], PuzzleCommentVoteDto.prototype, "voteType", void 0);
class ReportPuzzleCommentDto {
}
exports.ReportPuzzleCommentDto = ReportPuzzleCommentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(5, 500),
    __metadata("design:type", String)
], ReportPuzzleCommentDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 1000),
    __metadata("design:type", String)
], ReportPuzzleCommentDto.prototype, "additionalDetails", void 0);
class ReportPuzzleDto {
}
exports.ReportPuzzleDto = ReportPuzzleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(5, 500),
    __metadata("design:type", String)
], ReportPuzzleDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['inappropriate', 'copyright', 'spam', 'low_quality', 'duplicate', 'other']),
    __metadata("design:type", String)
], ReportPuzzleDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 1000),
    __metadata("design:type", String)
], ReportPuzzleDto.prototype, "additionalDetails", void 0);
class SearchPuzzlesDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.SearchPuzzlesDto = SearchPuzzlesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 100),
    __metadata("design:type", String)
], SearchPuzzlesDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SearchPuzzlesDto.prototype, "categories", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(['easy', 'medium', 'hard', 'expert'], { each: true }),
    __metadata("design:type", Array)
], SearchPuzzlesDto.prototype, "difficulties", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SearchPuzzlesDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['newest', 'oldest', 'popular', 'highest_rated', 'most_played', 'trending']),
    __metadata("design:type", String)
], SearchPuzzlesDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'published', 'featured']),
    __metadata("design:type", String)
], SearchPuzzlesDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SearchPuzzlesDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SearchPuzzlesDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchPuzzlesDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SearchPuzzlesDto.prototype, "isPublic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SearchPuzzlesDto.prototype, "allowComments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SearchPuzzlesDto.prototype, "allowRatings", void 0);
class SharePuzzleDto {
}
exports.SharePuzzleDto = SharePuzzleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['link', 'embed', 'social']),
    __metadata("design:type", String)
], SharePuzzleDto.prototype, "shareType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['twitter', 'facebook', 'reddit', 'discord', 'whatsapp']),
    __metadata("design:type", String)
], SharePuzzleDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], SharePuzzleDto.prototype, "customMessage", void 0);


/***/ }),

/***/ "./src/puzzles/dto/create-puzzle.dto.ts":
/*!**********************************************!*\
  !*** ./src/puzzles/dto/create-puzzle.dto.ts ***!
  \**********************************************/
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
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
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

/***/ "./src/puzzles/dto/index.ts":
/*!**********************************!*\
  !*** ./src/puzzles/dto/index.ts ***!
  \**********************************/
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
__exportStar(__webpack_require__(/*! ./create-puzzle.dto */ "./src/puzzles/dto/create-puzzle.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./update-puzzle.dto */ "./src/puzzles/dto/update-puzzle.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./search-puzzle.dto */ "./src/puzzles/dto/search-puzzle.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./bulk-operations.dto */ "./src/puzzles/dto/bulk-operations.dto.ts"), exports);


/***/ }),

/***/ "./src/puzzles/dto/search-puzzle.dto.ts":
/*!**********************************************!*\
  !*** ./src/puzzles/dto/search-puzzle.dto.ts ***!
  \**********************************************/
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
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const create_puzzle_dto_1 = __webpack_require__(/*! ./create-puzzle.dto */ "./src/puzzles/dto/create-puzzle.dto.ts");
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

/***/ "./src/puzzles/dto/update-puzzle.dto.ts":
/*!**********************************************!*\
  !*** ./src/puzzles/dto/update-puzzle.dto.ts ***!
  \**********************************************/
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
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_puzzle_dto_1 = __webpack_require__(/*! ./create-puzzle.dto */ "./src/puzzles/dto/create-puzzle.dto.ts");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
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

/***/ "./src/puzzles/dto/user-puzzle-submission.dto.ts":
/*!*******************************************************!*\
  !*** ./src/puzzles/dto/user-puzzle-submission.dto.ts ***!
  \*******************************************************/
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
exports.ModerationDecisionDto = exports.SubmitForReviewDto = exports.UpdatePuzzleSubmissionDto = exports.CreatorNotesDto = exports.SharingSettingsDto = exports.PuzzleHintDto = exports.MediaContentDto = exports.PuzzleContentDto = exports.CreatePuzzleSubmissionDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const user_puzzle_submission_entity_1 = __webpack_require__(/*! ../entities/user-puzzle-submission.entity */ "./src/puzzles/entities/user-puzzle-submission.entity.ts");
class CreatePuzzleSubmissionDto {
    constructor() {
        this.isPublic = false;
        this.allowComments = true;
        this.allowRatings = true;
    }
}
exports.CreatePuzzleSubmissionDto = CreatePuzzleSubmissionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(3, 200),
    __metadata("design:type", String)
], CreatePuzzleSubmissionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(10, 2000),
    __metadata("design:type", String)
], CreatePuzzleSubmissionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(['logic', 'math', 'pattern', 'word', 'spatial', 'memory', 'strategy']),
    __metadata("design:type", String)
], CreatePuzzleSubmissionDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['easy', 'medium', 'hard', 'expert']),
    __metadata("design:type", String)
], CreatePuzzleSubmissionDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreatePuzzleSubmissionDto.prototype, "difficultyRating", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], CreatePuzzleSubmissionDto.prototype, "basePoints", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(60),
    (0, class_validator_1.Max)(3600),
    __metadata("design:type", Number)
], CreatePuzzleSubmissionDto.prototype, "timeLimit", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreatePuzzleSubmissionDto.prototype, "maxHints", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PuzzleContentDto),
    __metadata("design:type", PuzzleContentDto)
], CreatePuzzleSubmissionDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PuzzleHintDto),
    __metadata("design:type", Array)
], CreatePuzzleSubmissionDto.prototype, "hints", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePuzzleSubmissionDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePuzzleSubmissionDto.prototype, "isPublic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePuzzleSubmissionDto.prototype, "allowComments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePuzzleSubmissionDto.prototype, "allowRatings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SharingSettingsDto),
    __metadata("design:type", SharingSettingsDto)
], CreatePuzzleSubmissionDto.prototype, "sharingSettings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CreatorNotesDto),
    __metadata("design:type", CreatorNotesDto)
], CreatePuzzleSubmissionDto.prototype, "creatorNotes", void 0);
class PuzzleContentDto {
}
exports.PuzzleContentDto = PuzzleContentDto;
__decorate([
    (0, class_validator_1.IsEnum)(['multiple-choice', 'fill-blank', 'drag-drop', 'code', 'visual', 'logic-grid']),
    __metadata("design:type", String)
], PuzzleContentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PuzzleContentDto.prototype, "question", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PuzzleContentDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PuzzleContentDto.prototype, "correctAnswer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PuzzleContentDto.prototype, "explanation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MediaContentDto),
    __metadata("design:type", MediaContentDto)
], PuzzleContentDto.prototype, "media", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PuzzleContentDto.prototype, "interactive", void 0);
class MediaContentDto {
}
exports.MediaContentDto = MediaContentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MediaContentDto.prototype, "images", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MediaContentDto.prototype, "videos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MediaContentDto.prototype, "audio", void 0);
class PuzzleHintDto {
}
exports.PuzzleHintDto = PuzzleHintDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PuzzleHintDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(5, 500),
    __metadata("design:type", String)
], PuzzleHintDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], PuzzleHintDto.prototype, "pointsPenalty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PuzzleHintDto.prototype, "unlockAfter", void 0);
class SharingSettingsDto {
    constructor() {
        this.allowShare = true;
        this.embeddable = false;
        this.downloadAllowed = false;
        this.attributionRequired = true;
    }
}
exports.SharingSettingsDto = SharingSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SharingSettingsDto.prototype, "allowShare", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SharingSettingsDto.prototype, "embeddable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SharingSettingsDto.prototype, "downloadAllowed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SharingSettingsDto.prototype, "attributionRequired", void 0);
class CreatorNotesDto {
}
exports.CreatorNotesDto = CreatorNotesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], CreatorNotesDto.prototype, "inspiration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 200),
    __metadata("design:type", String)
], CreatorNotesDto.prototype, "targetAudience", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 100),
    __metadata("design:type", String)
], CreatorNotesDto.prototype, "estimatedTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatorNotesDto.prototype, "learningObjectives", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatorNotesDto.prototype, "prerequisites", void 0);
class UpdatePuzzleSubmissionDto {
}
exports.UpdatePuzzleSubmissionDto = UpdatePuzzleSubmissionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 200),
    __metadata("design:type", String)
], UpdatePuzzleSubmissionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 2000),
    __metadata("design:type", String)
], UpdatePuzzleSubmissionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['logic', 'math', 'pattern', 'word', 'spatial', 'memory', 'strategy']),
    __metadata("design:type", String)
], UpdatePuzzleSubmissionDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['easy', 'medium', 'hard', 'expert']),
    __metadata("design:type", String)
], UpdatePuzzleSubmissionDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], UpdatePuzzleSubmissionDto.prototype, "difficultyRating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], UpdatePuzzleSubmissionDto.prototype, "basePoints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(60),
    (0, class_validator_1.Max)(3600),
    __metadata("design:type", Number)
], UpdatePuzzleSubmissionDto.prototype, "timeLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], UpdatePuzzleSubmissionDto.prototype, "maxHints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", PuzzleContentDto)
], UpdatePuzzleSubmissionDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdatePuzzleSubmissionDto.prototype, "hints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePuzzleSubmissionDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePuzzleSubmissionDto.prototype, "isPublic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePuzzleSubmissionDto.prototype, "allowComments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePuzzleSubmissionDto.prototype, "allowRatings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", SharingSettingsDto)
], UpdatePuzzleSubmissionDto.prototype, "sharingSettings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", CreatorNotesDto)
], UpdatePuzzleSubmissionDto.prototype, "creatorNotes", void 0);
class SubmitForReviewDto {
}
exports.SubmitForReviewDto = SubmitForReviewDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 1000),
    __metadata("design:type", String)
], SubmitForReviewDto.prototype, "reviewerNotes", void 0);
class ModerationDecisionDto {
}
exports.ModerationDecisionDto = ModerationDecisionDto;
__decorate([
    (0, class_validator_1.IsEnum)(user_puzzle_submission_entity_1.ModerationAction),
    __metadata("design:type", typeof (_a = typeof user_puzzle_submission_entity_1.ModerationAction !== "undefined" && user_puzzle_submission_entity_1.ModerationAction) === "function" ? _a : Object)
], ModerationDecisionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 1000),
    __metadata("design:type", String)
], ModerationDecisionDto.prototype, "reviewNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ModerationDecisionDto.prototype, "requiredChanges", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], ModerationDecisionDto.prototype, "qualityScore", void 0);


/***/ }),

/***/ "./src/puzzles/entities/puzzle-comment.entity.ts":
/*!*******************************************************!*\
  !*** ./src/puzzles/entities/puzzle-comment.entity.ts ***!
  \*******************************************************/
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
exports.PuzzleComment = exports.PuzzleCommentStatus = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const user_puzzle_submission_entity_1 = __webpack_require__(/*! ./user-puzzle-submission.entity */ "./src/puzzles/entities/user-puzzle-submission.entity.ts");
var PuzzleCommentStatus;
(function (PuzzleCommentStatus) {
    PuzzleCommentStatus["ACTIVE"] = "active";
    PuzzleCommentStatus["HIDDEN"] = "hidden";
    PuzzleCommentStatus["DELETED"] = "deleted";
    PuzzleCommentStatus["FLAGGED"] = "flagged";
})(PuzzleCommentStatus || (exports.PuzzleCommentStatus = PuzzleCommentStatus = {}));
let PuzzleComment = class PuzzleComment {
};
exports.PuzzleComment = PuzzleComment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PuzzleComment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleComment.prototype, "submissionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_puzzle_submission_entity_1.UserPuzzleSubmission, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'submissionId' }),
    __metadata("design:type", typeof (_a = typeof user_puzzle_submission_entity_1.UserPuzzleSubmission !== "undefined" && user_puzzle_submission_entity_1.UserPuzzleSubmission) === "function" ? _a : Object)
], PuzzleComment.prototype, "submission", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleComment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_b = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _b : Object)
], PuzzleComment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleComment.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PuzzleComment, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parentId' }),
    __metadata("design:type", PuzzleComment)
], PuzzleComment.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], PuzzleComment.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PuzzleCommentStatus, default: PuzzleCommentStatus.ACTIVE }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleComment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], PuzzleComment.prototype, "moderationFlags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], PuzzleComment.prototype, "upvotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PuzzleComment.prototype, "downvotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], PuzzleComment.prototype, "replyCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PuzzleComment.prototype, "isPinned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PuzzleComment.prototype, "isFromCreator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], PuzzleComment.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], PuzzleComment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], PuzzleComment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PuzzleComment, (comment) => comment.parent),
    __metadata("design:type", Array)
], PuzzleComment.prototype, "replies", void 0);
exports.PuzzleComment = PuzzleComment = __decorate([
    (0, typeorm_1.Entity)('puzzle_comments'),
    (0, typeorm_1.Index)(['submissionId', 'status']),
    (0, typeorm_1.Index)(['userId', 'createdAt']),
    (0, typeorm_1.Index)(['parentId'])
], PuzzleComment);


/***/ }),

/***/ "./src/puzzles/entities/puzzle-rating.entity.ts":
/*!******************************************************!*\
  !*** ./src/puzzles/entities/puzzle-rating.entity.ts ***!
  \******************************************************/
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
exports.PuzzleRating = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const puzzle_entity_1 = __webpack_require__(/*! ./puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
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
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PuzzleRating.prototype, "submissionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
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
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], PuzzleRating.prototype, "lastEditedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_d = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _d : Object)
], PuzzleRating.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => puzzle_entity_1.Puzzle, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'puzzleId' }),
    __metadata("design:type", typeof (_e = typeof puzzle_entity_1.Puzzle !== "undefined" && puzzle_entity_1.Puzzle) === "function" ? _e : Object)
], PuzzleRating.prototype, "puzzle", void 0);
exports.PuzzleRating = PuzzleRating = __decorate([
    (0, typeorm_1.Entity)('puzzle_ratings'),
    (0, typeorm_1.Index)(['userId', 'puzzleId'], { unique: true }),
    (0, typeorm_1.Index)(['puzzleId', 'rating'])
], PuzzleRating);


/***/ }),

/***/ "./src/puzzles/entities/puzzle.entity.ts":
/*!***********************************************!*\
  !*** ./src/puzzles/entities/puzzle.entity.ts ***!
  \***********************************************/
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
exports.Puzzle = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Puzzle = class Puzzle {
};
exports.Puzzle = Puzzle;
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Puzzle.prototype, "archivedAt", void 0);
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
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
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
    __metadata("design:type", typeof (_c = typeof Array !== "undefined" && Array) === "function" ? _c : Object)
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
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Puzzle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Puzzle.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
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

/***/ "./src/puzzles/entities/user-puzzle-submission.entity.ts":
/*!***************************************************************!*\
  !*** ./src/puzzles/entities/user-puzzle-submission.entity.ts ***!
  \***************************************************************/
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserPuzzleSubmission = exports.ModerationAction = exports.PuzzleSubmissionStatus = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const puzzle_entity_1 = __webpack_require__(/*! ./puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
var PuzzleSubmissionStatus;
(function (PuzzleSubmissionStatus) {
    PuzzleSubmissionStatus["DRAFT"] = "draft";
    PuzzleSubmissionStatus["SUBMITTED"] = "submitted";
    PuzzleSubmissionStatus["UNDER_REVIEW"] = "under_review";
    PuzzleSubmissionStatus["APPROVED"] = "approved";
    PuzzleSubmissionStatus["REJECTED"] = "rejected";
    PuzzleSubmissionStatus["PUBLISHED"] = "published";
    PuzzleSubmissionStatus["FEATURED"] = "featured";
})(PuzzleSubmissionStatus || (exports.PuzzleSubmissionStatus = PuzzleSubmissionStatus = {}));
var ModerationAction;
(function (ModerationAction) {
    ModerationAction["PENDING_REVIEW"] = "pending_review";
    ModerationAction["AUTO_APPROVED"] = "auto_approved";
    ModerationAction["MANUALLY_APPROVED"] = "manually_approved";
    ModerationAction["REJECTED_CONTENT"] = "rejected_content";
    ModerationAction["REJECTED_QUALITY"] = "rejected_quality";
    ModerationAction["REJECTED_DUPLICATE"] = "rejected_duplicate";
    ModerationAction["REJECTED_INAPPROPRIATE"] = "rejected_inappropriate";
    ModerationAction["REQUIRES_CHANGES"] = "requires_changes";
})(ModerationAction || (exports.ModerationAction = ModerationAction = {}));
let UserPuzzleSubmission = class UserPuzzleSubmission {
};
exports.UserPuzzleSubmission = UserPuzzleSubmission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserPuzzleSubmission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserPuzzleSubmission.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], UserPuzzleSubmission.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserPuzzleSubmission.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], UserPuzzleSubmission.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserPuzzleSubmission.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'medium' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserPuzzleSubmission.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "difficultyRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 100 }),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "basePoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 300 }),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "timeLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 3 }),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "maxHints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], UserPuzzleSubmission.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", typeof (_b = typeof Array !== "undefined" && Array) === "function" ? _b : Object)
], UserPuzzleSubmission.prototype, "hints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: [] }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Array)
], UserPuzzleSubmission.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PuzzleSubmissionStatus, default: PuzzleSubmissionStatus.DRAFT }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserPuzzleSubmission.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserPuzzleSubmission.prototype, "validationResults", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserPuzzleSubmission.prototype, "moderationData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], UserPuzzleSubmission.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], UserPuzzleSubmission.prototype, "allowComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], UserPuzzleSubmission.prototype, "allowRatings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "views", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "playCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "averageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "ratingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "averageCompletionRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], UserPuzzleSubmission.prototype, "communityScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserPuzzleSubmission.prototype, "sharingSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserPuzzleSubmission.prototype, "creatorNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], UserPuzzleSubmission.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], UserPuzzleSubmission.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], UserPuzzleSubmission.prototype, "featuredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], UserPuzzleSubmission.prototype, "lastActivityAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserPuzzleSubmission.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserPuzzleSubmission.prototype, "rewardData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], UserPuzzleSubmission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_h = typeof Date !== "undefined" && Date) === "function" ? _h : Object)
], UserPuzzleSubmission.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('PuzzleRating', 'submission'),
    __metadata("design:type", Array)
], UserPuzzleSubmission.prototype, "ratings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('PuzzleComment', 'submission'),
    __metadata("design:type", Array)
], UserPuzzleSubmission.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('PuzzlePlay', 'submission'),
    __metadata("design:type", Array)
], UserPuzzleSubmission.prototype, "playSessions", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => puzzle_entity_1.Puzzle, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'publishedPuzzleId' }),
    __metadata("design:type", typeof (_j = typeof puzzle_entity_1.Puzzle !== "undefined" && puzzle_entity_1.Puzzle) === "function" ? _j : Object)
], UserPuzzleSubmission.prototype, "publishedPuzzle", void 0);
exports.UserPuzzleSubmission = UserPuzzleSubmission = __decorate([
    (0, typeorm_1.Entity)('user_puzzle_submissions'),
    (0, typeorm_1.Index)(['userId', 'status']),
    (0, typeorm_1.Index)(['status', 'submittedAt']),
    (0, typeorm_1.Index)(['isPublic', 'status'])
], UserPuzzleSubmission);


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
var PuzzlesController_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzlesController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const puzzles_service_1 = __webpack_require__(/*! ./puzzles.service */ "./src/puzzles/puzzles.service.ts");
const dto_1 = __webpack_require__(/*! ./dto */ "./src/puzzles/dto/index.ts");
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
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const puzzles_service_1 = __webpack_require__(/*! ./puzzles.service */ "./src/puzzles/puzzles.service.ts");
const puzzles_controller_1 = __webpack_require__(/*! ./puzzles.controller */ "./src/puzzles/puzzles.controller.ts");
const community_puzzles_module_1 = __webpack_require__(/*! ./community-puzzles.module */ "./src/puzzles/community-puzzles.module.ts");
const puzzle_entity_1 = __webpack_require__(/*! ./entities/puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
const puzzle_progress_entity_1 = __webpack_require__(/*! ../game-logic/entities/puzzle-progress.entity */ "./src/game-logic/entities/puzzle-progress.entity.ts");
const puzzle_rating_entity_1 = __webpack_require__(/*! ./entities/puzzle-rating.entity */ "./src/puzzles/entities/puzzle-rating.entity.ts");
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
            ]),
            community_puzzles_module_1.CommunityPuzzlesModule,
        ],
        controllers: [puzzles_controller_1.PuzzlesController],
        providers: [puzzles_service_1.PuzzlesService],
        exports: [puzzles_service_1.PuzzlesService]
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
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const puzzle_entity_1 = __webpack_require__(/*! ./entities/puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
const puzzle_progress_entity_1 = __webpack_require__(/*! ../game-logic/entities/puzzle-progress.entity */ "./src/game-logic/entities/puzzle-progress.entity.ts");
const puzzle_rating_entity_1 = __webpack_require__(/*! ./entities/puzzle-rating.entity */ "./src/puzzles/entities/puzzle-rating.entity.ts");
const dto_1 = __webpack_require__(/*! ./dto */ "./src/puzzles/dto/index.ts");
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

/***/ "./src/puzzles/services/community-puzzles.service.ts":
/*!***********************************************************!*\
  !*** ./src/puzzles/services/community-puzzles.service.ts ***!
  \***********************************************************/
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
var CommunityPuzzlesService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommunityPuzzlesService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const user_puzzle_submission_entity_1 = __webpack_require__(/*! ../entities/user-puzzle-submission.entity */ "./src/puzzles/entities/user-puzzle-submission.entity.ts");
const puzzle_rating_entity_1 = __webpack_require__(/*! ../entities/puzzle-rating.entity */ "./src/puzzles/entities/puzzle-rating.entity.ts");
const puzzle_comment_entity_1 = __webpack_require__(/*! ../entities/puzzle-comment.entity */ "./src/puzzles/entities/puzzle-comment.entity.ts");
let CommunityPuzzlesService = CommunityPuzzlesService_1 = class CommunityPuzzlesService {
    constructor(submissionRepository, ratingRepository, commentRepository) {
        this.submissionRepository = submissionRepository;
        this.ratingRepository = ratingRepository;
        this.commentRepository = commentRepository;
        this.logger = new common_1.Logger(CommunityPuzzlesService_1.name);
    }
    async ratePuzzle(submissionId, userId, ratingDto) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId, status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED, allowRatings: true },
        });
        if (!submission) {
            throw new Error('Puzzle not found or ratings not allowed');
        }
        const existingRating = await this.ratingRepository.findOne({
            where: { puzzleId: submissionId, userId },
        });
        if (existingRating) {
            Object.assign(existingRating, ratingDto);
            existingRating.lastEditedAt = new Date();
            const updatedRating = await this.ratingRepository.save(existingRating);
            await this.updatePuzzleRatingStats(submissionId);
            return updatedRating;
        }
        else {
            const newRating = new puzzle_rating_entity_1.PuzzleRating();
            newRating.submissionId = submissionId;
            newRating.userId = userId;
            newRating.rating = ratingDto.rating;
            newRating.review = ratingDto.review;
            newRating.metadata = ratingDto.metadata || {};
            newRating.isPublic = true;
            newRating.isReported = false;
            newRating.tags = [];
            const savedRating = await this.ratingRepository.save(newRating);
            await this.updatePuzzleRatingStats(submissionId);
            return savedRating;
        }
    }
    async getUserRating(submissionId, userId) {
        return await this.ratingRepository.findOne({
            where: { submissionId, userId },
        });
    }
    async getPuzzleRatings(submissionId, page = 1, limit = 20) {
        const [ratings, total] = await this.ratingRepository.findAndCount({
            where: { submissionId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user'],
        });
        return {
            ratings,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async updatePuzzleRatingStats(submissionId) {
        const ratings = await this.ratingRepository.find({
            where: { submissionId },
        });
        if (ratings.length === 0)
            return;
        const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
        await this.submissionRepository.update(submissionId, {
            averageRating,
            ratingCount: ratings.length,
        });
    }
    async createComment(submissionId, userId, commentDto) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId, status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED, allowComments: true },
        });
        if (!submission) {
            throw new Error('Puzzle not found or comments not allowed');
        }
        let isFromCreator = false;
        if (commentDto.parentId) {
            const parentComment = await this.commentRepository.findOne({
                where: { id: commentDto.parentId, submissionId },
            });
            if (!parentComment) {
                throw new Error('Parent comment not found');
            }
            await this.commentRepository.increment({ id: commentDto.parentId }, 'replyCount', 1);
        }
        else {
            isFromCreator = submission.userId === userId;
        }
        const comment = this.commentRepository.create({
            submissionId,
            userId,
            ...commentDto,
            isFromCreator,
            status: puzzle_comment_entity_1.PuzzleCommentStatus.ACTIVE,
        });
        const savedComment = await this.commentRepository.save(comment);
        await this.submissionRepository.update(submissionId, {
            lastActivityAt: new Date(),
        });
        return savedComment;
    }
    async updateComment(commentId, userId, updateDto) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, userId },
        });
        if (!comment) {
            throw new Error('Comment not found');
        }
        if (comment.status !== puzzle_comment_entity_1.PuzzleCommentStatus.ACTIVE) {
            throw new Error('Cannot edit non-active comments');
        }
        Object.assign(comment, updateDto);
        comment.metadata = {
            ...comment.metadata,
            editedAt: new Date(),
            editCount: (comment.metadata.editCount || 0) + 1,
        };
        return await this.commentRepository.save(comment);
    }
    async deleteComment(commentId, userId) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, userId },
        });
        if (!comment) {
            throw new Error('Comment not found');
        }
        comment.status = puzzle_comment_entity_1.PuzzleCommentStatus.DELETED;
        await this.commentRepository.save(comment);
        if (comment.parentId) {
            await this.commentRepository.decrement({ id: comment.parentId }, 'replyCount', 1);
        }
    }
    async voteOnComment(commentId, userId, voteDto) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, status: puzzle_comment_entity_1.PuzzleCommentStatus.ACTIVE },
        });
        if (!comment) {
            throw new Error('Comment not found');
        }
        if (voteDto.voteType === 'upvote') {
            await this.commentRepository.increment({ id: commentId }, 'upvotes', 1);
        }
        else {
            await this.commentRepository.increment({ id: commentId }, 'downvotes', 1);
        }
        return await this.commentRepository.findOne({ where: { id: commentId } });
    }
    async getPuzzleComments(submissionId, page = 1, limit = 20) {
        const [comments, total] = await this.commentRepository.findAndCount({
            where: {
                submissionId,
                status: puzzle_comment_entity_1.PuzzleCommentStatus.ACTIVE,
                parentId: null,
            },
            order: {
                isPinned: 'DESC',
                upvotes: 'DESC',
                createdAt: 'DESC',
            },
            relations: ['user', 'replies'],
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            comments,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async sharePuzzle(submissionId, userId, shareDto) {
        const submission = await this.submissionRepository.findOne({
            where: {
                id: submissionId,
                status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED,
                isPublic: true,
            },
        });
        if (!submission) {
            throw new Error('Puzzle not found or not shareable');
        }
        const baseUrl = process.env.FRONTEND_URL || 'https://quest-game.com';
        const puzzleUrl = `${baseUrl}/puzzles/${submissionId}`;
        const shareableLink = submission.sharingSettings?.shareableLink
            ? `${baseUrl}/shared/${submission.sharingSettings.shareableLink}`
            : puzzleUrl;
        const result = {
            shareUrl: shareableLink,
            socialUrls: {},
        };
        if (shareDto.shareType === 'social' || !shareDto.shareType) {
            const encodedUrl = encodeURIComponent(shareableLink);
            const encodedTitle = encodeURIComponent(submission.title);
            const encodedMessage = encodeURIComponent(shareDto.customMessage || `Check out this puzzle: ${submission.title}`);
            result.socialUrls = {
                twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedMessage}`,
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
                reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
                discord: encodedUrl,
                whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
            };
        }
        if (submission.sharingSettings?.embeddable && shareDto.shareType === 'embed') {
            result.embedCode = `<iframe src="${baseUrl}/embed/puzzle/${submissionId}" width="800" height="600" frameborder="0"></iframe>`;
        }
        await this.trackShare(submissionId, userId, shareDto);
        return result;
    }
    async trackShare(submissionId, userId, shareDto) {
        this.logger.log(`Puzzle ${submissionId} shared by user ${userId} via ${shareDto.shareType}`);
    }
    async getShareStats(submissionId) {
        return {
            totalShares: 0,
            sharesByPlatform: {},
            recentShares: [],
        };
    }
    async getTopCreators(limit = 10) {
        const query = this.submissionRepository
            .createQueryBuilder('submission')
            .select([
            'submission.userId',
            'COUNT(submission.id) as totalPuzzles',
            'AVG(submission.averageRating) as averageRating',
            'SUM(submission.playCount) as totalPlays',
        ])
            .where('submission.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED })
            .andWhere('submission.isPublic = :isPublic', { isPublic: true })
            .groupBy('submission.userId')
            .orderBy('totalPlays', 'DESC')
            .limit(limit);
        const results = await query.getRawMany();
        return results.map((result, index) => ({
            userId: result.submission_userId,
            username: `user_${result.submission_userId}`,
            totalPuzzles: parseInt(result.totalPuzzles),
            averageRating: parseFloat(result.averageRating) || 0,
            totalPlays: parseInt(result.totalPlays) || 0,
            followers: 0,
        }));
    }
    async reportPuzzle(submissionId, userId, reason, category) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
        });
        if (!submission) {
            throw new Error('Puzzle not found');
        }
        if (submission.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED) {
            submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.UNDER_REVIEW;
            submission.moderationData = {
                ...submission.moderationData,
                action: 'pending_review',
                flaggedContent: [reason],
            };
            await this.submissionRepository.save(submission);
        }
        this.logger.log(`Puzzle ${submissionId} reported by user ${userId}: ${reason}`);
    }
    async reportComment(commentId, userId, reason) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
        });
        if (!comment) {
            throw new Error('Comment not found');
        }
        comment.moderationFlags = {
            ...comment.moderationFlags,
            reportedBy: [...(comment.moderationFlags.reportedBy || []), userId],
            reportReasons: [...(comment.moderationFlags.reportReasons || []), reason],
            autoFlagged: true,
        };
        if (comment.moderationFlags.reportedBy.length >= 3) {
            comment.status = puzzle_comment_entity_1.PuzzleCommentStatus.FLAGGED;
        }
        await this.commentRepository.save(comment);
        this.logger.log(`Comment ${commentId} reported by user ${userId}: ${reason}`);
    }
};
exports.CommunityPuzzlesService = CommunityPuzzlesService;
exports.CommunityPuzzlesService = CommunityPuzzlesService = CommunityPuzzlesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_puzzle_submission_entity_1.UserPuzzleSubmission)),
    __param(1, (0, typeorm_1.InjectRepository)(puzzle_rating_entity_1.PuzzleRating)),
    __param(2, (0, typeorm_1.InjectRepository)(puzzle_comment_entity_1.PuzzleComment)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object])
], CommunityPuzzlesService);


/***/ }),

/***/ "./src/puzzles/services/creator-rewards.service.ts":
/*!*********************************************************!*\
  !*** ./src/puzzles/services/creator-rewards.service.ts ***!
  \*********************************************************/
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
var CreatorRewardsService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreatorRewardsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const schedule_1 = __webpack_require__(/*! @nestjs/schedule */ "@nestjs/schedule");
const user_puzzle_submission_entity_1 = __webpack_require__(/*! ../entities/user-puzzle-submission.entity */ "./src/puzzles/entities/user-puzzle-submission.entity.ts");
let CreatorRewardsService = CreatorRewardsService_1 = class CreatorRewardsService {
    constructor(submissionRepository) {
        this.submissionRepository = submissionRepository;
        this.logger = new common_1.Logger(CreatorRewardsService_1.name);
        this.creatorLevels = [
            {
                level: 1,
                title: 'Novice Creator',
                minPoints: 0,
                benefits: ['Basic creator tools', 'Community support'],
                badge: 'bronze',
            },
            {
                level: 2,
                title: 'Apprentice Creator',
                minPoints: 100,
                benefits: ['Advanced analytics', 'Priority support'],
                badge: 'bronze',
            },
            {
                level: 3,
                title: 'Journeyman Creator',
                minPoints: 500,
                benefits: ['Custom themes', 'Enhanced visibility'],
                badge: 'silver',
            },
            {
                level: 4,
                title: 'Expert Creator',
                minPoints: 1500,
                benefits: ['Monetization tools', 'Creator marketplace'],
                badge: 'silver',
            },
            {
                level: 5,
                title: 'Master Creator',
                minPoints: 5000,
                benefits: ['Premium features', 'Revenue sharing'],
                badge: 'gold',
            },
            {
                level: 6,
                title: 'Legendary Creator',
                minPoints: 15000,
                benefits: ['Exclusive content', 'Partner program'],
                badge: 'platinum',
            },
        ];
    }
    async processRewardEvent(event) {
        const creatorStats = await this.getCreatorStats(event.userId);
        await this.addPointsToCreator(event.userId, event.points);
        await this.checkLevelUp(event.userId, creatorStats);
        await this.checkAchievements(event.userId, event);
        await this.updateMonthlyEarnings(event.userId, event.points);
        this.logger.log(`Processed reward event for user ${event.userId}: +${event.points} points`);
    }
    async onPuzzlePlayed(submissionId, userId) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
        });
        if (!submission || !submission.userId)
            return;
        if (submission.userId === userId)
            return;
        const points = this.calculatePlayPoints(submission);
        await this.processRewardEvent({
            type: 'puzzle_play',
            userId: submission.userId,
            submissionId,
            points,
            metadata: {
                playedBy: userId,
                puzzleRating: submission.averageRating,
            },
        });
    }
    async onPuzzleRated(submissionId, rating, userId) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
        });
        if (!submission || !submission.userId)
            return;
        if (submission.userId === userId)
            return;
        const points = this.calculateRatingPoints(rating);
        await this.processRewardEvent({
            type: 'puzzle_rating',
            userId: submission.userId,
            submissionId,
            points,
            metadata: {
                rating,
                ratedBy: userId,
            },
        });
    }
    async onPuzzleFeatured(submissionId, featuredBy) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
        });
        if (!submission || !submission.userId)
            return;
        const points = this.calculateFeaturedPoints(submission);
        await this.processRewardEvent({
            type: 'puzzle_featured',
            userId: submission.userId,
            submissionId,
            points,
            metadata: {
                featuredBy,
                featuredAt: new Date(),
            },
        });
        const currentFeaturedCount = submission.rewardData?.featuredCount || 0;
        submission.rewardData = {
            ...submission.rewardData,
            featuredCount: currentFeaturedCount + 1,
        };
        await this.submissionRepository.save(submission);
    }
    async onPuzzleShared(submissionId, platform, userId) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
        });
        if (!submission || !submission.userId)
            return;
        const points = this.calculateSharePoints(platform);
        await this.processRewardEvent({
            type: 'puzzle_shared',
            userId: submission.userId,
            submissionId,
            points,
            metadata: {
                platform,
                sharedBy: userId,
            },
        });
    }
    async getCreatorStats(userId) {
        const submissions = await this.submissionRepository.find({
            where: { userId },
        });
        const publishedPuzzles = submissions.filter(s => s.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED);
        const featuredPuzzles = submissions.filter(s => s.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED);
        const totalPlays = publishedPuzzles.reduce((sum, s) => sum + s.playCount, 0);
        const averageRating = publishedPuzzles.length > 0
            ? publishedPuzzles.reduce((sum, s) => sum + s.averageRating, 0) / publishedPuzzles.length
            : 0;
        const totalPoints = await this.getTotalPoints(userId);
        const currentLevel = this.getCreatorLevel(totalPoints);
        const nextLevel = this.creatorLevels[currentLevel.level + 1] || this.creatorLevels[currentLevel.level];
        return {
            userId,
            totalPoints,
            currentLevel: currentLevel.level,
            totalPuzzles: submissions.length,
            publishedPuzzles: publishedPuzzles.length,
            featuredPuzzles: featuredPuzzles.length,
            totalPlays,
            averageRating,
            monthlyEarnings: await this.getMonthlyEarnings(userId),
            achievements: await this.getCreatorAchievements(userId),
            nextLevelPoints: nextLevel.minPoints,
            pointsToNextLevel: Math.max(0, nextLevel.minPoints - totalPoints),
        };
    }
    async getLeaderboard(limit = 50, timeframe = 'all') {
        let dateFilter = {};
        if (timeframe === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            dateFilter = { createdAt: (0, typeorm_2.Between)(oneWeekAgo, new Date()) };
        }
        else if (timeframe === 'month') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            dateFilter = { createdAt: (0, typeorm_2.Between)(oneMonthAgo, new Date()) };
        }
        const query = this.submissionRepository
            .createQueryBuilder('submission')
            .select([
            'submission.userId',
            'COUNT(submission.id) as puzzleCount',
            'SUM(submission.playCount) as totalPlays',
            'AVG(submission.averageRating) as avgRating',
        ])
            .where('submission.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED })
            .groupBy('submission.userId')
            .orderBy('totalPlays', 'DESC')
            .limit(limit);
        const results = await query.getRawMany();
        return results.map((result, index) => {
            const points = this.calculatePointsFromStats(result);
            const level = this.getCreatorLevel(points);
            return {
                userId: result.submission_userId,
                username: `creator_${result.submission_userId}`,
                points,
                level: level.level,
                title: level.title,
                badge: level.badge,
                rank: index + 1,
            };
        });
    }
    async getTopCreators(limit = 10) {
        const query = this.submissionRepository
            .createQueryBuilder('submission')
            .select([
            'submission.userId',
            'COUNT(CASE WHEN submission.status = :published THEN 1 END) as publishedCount',
            'COUNT(CASE WHEN submission.status = :featured THEN 1 END) as featuredCount',
            'SUM(submission.playCount) as totalPlays',
            'AVG(submission.averageRating) as avgRating',
        ])
            .setParameter('published', user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED)
            .setParameter('featured', user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED)
            .where('submission.status IN (:...statuses)', {
            statuses: [user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED, user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED]
        })
            .groupBy('submission.userId')
            .having('publishedCount > 0')
            .orderBy('totalPlays', 'DESC')
            .limit(limit);
        const results = await query.getRawMany();
        return results.map((result) => {
            const points = this.calculatePointsFromStats(result);
            const level = this.getCreatorLevel(points);
            return {
                userId: result.submission_userId,
                username: `creator_${result.submission_userId}`,
                totalPuzzles: parseInt(result.publishedCount) || 0,
                featuredPuzzles: parseInt(result.featuredCount) || 0,
                totalPlays: parseInt(result.totalPlays) || 0,
                averageRating: parseFloat(result.avgRating) || 0,
                level: level.level,
                badge: level.badge,
            };
        });
    }
    async processMonthlyRewards() {
        this.logger.log('Processing monthly creator rewards');
        try {
            const topCreators = await this.getLeaderboard(100, 'month');
            for (let i = 0; i < topCreators.length; i++) {
                const creator = topCreators[i];
                const bonusPoints = this.calculateMonthlyBonus(i + 1, creator.points);
                await this.processRewardEvent({
                    type: 'milestone_reached',
                    userId: creator.userId,
                    points: bonusPoints,
                    metadata: {
                        milestone: 'monthly_top_creator',
                        rank: i + 1,
                        timeframe: 'month',
                    },
                });
            }
            this.logger.log(`Processed monthly rewards for ${topCreators.length} creators`);
        }
        catch (error) {
            this.logger.error('Error processing monthly rewards:', error);
        }
    }
    calculatePlayPoints(submission) {
        let points = 1;
        if (submission.averageRating >= 4.5)
            points += 2;
        else if (submission.averageRating >= 4.0)
            points += 1;
        if (submission.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED)
            points += 3;
        if (submission.difficulty === 'expert')
            points += 2;
        else if (submission.difficulty === 'hard')
            points += 1;
        return Math.min(points, 10);
    }
    calculateRatingPoints(rating) {
        if (rating === 5)
            return 10;
        if (rating === 4)
            return 5;
        if (rating === 3)
            return 2;
        return 0;
    }
    calculateFeaturedPoints(submission) {
        let points = 50;
        if (submission.averageRating >= 4.5)
            points += 25;
        else if (submission.averageRating >= 4.0)
            points += 15;
        if (submission.playCount >= 1000)
            points += 25;
        else if (submission.playCount >= 500)
            points += 15;
        else if (submission.playCount >= 100)
            points += 5;
        return points;
    }
    calculateSharePoints(platform) {
        const platformPoints = {
            twitter: 3,
            facebook: 2,
            reddit: 5,
            discord: 4,
            whatsapp: 1,
            link: 1,
            embed: 2,
        };
        return platformPoints[platform] || 1;
    }
    calculateMonthlyBonus(rank, points) {
        if (rank === 1)
            return 1000;
        if (rank === 2)
            return 500;
        if (rank === 3)
            return 250;
        if (rank <= 10)
            return 100;
        if (rank <= 25)
            return 50;
        if (rank <= 50)
            return 25;
        if (rank <= 100)
            return 10;
        return 0;
    }
    calculatePointsFromStats(stats) {
        let points = 0;
        points += Math.floor((stats.totalPlays || 0) / 10);
        points += (stats.avgRating || 0) * (stats.puzzleCount || 0) * 5;
        points += (stats.featuredCount || 0) * 50;
        points += (stats.publishedCount || 0) * 10;
        return points;
    }
    getCreatorLevel(points) {
        for (let i = this.creatorLevels.length - 1; i >= 0; i--) {
            if (points >= this.creatorLevels[i].minPoints) {
                return this.creatorLevels[i];
            }
        }
        return this.creatorLevels[0];
    }
    async addPointsToCreator(userId, points) {
        this.logger.log(`Added ${points} points to creator ${userId}`);
    }
    async getTotalPoints(userId) {
        const submissions = await this.submissionRepository.find({
            where: { userId },
        });
        return this.calculatePointsFromStats({
            totalPlays: submissions.reduce((sum, s) => sum + s.playCount, 0),
            avgRating: submissions.reduce((sum, s) => sum + s.averageRating, 0) / submissions.length || 0,
            puzzleCount: submissions.filter(s => s.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED).length,
            featuredCount: submissions.filter(s => s.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED).length,
        });
    }
    async checkLevelUp(userId, currentStats) {
        const currentLevel = this.getCreatorLevel(currentStats.totalPoints);
        if (currentStats.currentLevel < currentLevel.level) {
            await this.processRewardEvent({
                type: 'milestone_reached',
                userId,
                points: currentLevel.minPoints - this.creatorLevels[currentStats.currentLevel - 1]?.minPoints || 0,
                metadata: {
                    milestone: 'level_up',
                    newLevel: currentLevel.level,
                    newTitle: currentLevel.title,
                },
            });
            this.logger.log(`Creator ${userId} leveled up to ${currentLevel.title} (Level ${currentLevel.level})`);
        }
    }
    async checkAchievements(userId, event) {
        const achievements = [];
        if (event.type === 'puzzle_play') {
            const totalPlays = await this.getTotalPlays(userId);
            if (totalPlays >= 1000)
                achievements.push('Puzzle Master - 1000 Plays');
            if (totalPlays >= 5000)
                achievements.push('Puzzle Legend - 5000 Plays');
        }
        if (event.type === 'puzzle_featured') {
            const featuredCount = await this.getFeaturedCount(userId);
            if (featuredCount >= 1)
                achievements.push('Featured Creator');
            if (featuredCount >= 5)
                achievements.push('Star Creator');
            if (featuredCount >= 10)
                achievements.push('Superstar Creator');
        }
        for (const achievement of achievements) {
            await this.processRewardEvent({
                type: 'milestone_reached',
                userId,
                points: 25,
                metadata: {
                    milestone: 'achievement',
                    achievement,
                },
            });
        }
    }
    async updateMonthlyEarnings(userId, points) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        this.logger.log(`Updated monthly earnings for ${userId}: +${points} points for ${currentMonth}`);
    }
    async getMonthlyEarnings(userId) {
        return {};
    }
    async getCreatorAchievements(userId) {
        return [];
    }
    async getTotalPlays(userId) {
        const submissions = await this.submissionRepository.find({
            where: { userId, status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED },
        });
        return submissions.reduce((sum, s) => sum + s.playCount, 0);
    }
    async getFeaturedCount(userId) {
        const submissions = await this.submissionRepository.find({
            where: { userId, status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED },
        });
        return submissions.length;
    }
};
exports.CreatorRewardsService = CreatorRewardsService;
__decorate([
    (0, schedule_1.Cron)('0 0 1 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)
], CreatorRewardsService.prototype, "processMonthlyRewards", null);
exports.CreatorRewardsService = CreatorRewardsService = CreatorRewardsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_puzzle_submission_entity_1.UserPuzzleSubmission)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], CreatorRewardsService);


/***/ }),

/***/ "./src/puzzles/services/featured-puzzles.service.ts":
/*!**********************************************************!*\
  !*** ./src/puzzles/services/featured-puzzles.service.ts ***!
  \**********************************************************/
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
var FeaturedPuzzlesService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FeaturedPuzzlesService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const schedule_1 = __webpack_require__(/*! @nestjs/schedule */ "@nestjs/schedule");
const user_puzzle_submission_entity_1 = __webpack_require__(/*! ../entities/user-puzzle-submission.entity */ "./src/puzzles/entities/user-puzzle-submission.entity.ts");
let FeaturedPuzzlesService = FeaturedPuzzlesService_1 = class FeaturedPuzzlesService {
    constructor(submissionRepository) {
        this.submissionRepository = submissionRepository;
        this.logger = new common_1.Logger(FeaturedPuzzlesService_1.name);
    }
    async rotateFeaturedPuzzles() {
        this.logger.log('Starting daily featured puzzle rotation');
        try {
            await this.unfeatureExpiredPuzzles();
            await this.selectNewFeaturedPuzzles();
            this.logger.log('Completed daily featured puzzle rotation');
        }
        catch (error) {
            this.logger.error('Error during featured puzzle rotation:', error);
        }
    }
    async weeklyFeatureSelection() {
        this.logger.log('Starting weekly featured puzzle selection');
        try {
            await this.selectWeeklyFeaturedPuzzles();
            this.logger.log('Completed weekly featured puzzle selection');
        }
        catch (error) {
            this.logger.error('Error during weekly featured selection:', error);
        }
    }
    async getFeaturedPuzzles(limit = 10) {
        return await this.submissionRepository.find({
            where: {
                status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED,
                isPublic: true,
            },
            order: { featuredAt: 'DESC' },
            take: limit,
            relations: ['user'],
        });
    }
    async getFeaturedPuzzlesByCategory(category, limit = 5) {
        return await this.submissionRepository.find({
            where: {
                status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED,
                isPublic: true,
                category,
            },
            order: { featuredAt: 'DESC' },
            take: limit,
            relations: ['user'],
        });
    }
    async manuallyFeaturePuzzle(submissionId, adminId) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
        });
        if (!submission) {
            throw new Error('Puzzle submission not found');
        }
        if (submission.status !== user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED) {
            throw new Error('Only published puzzles can be featured');
        }
        submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED;
        submission.featuredAt = new Date();
        submission.moderationData = {
            ...submission.moderationData,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            reviewNotes: 'Manually featured by admin',
        };
        await this.submissionRepository.save(submission);
        await this.updateCreatorRewards(submission.userId, 'featured');
        this.logger.log(`Puzzle ${submissionId} manually featured by admin ${adminId}`);
        return submission;
    }
    async unfeaturePuzzle(submissionId, adminId) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
        });
        if (!submission) {
            throw new Error('Puzzle submission not found');
        }
        if (submission.status !== user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED) {
            throw new Error('Puzzle is not currently featured');
        }
        submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED;
        submission.featuredAt = null;
        await this.submissionRepository.save(submission);
        this.logger.log(`Puzzle ${submissionId} unfeatured by admin ${adminId}`);
        return submission;
    }
    async unfeatureExpiredPuzzles() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const expiredFeatured = await this.submissionRepository.find({
            where: {
                status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED,
                featuredAt: (0, typeorm_2.LessThan)(thirtyDaysAgo),
            },
        });
        for (const puzzle of expiredFeatured) {
            puzzle.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED;
            puzzle.featuredAt = null;
            await this.submissionRepository.save(puzzle);
        }
        this.logger.log(`Unfeatured ${expiredFeatured.length} expired puzzles`);
    }
    async selectNewFeaturedPuzzles() {
        const criteria = {
            minRating: 4.0,
            minPlays: 50,
            minAge: 7,
            maxAge: 90,
            maxFromSameCreator: 2,
            diversityWeight: 0.3,
        };
        const candidates = await this.findFeaturedCandidates(criteria);
        const selected = await this.selectDiversePuzzles(candidates, criteria, 5);
        for (const puzzle of selected) {
            puzzle.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED;
            puzzle.featuredAt = new Date();
            await this.submissionRepository.save(puzzle);
        }
        this.logger.log(`Selected ${selected.length} new featured puzzles`);
    }
    async selectWeeklyFeaturedPuzzles() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const topPerformers = await this.submissionRepository
            .createQueryBuilder('puzzle')
            .where('puzzle.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED })
            .andWhere('puzzle.isPublic = :isPublic', { isPublic: true })
            .andWhere('puzzle.publishedAt >= :oneWeekAgo', { oneWeekAgo })
            .andWhere('puzzle.averageRating >= :minRating', { minRating: 4.5 })
            .andWhere('puzzle.playCount >= :minPlays', { minPlays: 100 })
            .orderBy('puzzle.communityScore', 'DESC')
            .addOrderBy('puzzle.averageRating', 'DESC')
            .addOrderBy('puzzle.playCount', 'DESC')
            .take(3)
            .getMany();
        for (const puzzle of topPerformers) {
            if (puzzle.status !== user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED) {
                puzzle.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED;
                puzzle.featuredAt = new Date();
                await this.submissionRepository.save(puzzle);
            }
        }
        this.logger.log(`Featured ${topPerformers.length} top weekly performers`);
    }
    async findFeaturedCandidates(criteria) {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - criteria.maxAge);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() - criteria.minAge);
        let query = this.submissionRepository
            .createQueryBuilder('puzzle')
            .where('puzzle.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED })
            .andWhere('puzzle.isPublic = :isPublic', { isPublic: true })
            .andWhere('puzzle.averageRating >= :minRating', { minRating: criteria.minRating })
            .andWhere('puzzle.playCount >= :minPlays', { minPlays: criteria.minPlays })
            .andWhere('puzzle.publishedAt BETWEEN :minDate AND :maxDate', { minDate, maxDate });
        if (criteria.categories && criteria.categories.length > 0) {
            query = query.andWhere('puzzle.category IN (:...categories)', { categories: criteria.categories });
        }
        if (criteria.excludeCreators && criteria.excludeCreators.length > 0) {
            query = query.andWhere('puzzle.userId NOT IN (:...excludeCreators)', { excludeCreators: criteria.excludeCreators });
        }
        return await query
            .orderBy('puzzle.communityScore', 'DESC')
            .addOrderBy('puzzle.averageRating', 'DESC')
            .addOrderBy('puzzle.playCount', 'DESC')
            .getMany();
    }
    async selectDiversePuzzles(candidates, criteria, maxSelections) {
        const selected = [];
        const creatorCounts = {};
        const categoryCounts = {};
        const sortedCandidates = candidates.sort((a, b) => {
            const scoreA = this.calculateFeaturedScore(a, criteria);
            const scoreB = this.calculateFeaturedScore(b, criteria);
            return scoreB - scoreA;
        });
        for (const candidate of sortedCandidates) {
            if (selected.length >= maxSelections)
                break;
            const creatorCount = creatorCounts[candidate.userId] || 0;
            if (creatorCount >= criteria.maxFromSameCreator)
                continue;
            if (criteria.diversityWeight > 0.5) {
                const categoryCount = categoryCounts[candidate.category] || 0;
                const maxCategoryCount = Math.ceil(maxSelections / 5);
                if (categoryCount >= maxCategoryCount)
                    continue;
            }
            selected.push(candidate);
            creatorCounts[candidate.userId] = creatorCount + 1;
            categoryCounts[candidate.category] = (categoryCounts[candidate.category] || 0) + 1;
        }
        return selected;
    }
    calculateFeaturedScore(puzzle, criteria) {
        let score = 0;
        score += puzzle.averageRating * 25;
        score += Math.min(puzzle.playCount / 100, 10) * 15;
        score += puzzle.communityScore * 20;
        const daysSincePublication = Math.floor((Date.now() - puzzle.publishedAt.getTime()) / (1000 * 60 * 60 * 24));
        const recencyBonus = Math.max(0, 10 - (daysSincePublication / 10));
        score += recencyBonus * 10;
        if (puzzle.ratingCount >= 10)
            score += 5;
        if (puzzle.ratingCount >= 50)
            score += 5;
        if (puzzle.averageCompletionRate && puzzle.averageCompletionRate > 0.7)
            score += 5;
        const categoryBonus = this.getCategoryDiversityBonus(puzzle.category);
        score += categoryBonus * criteria.diversityWeight * 10;
        return score;
    }
    getCategoryDiversityBonus(category) {
        const commonCategories = ['logic', 'math', 'pattern'];
        return commonCategories.includes(category) ? 0 : 5;
    }
    async updateCreatorRewards(userId, rewardType) {
        this.logger.log(`Updating rewards for user ${userId}: ${rewardType}`);
    }
    async getFeaturedPuzzleStats() {
        const totalFeatured = await this.submissionRepository.count({
            where: { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED },
        });
        const currentlyFeatured = await this.submissionRepository.count({
            where: {
                status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED,
                isPublic: true,
            },
        });
        const featuredByCategory = await this.submissionRepository
            .createQueryBuilder('puzzle')
            .select('puzzle.category', 'category')
            .addSelect('COUNT(*)', 'count')
            .where('puzzle.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED })
            .groupBy('puzzle.category')
            .getRawMany();
        const categoryStats = {};
        featuredByCategory.forEach((row) => {
            categoryStats[row.category] = parseInt(row.count);
        });
        const averageRatingResult = await this.submissionRepository
            .createQueryBuilder('puzzle')
            .select('AVG(puzzle.averageRating)', 'avgRating')
            .where('puzzle.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED })
            .getRawOne();
        const averageFeaturedRating = parseFloat(averageRatingResult.avgRating) || 0;
        const ageDistribution = await this.getFeaturedAgeDistribution();
        return {
            totalFeatured,
            currentlyFeatured,
            featuredByCategory: categoryStats,
            averageFeaturedRating,
            featuredAgeDistribution: ageDistribution,
        };
    }
    async getFeaturedAgeDistribution() {
        const now = new Date();
        const distributions = {
            '0-7 days': 0,
            '8-14 days': 0,
            '15-30 days': 0,
            '30+ days': 0,
        };
        const featuredPuzzles = await this.submissionRepository.find({
            where: { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED },
            select: ['featuredAt'],
        });
        featuredPuzzles.forEach(puzzle => {
            if (!puzzle.featuredAt)
                return;
            const daysFeatured = Math.floor((now.getTime() - puzzle.featuredAt.getTime()) / (1000 * 60 * 60 * 24));
            if (daysFeatured <= 7)
                distributions['0-7 days']++;
            else if (daysFeatured <= 14)
                distributions['8-14 days']++;
            else if (daysFeatured <= 30)
                distributions['15-30 days']++;
            else
                distributions['30+ days']++;
        });
        return distributions;
    }
    async getFeaturedSchedule() {
        return {
            daily: 5,
            weekly: 3,
            monthly: 10,
        };
    }
    async updateFeaturedSchedule(schedule) {
        this.logger.log('Updated featured puzzle rotation schedule:', schedule);
    }
};
exports.FeaturedPuzzlesService = FeaturedPuzzlesService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)
], FeaturedPuzzlesService.prototype, "rotateFeaturedPuzzles", null);
__decorate([
    (0, schedule_1.Cron)('0 2 * * 0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], FeaturedPuzzlesService.prototype, "weeklyFeatureSelection", null);
exports.FeaturedPuzzlesService = FeaturedPuzzlesService = FeaturedPuzzlesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_puzzle_submission_entity_1.UserPuzzleSubmission)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], FeaturedPuzzlesService);


/***/ }),

/***/ "./src/puzzles/services/puzzle-moderation.service.ts":
/*!***********************************************************!*\
  !*** ./src/puzzles/services/puzzle-moderation.service.ts ***!
  \***********************************************************/
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
var PuzzleModerationService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzleModerationService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const user_puzzle_submission_entity_1 = __webpack_require__(/*! ../entities/user-puzzle-submission.entity */ "./src/puzzles/entities/user-puzzle-submission.entity.ts");
const puzzle_validation_service_1 = __webpack_require__(/*! ./puzzle-validation.service */ "./src/puzzles/services/puzzle-validation.service.ts");
let PuzzleModerationService = PuzzleModerationService_1 = class PuzzleModerationService {
    constructor(submissionRepository, validationService) {
        this.submissionRepository = submissionRepository;
        this.validationService = validationService;
        this.logger = new common_1.Logger(PuzzleModerationService_1.name);
    }
    async submitForReview(submissionId, userId, reviewData) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId, userId },
        });
        if (!submission) {
            throw new Error('Puzzle submission not found');
        }
        if (submission.status !== user_puzzle_submission_entity_1.PuzzleSubmissionStatus.DRAFT) {
            throw new Error('Only draft submissions can be submitted for review');
        }
        const validationResults = await this.validationService.validatePuzzle(submission);
        const duplicateCheck = await this.validationService.checkForDuplicates(submission);
        submission.validationResults = validationResults;
        submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.SUBMITTED;
        submission.submittedAt = new Date();
        if (validationResults.isValid && !duplicateCheck.isDuplicate && validationResults.score >= 85) {
            submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.APPROVED;
            submission.moderationData = {
                action: user_puzzle_submission_entity_1.ModerationAction.AUTO_APPROVED,
                autoApprovalScore: validationResults.score,
                qualityScore: validationResults.automatedChecks.contentQuality,
            };
        }
        else if (duplicateCheck.isDuplicate) {
            submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.REJECTED;
            submission.moderationData = {
                action: user_puzzle_submission_entity_1.ModerationAction.REJECTED_DUPLICATE,
                reviewNotes: `Duplicate of: ${duplicateCheck.similarPuzzles.map(p => p.title).join(', ')}`,
            };
        }
        else {
            submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.UNDER_REVIEW;
            submission.moderationData = {
                action: user_puzzle_submission_entity_1.ModerationAction.PENDING_REVIEW,
                autoApprovalScore: validationResults.score,
                qualityScore: validationResults.automatedChecks.contentQuality,
                requiredChanges: validationResults.errors.length > 0 ? validationResults.errors : undefined,
            };
        }
        await this.submissionRepository.save(submission);
        this.logger.log(`Puzzle ${submissionId} submitted for review with status: ${submission.status}`);
        return submission;
    }
    async getModerationQueue(status, page = 1, limit = 20) {
        const where = status ? { status } : {};
        const [submissions, total] = await this.submissionRepository.findAndCount({
            where,
            order: { submittedAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user'],
        });
        return {
            submissions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async moderatePuzzle(submissionId, moderatorId, decision) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
            relations: ['user'],
        });
        if (!submission) {
            throw new Error('Puzzle submission not found');
        }
        if (submission.status !== user_puzzle_submission_entity_1.PuzzleSubmissionStatus.UNDER_REVIEW) {
            throw new Error('Only submissions under review can be moderated');
        }
        submission.moderationData = {
            ...submission.moderationData,
            action: decision.action,
            reviewedBy: moderatorId,
            reviewedAt: new Date(),
            reviewNotes: decision.reviewNotes,
            qualityScore: decision.qualityScore,
            requiredChanges: decision.requiredChanges,
        };
        switch (decision.action) {
            case user_puzzle_submission_entity_1.ModerationAction.MANUALLY_APPROVED:
                submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.APPROVED;
                break;
            case user_puzzle_submission_entity_1.ModerationAction.REJECTED_CONTENT:
            case user_puzzle_submission_entity_1.ModerationAction.REJECTED_QUALITY:
            case user_puzzle_submission_entity_1.ModerationAction.REJECTED_DUPLICATE:
            case user_puzzle_submission_entity_1.ModerationAction.REJECTED_INAPPROPRIATE:
                submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.REJECTED;
                break;
            case user_puzzle_submission_entity_1.ModerationAction.REQUIRES_CHANGES:
                submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.DRAFT;
                break;
            default:
                throw new Error(`Invalid moderation action: ${decision.action}`);
        }
        await this.submissionRepository.save(submission);
        this.logger.log(`Puzzle ${submissionId} moderated by ${moderatorId} with action: ${decision.action}`);
        return submission;
    }
    async publishPuzzle(submissionId, userId) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId, userId },
        });
        if (!submission) {
            throw new Error('Puzzle submission not found');
        }
        if (submission.status !== user_puzzle_submission_entity_1.PuzzleSubmissionStatus.APPROVED) {
            throw new Error('Only approved puzzles can be published');
        }
        submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED;
        submission.publishedAt = new Date();
        submission.isPublic = true;
        await this.submissionRepository.save(submission);
        this.logger.log(`Puzzle ${submissionId} published by user ${userId}`);
        return submission;
    }
    async getPendingModerationCount() {
        return await this.submissionRepository.count({
            where: { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.UNDER_REVIEW },
        });
    }
    async getModerationStats(timeframe = 'week') {
        const now = new Date();
        let startDate;
        switch (timeframe) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        const submissions = await this.submissionRepository.find({
            where: {
                submittedAt: (0, typeorm_2.Between)(startDate, now),
                status: (0, typeorm_2.In)([user_puzzle_submission_entity_1.PuzzleSubmissionStatus.APPROVED, user_puzzle_submission_entity_1.PuzzleSubmissionStatus.REJECTED]),
            },
        });
        const stats = {
            total: submissions.length,
            approved: submissions.filter(s => s.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.APPROVED).length,
            rejected: submissions.filter(s => s.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.REJECTED).length,
            autoApproved: submissions.filter(s => s.moderationData?.action === user_puzzle_submission_entity_1.ModerationAction.AUTO_APPROVED).length,
            averageQualityScore: 0,
            averageProcessingTime: 0,
        };
        if (submissions.length > 0) {
            const qualityScores = submissions
                .map(s => s.moderationData?.qualityScore || 0)
                .filter(score => score > 0);
            stats.averageQualityScore = qualityScores.length > 0
                ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
                : 0;
            const processingTimes = submissions
                .map(s => {
                if (s.submittedAt && s.moderationData?.reviewedAt) {
                    return s.moderationData.reviewedAt.getTime() - s.submittedAt.getTime();
                }
                return 0;
            })
                .filter(time => time > 0);
            stats.averageProcessingTime = processingTimes.length > 0
                ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
                : 0;
        }
        return stats;
    }
    async flagInappropriateContent(submissionId, reporterId, reason) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
        });
        if (!submission) {
            throw new Error('Puzzle submission not found');
        }
        if (submission.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED) {
            submission.status = user_puzzle_submission_entity_1.PuzzleSubmissionStatus.UNDER_REVIEW;
            submission.moderationData = {
                ...submission.moderationData,
                action: user_puzzle_submission_entity_1.ModerationAction.PENDING_REVIEW,
                flaggedContent: [...(submission.moderationData?.flaggedContent || []), reason],
            };
        }
        await this.submissionRepository.save(submission);
        this.logger.log(`Puzzle ${submissionId} flagged by user ${reporterId}: ${reason}`);
        return submission;
    }
    async getCreatorStats(userId) {
        const submissions = await this.submissionRepository.find({
            where: { userId },
        });
        const published = submissions.filter(s => s.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED);
        const featured = submissions.filter(s => s.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED);
        const averageRating = published.length > 0
            ? published.reduce((sum, s) => sum + s.averageRating, 0) / published.length
            : 0;
        const totalPlays = published.reduce((sum, s) => sum + s.playCount, 0);
        const acceptanceRate = submissions.length > 0
            ? (published.length / submissions.length) * 100
            : 0;
        return {
            totalSubmissions: submissions.length,
            publishedPuzzles: published.length,
            averageRating,
            totalPlays,
            featuredCount: featured.length,
            acceptanceRate,
        };
    }
};
exports.PuzzleModerationService = PuzzleModerationService;
exports.PuzzleModerationService = PuzzleModerationService = PuzzleModerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_puzzle_submission_entity_1.UserPuzzleSubmission)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof puzzle_validation_service_1.PuzzleValidationService !== "undefined" && puzzle_validation_service_1.PuzzleValidationService) === "function" ? _b : Object])
], PuzzleModerationService);


/***/ }),

/***/ "./src/puzzles/services/puzzle-validation.service.ts":
/*!***********************************************************!*\
  !*** ./src/puzzles/services/puzzle-validation.service.ts ***!
  \***********************************************************/
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
var PuzzleValidationService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzleValidationService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const user_puzzle_submission_entity_1 = __webpack_require__(/*! ../entities/user-puzzle-submission.entity */ "./src/puzzles/entities/user-puzzle-submission.entity.ts");
let PuzzleValidationService = PuzzleValidationService_1 = class PuzzleValidationService {
    constructor(submissionRepository) {
        this.submissionRepository = submissionRepository;
        this.logger = new common_1.Logger(PuzzleValidationService_1.name);
    }
    async validatePuzzle(submission) {
        const errors = [];
        const warnings = [];
        let score = 0;
        const automatedChecks = {
            hasValidAnswer: this.validateAnswer(submission.content),
            hasExplanation: this.validateExplanation(submission.content),
            appropriateDifficulty: this.validateDifficulty(submission),
            contentQuality: this.assessContentQuality(submission),
            mediaValidation: this.validateMedia(submission.content),
        };
        score = this.calculateValidationScore(automatedChecks);
        if (!automatedChecks.hasValidAnswer) {
            errors.push('Puzzle must have a valid correct answer');
        }
        if (!submission.title || submission.title.length < 3) {
            errors.push('Title must be at least 3 characters long');
        }
        if (!submission.description || submission.description.length < 10) {
            errors.push('Description must be at least 10 characters long');
        }
        if (submission.hints.length > submission.maxHints) {
            errors.push('Number of hints exceeds maximum allowed');
        }
        if (!automatedChecks.hasExplanation) {
            warnings.push('Adding an explanation will improve puzzle quality');
        }
        if (submission.tags.length < 2) {
            warnings.push('Add more tags to improve discoverability');
        }
        if (submission.timeLimit < 60) {
            warnings.push('Time limit seems very short for this difficulty level');
        }
        const isValid = errors.length === 0 && score >= 70;
        return {
            isValid,
            errors,
            warnings,
            score,
            automatedChecks,
        };
    }
    validateAnswer(content) {
        if (!content.correctAnswer)
            return false;
        switch (content.type) {
            case 'multiple-choice':
                return Array.isArray(content.options) &&
                    content.options.length >= 2 &&
                    content.options.includes(content.correctAnswer);
            case 'fill-blank':
                return typeof content.correctAnswer === 'string' &&
                    content.correctAnswer.trim().length > 0;
            case 'drag-drop':
                return typeof content.correctAnswer === 'object' &&
                    content.correctAnswer !== null;
            default:
                return content.correctAnswer !== null &&
                    content.correctAnswer !== undefined;
        }
    }
    validateExplanation(content) {
        return content.explanation &&
            typeof content.explanation === 'string' &&
            content.explanation.trim().length >= 10;
    }
    validateDifficulty(submission) {
        const { difficulty, difficultyRating, timeLimit, basePoints } = submission;
        const difficultyRanges = {
            easy: { rating: [1, 3], time: [60, 300], points: [10, 100] },
            medium: { rating: [3, 6], time: [180, 600], points: [50, 200] },
            hard: { rating: [6, 8], time: [300, 1200], points: [100, 400] },
            expert: { rating: [8, 10], time: [600, 3600], points: [200, 1000] },
        };
        const range = difficultyRanges[difficulty];
        return range &&
            difficultyRating >= range.rating[0] &&
            difficultyRating <= range.rating[1] &&
            timeLimit >= range.time[0] &&
            timeLimit <= range.time[1] &&
            basePoints >= range.points[0] &&
            basePoints <= range.points[1];
    }
    assessContentQuality(submission) {
        let qualityScore = 0;
        const maxScore = 100;
        if (submission.title && submission.title.length >= 10)
            qualityScore += 10;
        if (submission.title && submission.title.length >= 20)
            qualityScore += 10;
        if (submission.description && submission.description.length >= 50)
            qualityScore += 10;
        if (submission.description && submission.description.length >= 100)
            qualityScore += 10;
        if (submission.content.question)
            qualityScore += 10;
        if (submission.content.explanation)
            qualityScore += 10;
        if (submission.hints.length > 0)
            qualityScore += 5;
        if (submission.hints.length >= 2)
            qualityScore += 5;
        if (submission.hints.every(hint => hint.text.length >= 20))
            qualityScore += 5;
        if (submission.tags.length >= 3)
            qualityScore += 10;
        if (submission.tags.length >= 5)
            qualityScore += 5;
        if (submission.creatorNotes && Object.keys(submission.creatorNotes).length > 0) {
            qualityScore += 10;
        }
        return Math.min(qualityScore, maxScore);
    }
    validateMedia(content) {
        if (!content.media)
            return true;
        const { images, videos, audio } = content.media;
        if (images && Array.isArray(images)) {
            return images.every(url => typeof url === 'string' && url.length > 0);
        }
        if (videos && Array.isArray(videos)) {
            return videos.every(url => typeof url === 'string' && url.length > 0);
        }
        if (audio && Array.isArray(audio)) {
            return audio.every(url => typeof url === 'string' && url.length > 0);
        }
        return true;
    }
    calculateValidationScore(checks) {
        let score = 0;
        const weights = {
            hasValidAnswer: 30,
            hasExplanation: 20,
            appropriateDifficulty: 25,
            contentQuality: 20,
            mediaValidation: 5,
        };
        if (checks.hasValidAnswer)
            score += weights.hasValidAnswer;
        if (checks.hasExplanation)
            score += weights.hasExplanation;
        if (checks.appropriateDifficulty)
            score += weights.appropriateDifficulty;
        score += (checks.contentQuality / 100) * weights.contentQuality;
        if (checks.mediaValidation)
            score += weights.mediaValidation;
        return Math.round(score);
    }
    async checkForDuplicates(submission) {
        const similarPuzzles = await this.submissionRepository
            .createQueryBuilder('submission')
            .where('submission.title ILIKE :title', { title: `%${submission.title}%` })
            .orWhere('submission.description ILIKE :description', { description: `%${submission.description}%` })
            .andWhere('submission.status != :rejected', { rejected: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.REJECTED })
            .andWhere('submission.id != :id', { id: submission.id })
            .select(['submission.id', 'submission.title'])
            .limit(5)
            .getMany();
        const similarityThreshold = 0.8;
        const duplicates = similarPuzzles.map(puzzle => ({
            id: puzzle.id,
            title: puzzle.title,
            similarity: this.calculateSimilarity(submission.title, puzzle.title),
        })).filter(result => result.similarity >= similarityThreshold);
        return {
            isDuplicate: duplicates.length > 0,
            similarPuzzles: duplicates,
        };
    }
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
            }
        }
        return matrix[str2.length][str1.length];
    }
};
exports.PuzzleValidationService = PuzzleValidationService;
exports.PuzzleValidationService = PuzzleValidationService = PuzzleValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_puzzle_submission_entity_1.UserPuzzleSubmission)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], PuzzleValidationService);


/***/ }),

/***/ "./src/puzzles/services/user-puzzle-submission.service.ts":
/*!****************************************************************!*\
  !*** ./src/puzzles/services/user-puzzle-submission.service.ts ***!
  \****************************************************************/
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
var UserPuzzleSubmissionService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserPuzzleSubmissionService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const user_puzzle_submission_entity_1 = __webpack_require__(/*! ../entities/user-puzzle-submission.entity */ "./src/puzzles/entities/user-puzzle-submission.entity.ts");
const puzzle_validation_service_1 = __webpack_require__(/*! ./puzzle-validation.service */ "./src/puzzles/services/puzzle-validation.service.ts");
const puzzle_moderation_service_1 = __webpack_require__(/*! ./puzzle-moderation.service */ "./src/puzzles/services/puzzle-moderation.service.ts");
let UserPuzzleSubmissionService = UserPuzzleSubmissionService_1 = class UserPuzzleSubmissionService {
    constructor(submissionRepository, validationService, moderationService) {
        this.submissionRepository = submissionRepository;
        this.validationService = validationService;
        this.moderationService = moderationService;
        this.logger = new common_1.Logger(UserPuzzleSubmissionService_1.name);
    }
    async createSubmission(userId, createDto) {
        const submission = this.submissionRepository.create({
            userId,
            ...createDto,
            status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.DRAFT,
            sharingSettings: {
                allowShare: true,
                embeddable: false,
                downloadAllowed: false,
                attributionRequired: true,
                ...createDto.sharingSettings,
            },
        });
        if (createDto.isPublic) {
            submission.sharingSettings.shareableLink = await this.generateShareableLink();
        }
        const savedSubmission = await this.submissionRepository.save(submission);
        this.logger.log(`Created puzzle submission ${savedSubmission.id} for user ${userId}`);
        return savedSubmission;
    }
    async getUserSubmissions(userId, status, page = 1, limit = 20) {
        const where = status ? { userId, status } : { userId };
        const [submissions, total] = await this.submissionRepository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            submissions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getSubmissionById(submissionId, userId) {
        const where = userId ? { id: submissionId, userId } : { id: submissionId };
        const submission = await this.submissionRepository.findOne({ where });
        if (!submission) {
            throw new Error('Puzzle submission not found');
        }
        if (submission.isPublic && submission.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED) {
            await this.submissionRepository.increment({ id: submissionId }, 'views', 1);
        }
        return submission;
    }
    async updateSubmission(submissionId, userId, updateDto) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId, userId },
        });
        if (!submission) {
            throw new Error('Puzzle submission not found');
        }
        if (submission.status !== user_puzzle_submission_entity_1.PuzzleSubmissionStatus.DRAFT) {
            throw new Error('Only draft submissions can be updated');
        }
        Object.assign(submission, updateDto);
        submission.updatedAt = new Date();
        const savedSubmission = await this.submissionRepository.save(submission);
        this.logger.log(`Updated puzzle submission ${submissionId} by user ${userId}`);
        return savedSubmission;
    }
    async deleteSubmission(submissionId, userId) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId, userId },
        });
        if (!submission) {
            throw new Error('Puzzle submission not found');
        }
        if (submission.status === user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED) {
            throw new Error('Published puzzles cannot be deleted');
        }
        await this.submissionRepository.remove(submission);
        this.logger.log(`Deleted puzzle submission ${submissionId} by user ${userId}`);
    }
    async submitForReview(submissionId, userId, reviewData) {
        return await this.moderationService.submitForReview(submissionId, userId, reviewData);
    }
    async publishPuzzle(submissionId, userId) {
        return await this.moderationService.publishPuzzle(submissionId, userId);
    }
    async searchCommunityPuzzles(searchDto) {
        const { query, categories, difficulties, tags, sortBy = 'newest', page = 1, limit = 20, isPublic = true, } = searchDto;
        const queryBuilder = this.submissionRepository
            .createQueryBuilder('submission')
            .where('submission.isPublic = :isPublic', { isPublic })
            .andWhere('submission.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED });
        if (query) {
            queryBuilder.andWhere('(submission.title ILIKE :query OR submission.description ILIKE :query)', { query: `%${query}%` });
        }
        if (categories && categories.length > 0) {
            queryBuilder.andWhere('submission.category IN (:...categories)', { categories });
        }
        if (difficulties && difficulties.length > 0) {
            queryBuilder.andWhere('submission.difficulty IN (:...difficulties)', { difficulties });
        }
        if (tags && tags.length > 0) {
            queryBuilder.andWhere('submission.tags && :tags', { tags });
        }
        switch (sortBy) {
            case 'newest':
                queryBuilder.orderBy('submission.publishedAt', 'DESC');
                break;
            case 'oldest':
                queryBuilder.orderBy('submission.publishedAt', 'ASC');
                break;
            case 'popular':
                queryBuilder.orderBy('submission.views', 'DESC');
                break;
            case 'highest_rated':
                queryBuilder.orderBy('submission.averageRating', 'DESC');
                break;
            case 'most_played':
                queryBuilder.orderBy('submission.playCount', 'DESC');
                break;
            case 'trending':
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                queryBuilder
                    .orderBy('submission.lastActivityAt', 'DESC')
                    .andWhere('submission.lastActivityAt >= :sevenDaysAgo', { sevenDaysAgo });
                break;
        }
        const [submissions, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            submissions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getFeaturedPuzzles(limit = 10) {
        return await this.submissionRepository.find({
            where: {
                status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.FEATURED,
                isPublic: true,
            },
            order: { featuredAt: 'DESC' },
            take: limit,
        });
    }
    async getTrendingPuzzles(limit = 10) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return await this.submissionRepository
            .createQueryBuilder('submission')
            .where('submission.isPublic = :isPublic', { isPublic: true })
            .andWhere('submission.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED })
            .andWhere('submission.lastActivityAt >= :sevenDaysAgo', { sevenDaysAgo })
            .orderBy('submission.playCount', 'DESC')
            .addOrderBy('submission.averageRating', 'DESC')
            .take(limit)
            .getMany();
    }
    async getRecommendedPuzzles(userId, limit = 10) {
        return await this.submissionRepository
            .createQueryBuilder('submission')
            .where('submission.isPublic = :isPublic', { isPublic: true })
            .andWhere('submission.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED })
            .andWhere('submission.userId != :userId', { userId })
            .orderBy('submission.communityScore', 'DESC')
            .addOrderBy('submission.averageRating', 'DESC')
            .take(limit)
            .getMany();
    }
    async incrementPlayCount(submissionId) {
        await this.submissionRepository.increment({ id: submissionId }, 'playCount', 1);
        await this.submissionRepository.update({ id: submissionId }, { lastActivityAt: new Date() });
    }
    async generateShareableLink() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    async getSubmissionByShareableLink(shareableLink) {
        const submission = await this.submissionRepository
            .createQueryBuilder('submission')
            .where("submission.sharingSettings->>'shareableLink' = :shareableLink", { shareableLink })
            .andWhere('submission.isPublic = :isPublic', { isPublic: true })
            .andWhere('submission.status = :status', { status: user_puzzle_submission_entity_1.PuzzleSubmissionStatus.PUBLISHED })
            .getOne();
        if (!submission) {
            throw new Error('Puzzle not found or not accessible');
        }
        await this.submissionRepository.increment({ id: submission.id }, 'views', 1);
        return submission;
    }
    async getCreatorStats(userId) {
        return await this.moderationService.getCreatorStats(userId);
    }
};
exports.UserPuzzleSubmissionService = UserPuzzleSubmissionService;
exports.UserPuzzleSubmissionService = UserPuzzleSubmissionService = UserPuzzleSubmissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_puzzle_submission_entity_1.UserPuzzleSubmission)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof puzzle_validation_service_1.PuzzleValidationService !== "undefined" && puzzle_validation_service_1.PuzzleValidationService) === "function" ? _b : Object, typeof (_c = typeof puzzle_moderation_service_1.PuzzleModerationService !== "undefined" && puzzle_moderation_service_1.PuzzleModerationService) === "function" ? _c : Object])
], UserPuzzleSubmissionService);


/***/ }),

/***/ "./src/tournaments/dto/create-tournament.dto.ts":
/*!******************************************************!*\
  !*** ./src/tournaments/dto/create-tournament.dto.ts ***!
  \******************************************************/
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
exports.CreateTournamentDto = exports.PrizeDistributionDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class PrizeDistributionDto {
}
exports.PrizeDistributionDto = PrizeDistributionDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PrizeDistributionDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PrizeDistributionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PrizeDistributionDto.prototype, "percentage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PrizeDistributionDto.prototype, "badges", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PrizeDistributionDto.prototype, "achievements", void 0);
class CreateTournamentDto {
}
exports.CreateTournamentDto = CreateTournamentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['single-elimination', 'double-elimination', 'round-robin', 'swiss']),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "bracketType", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    (0, class_validator_1.Max)(256),
    __metadata("design:type", Number)
], CreateTournamentDto.prototype, "maxParticipants", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "registrationStartTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "registrationEndTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTournamentDto.prototype, "entryRequirements", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTournamentDto.prototype, "prizePool", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTournamentDto.prototype, "config", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTournamentDto.prototype, "rules", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateTournamentDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTournamentDto.prototype, "metadata", void 0);


/***/ }),

/***/ "./src/tournaments/dto/query-tournaments.dto.ts":
/*!******************************************************!*\
  !*** ./src/tournaments/dto/query-tournaments.dto.ts ***!
  \******************************************************/
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
exports.QueryTournamentsDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class QueryTournamentsDto {
    constructor() {
        this.page = 1;
        this.limit = 10;
        this.sortOrder = 'DESC';
    }
}
exports.QueryTournamentsDto = QueryTournamentsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)([
        'scheduled',
        'registration',
        'in-progress',
        'completed',
        'cancelled',
    ]),
    __metadata("design:type", String)
], QueryTournamentsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['single-elimination', 'double-elimination', 'round-robin', 'swiss']),
    __metadata("design:type", String)
], QueryTournamentsDto.prototype, "bracketType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryTournamentsDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryTournamentsDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryTournamentsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryTournamentsDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['startTime', 'createdAt', 'prizePool', 'participants']),
    __metadata("design:type", String)
], QueryTournamentsDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], QueryTournamentsDto.prototype, "sortOrder", void 0);


/***/ }),

/***/ "./src/tournaments/dto/submit-match-result.dto.ts":
/*!********************************************************!*\
  !*** ./src/tournaments/dto/submit-match-result.dto.ts ***!
  \********************************************************/
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
exports.SubmitMatchResultDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class SubmitMatchResultDto {
}
exports.SubmitMatchResultDto = SubmitMatchResultDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitMatchResultDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitMatchResultDto.prototype, "winnerId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SubmitMatchResultDto.prototype, "player1Score", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SubmitMatchResultDto.prototype, "player2Score", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SubmitMatchResultDto.prototype, "puzzleIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof Array !== "undefined" && Array) === "function" ? _a : Object)
], SubmitMatchResultDto.prototype, "puzzleResults", void 0);


/***/ }),

/***/ "./src/tournaments/dto/update-tournament.dto.ts":
/*!******************************************************!*\
  !*** ./src/tournaments/dto/update-tournament.dto.ts ***!
  \******************************************************/
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
exports.UpdateTournamentDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class UpdateTournamentDto {
}
exports.UpdateTournamentDto = UpdateTournamentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)([
        'scheduled',
        'registration',
        'in-progress',
        'completed',
        'cancelled',
    ]),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateTournamentDto.prototype, "config", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateTournamentDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateTournamentDto.prototype, "metadata", void 0);


/***/ }),

/***/ "./src/tournaments/entities/tournament-match.entity.ts":
/*!*************************************************************!*\
  !*** ./src/tournaments/entities/tournament-match.entity.ts ***!
  \*************************************************************/
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
exports.TournamentMatch = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const tournament_entity_1 = __webpack_require__(/*! ./tournament.entity */ "./src/tournaments/entities/tournament.entity.ts");
let TournamentMatch = class TournamentMatch {
};
exports.TournamentMatch = TournamentMatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TournamentMatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentMatch.prototype, "tournamentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], TournamentMatch.prototype, "roundNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentMatch.prototype, "roundName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentMatch.prototype, "matchNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'scheduled' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentMatch.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentMatch.prototype, "player1Id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TournamentMatch.prototype, "player1Name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentMatch.prototype, "player1Score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentMatch.prototype, "player2Id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TournamentMatch.prototype, "player2Name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentMatch.prototype, "player2Score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentMatch.prototype, "winnerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TournamentMatch.prototype, "winnerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentMatch.prototype, "loserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TournamentMatch.prototype, "scheduledTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TournamentMatch.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], TournamentMatch.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], TournamentMatch.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TournamentMatch.prototype, "nextMatchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TournamentMatch.prototype, "loserNextMatchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: [] }),
    __metadata("design:type", Array)
], TournamentMatch.prototype, "puzzleIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TournamentMatch.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TournamentMatch.prototype, "results", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TournamentMatch.prototype, "statistics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TournamentMatch.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], TournamentMatch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], TournamentMatch.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tournament_entity_1.Tournament, (tournament) => tournament.matches),
    (0, typeorm_1.JoinColumn)({ name: 'tournamentId' }),
    __metadata("design:type", typeof (_f = typeof tournament_entity_1.Tournament !== "undefined" && tournament_entity_1.Tournament) === "function" ? _f : Object)
], TournamentMatch.prototype, "tournament", void 0);
exports.TournamentMatch = TournamentMatch = __decorate([
    (0, typeorm_1.Entity)('tournament_matches'),
    (0, typeorm_1.Index)(['tournamentId', 'roundNumber']),
    (0, typeorm_1.Index)(['tournamentId', 'status']),
    (0, typeorm_1.Index)(['player1Id', 'player2Id'])
], TournamentMatch);


/***/ }),

/***/ "./src/tournaments/entities/tournament-participant.entity.ts":
/*!*******************************************************************!*\
  !*** ./src/tournaments/entities/tournament-participant.entity.ts ***!
  \*******************************************************************/
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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TournamentParticipant = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const tournament_entity_1 = __webpack_require__(/*! ./tournament.entity */ "./src/tournaments/entities/tournament.entity.ts");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
let TournamentParticipant = class TournamentParticipant {
};
exports.TournamentParticipant = TournamentParticipant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TournamentParticipant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentParticipant.prototype, "tournamentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentParticipant.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TournamentParticipant.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'registered' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentParticipant.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "seedNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "currentRound", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "wins", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "losses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "draws", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "totalScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "finalPosition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "puzzlesSolved", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "totalPuzzlesAttempted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "averageAccuracy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "averageCompletionTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentParticipant.prototype, "longestWinStreak", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TournamentParticipant.prototype, "registeredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TournamentParticipant.prototype, "checkedInAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], TournamentParticipant.prototype, "eliminatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], TournamentParticipant.prototype, "withdrawnAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TournamentParticipant.prototype, "prizeAwarded", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TournamentParticipant.prototype, "statistics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TournamentParticipant.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], TournamentParticipant.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], TournamentParticipant.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tournament_entity_1.Tournament, (tournament) => tournament.participants),
    (0, typeorm_1.JoinColumn)({ name: 'tournamentId' }),
    __metadata("design:type", typeof (_g = typeof tournament_entity_1.Tournament !== "undefined" && tournament_entity_1.Tournament) === "function" ? _g : Object)
], TournamentParticipant.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_h = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _h : Object)
], TournamentParticipant.prototype, "user", void 0);
exports.TournamentParticipant = TournamentParticipant = __decorate([
    (0, typeorm_1.Entity)('tournament_participants'),
    (0, typeorm_1.Index)(['tournamentId', 'userId'], { unique: true }),
    (0, typeorm_1.Index)(['tournamentId', 'status']),
    (0, typeorm_1.Index)(['userId', 'registeredAt'])
], TournamentParticipant);


/***/ }),

/***/ "./src/tournaments/entities/tournament-spectator.entity.ts":
/*!*****************************************************************!*\
  !*** ./src/tournaments/entities/tournament-spectator.entity.ts ***!
  \*****************************************************************/
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
exports.TournamentSpectator = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let TournamentSpectator = class TournamentSpectator {
};
exports.TournamentSpectator = TournamentSpectator;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TournamentSpectator.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentSpectator.prototype, "tournamentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentSpectator.prototype, "matchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TournamentSpectator.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TournamentSpectator.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TournamentSpectator.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TournamentSpectator.prototype, "leftAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentSpectator.prototype, "totalWatchTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentSpectator.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TournamentSpectator.prototype, "engagement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TournamentSpectator.prototype, "preferences", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], TournamentSpectator.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], TournamentSpectator.prototype, "updatedAt", void 0);
exports.TournamentSpectator = TournamentSpectator = __decorate([
    (0, typeorm_1.Entity)('tournament_spectators'),
    (0, typeorm_1.Index)(['tournamentId', 'userId']),
    (0, typeorm_1.Index)(['matchId', 'userId']),
    (0, typeorm_1.Index)(['joinedAt'])
], TournamentSpectator);


/***/ }),

/***/ "./src/tournaments/entities/tournament.entity.ts":
/*!*******************************************************!*\
  !*** ./src/tournaments/entities/tournament.entity.ts ***!
  \*******************************************************/
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
exports.Tournament = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const tournament_participant_entity_1 = __webpack_require__(/*! ./tournament-participant.entity */ "./src/tournaments/entities/tournament-participant.entity.ts");
const tournament_match_entity_1 = __webpack_require__(/*! ./tournament-match.entity */ "./src/tournaments/entities/tournament-match.entity.ts");
let Tournament = class Tournament {
};
exports.Tournament = Tournament;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Tournament.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Tournament.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Tournament.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'single-elimination' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Tournament.prototype, "bracketType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'scheduled' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Tournament.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 16 }),
    __metadata("design:type", Number)
], Tournament.prototype, "maxParticipants", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Tournament.prototype, "currentParticipants", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Tournament.prototype, "registrationStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Tournament.prototype, "registrationEndTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Tournament.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Tournament.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Tournament.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Tournament.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Tournament.prototype, "winnerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Tournament.prototype, "entryRequirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Tournament.prototype, "prizePool", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Tournament.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Tournament.prototype, "bracket", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Tournament.prototype, "rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: [] }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Array)
], Tournament.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Tournament.prototype, "statistics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Tournament.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Tournament.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], Tournament.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => tournament_participant_entity_1.TournamentParticipant, (participant) => participant.tournament),
    __metadata("design:type", Array)
], Tournament.prototype, "participants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => tournament_match_entity_1.TournamentMatch, (match) => match.tournament),
    __metadata("design:type", Array)
], Tournament.prototype, "matches", void 0);
exports.Tournament = Tournament = __decorate([
    (0, typeorm_1.Entity)('tournaments'),
    (0, typeorm_1.Index)(['status', 'startTime']),
    (0, typeorm_1.Index)(['createdBy'])
], Tournament);


/***/ }),

/***/ "./src/tournaments/tournaments.controller.ts":
/*!***************************************************!*\
  !*** ./src/tournaments/tournaments.controller.ts ***!
  \***************************************************/
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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TournamentsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const tournaments_service_1 = __webpack_require__(/*! ./tournaments.service */ "./src/tournaments/tournaments.service.ts");
const create_tournament_dto_1 = __webpack_require__(/*! ./dto/create-tournament.dto */ "./src/tournaments/dto/create-tournament.dto.ts");
const update_tournament_dto_1 = __webpack_require__(/*! ./dto/update-tournament.dto */ "./src/tournaments/dto/update-tournament.dto.ts");
const query_tournaments_dto_1 = __webpack_require__(/*! ./dto/query-tournaments.dto */ "./src/tournaments/dto/query-tournaments.dto.ts");
const submit_match_result_dto_1 = __webpack_require__(/*! ./dto/submit-match-result.dto */ "./src/tournaments/dto/submit-match-result.dto.ts");
let TournamentsController = class TournamentsController {
    constructor(tournamentsService) {
        this.tournamentsService = tournamentsService;
    }
    async create(createTournamentDto, req) {
        try {
            const createdBy = req?.user?.id;
            const tournament = await this.tournamentsService.create(createTournamentDto, createdBy);
            return {
                success: true,
                message: 'Tournament created successfully',
                data: tournament,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async findAll(query) {
        try {
            const result = await this.tournamentsService.findAll(query);
            return {
                success: true,
                data: result.tournaments,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: Math.ceil(result.total / result.limit),
                },
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getCompletedTournaments(limit) {
        try {
            const tournaments = await this.tournamentsService.getCompletedTournaments(limit || 10);
            return {
                success: true,
                data: tournaments,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async findOne(id) {
        try {
            const tournament = await this.tournamentsService.findOne(id);
            if (!tournament) {
                throw new common_1.NotFoundException('Tournament not found');
            }
            return {
                success: true,
                data: tournament,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getBracket(id) {
        try {
            const bracket = await this.tournamentsService.getBracket(id);
            return {
                success: true,
                data: bracket,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getStandings(id) {
        try {
            const standings = await this.tournamentsService.getStandings(id);
            return {
                success: true,
                data: standings,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getTournamentHistory(id) {
        try {
            const history = await this.tournamentsService.getTournamentHistory(id);
            return {
                success: true,
                data: history,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getSpectators(id) {
        try {
            const spectators = await this.tournamentsService.getTournamentSpectators(id);
            return {
                success: true,
                data: spectators,
                count: spectators.length,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async update(id, updateTournamentDto) {
        try {
            const tournament = await this.tournamentsService.update(id, updateTournamentDto);
            return {
                success: true,
                message: 'Tournament updated successfully',
                data: tournament,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async remove(id) {
        try {
            await this.tournamentsService.remove(id);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async register(id, req) {
        try {
            const userId = req?.user?.id || 'test-user-id';
            const username = req?.user?.username || 'TestUser';
            const participant = await this.tournamentsService.registerParticipant(id, userId, username);
            return {
                success: true,
                message: 'Successfully registered for tournament',
                data: participant,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async withdraw(id, req) {
        try {
            const userId = req?.user?.id || 'test-user-id';
            await this.tournamentsService.withdrawParticipant(id, userId);
            return {
                success: true,
                message: 'Successfully withdrawn from tournament',
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async generateBracket(id) {
        try {
            const bracket = await this.tournamentsService.generateBracket(id);
            return {
                success: true,
                message: 'Tournament bracket generated successfully',
                data: bracket,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async submitMatchResult(matchId, submitMatchResultDto) {
        try {
            await this.tournamentsService.submitMatchResult(matchId, submitMatchResultDto.winnerId, submitMatchResultDto.player1Score, submitMatchResultDto.player2Score, submitMatchResultDto.puzzleResults);
            return {
                success: true,
                message: 'Match result submitted successfully',
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async joinAsSpectator(id, req, matchId) {
        try {
            const userId = req?.user?.id || 'spectator-' + Date.now();
            const username = req?.user?.username || 'Spectator';
            const spectator = await this.tournamentsService.joinAsSpectator(id, userId, username, matchId);
            return {
                success: true,
                message: 'Joined as spectator',
                data: spectator,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async leaveAsSpectator(spectatorId) {
        try {
            await this.tournamentsService.leaveAsSpectator(spectatorId);
            return {
                success: true,
                message: 'Left spectator mode',
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.TournamentsController = TournamentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_tournament_dto_1.CreateTournamentDto !== "undefined" && create_tournament_dto_1.CreateTournamentDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof query_tournaments_dto_1.QueryTournamentsDto !== "undefined" && query_tournaments_dto_1.QueryTournamentsDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('completed'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getCompletedTournaments", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/bracket'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getBracket", null);
__decorate([
    (0, common_1.Get)(':id/standings'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getStandings", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getTournamentHistory", null);
__decorate([
    (0, common_1.Get)(':id/spectators'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getSpectators", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof update_tournament_dto_1.UpdateTournamentDto !== "undefined" && update_tournament_dto_1.UpdateTournamentDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "register", null);
__decorate([
    (0, common_1.Post)(':id/withdraw'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Post)(':id/generate-bracket'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "generateBracket", null);
__decorate([
    (0, common_1.Post)('matches/:matchId/result'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('matchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof submit_match_result_dto_1.SubmitMatchResultDto !== "undefined" && submit_match_result_dto_1.SubmitMatchResultDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "submitMatchResult", null);
__decorate([
    (0, common_1.Post)(':id/spectate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "joinAsSpectator", null);
__decorate([
    (0, common_1.Post)('spectators/:spectatorId/leave'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('spectatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "leaveAsSpectator", null);
exports.TournamentsController = TournamentsController = __decorate([
    (0, common_1.Controller)('tournaments'),
    __metadata("design:paramtypes", [typeof (_a = typeof tournaments_service_1.TournamentsService !== "undefined" && tournaments_service_1.TournamentsService) === "function" ? _a : Object])
], TournamentsController);


/***/ }),

/***/ "./src/tournaments/tournaments.module.ts":
/*!***********************************************!*\
  !*** ./src/tournaments/tournaments.module.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TournamentsModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const tournaments_service_1 = __webpack_require__(/*! ./tournaments.service */ "./src/tournaments/tournaments.service.ts");
const tournaments_controller_1 = __webpack_require__(/*! ./tournaments.controller */ "./src/tournaments/tournaments.controller.ts");
const tournament_entity_1 = __webpack_require__(/*! ./entities/tournament.entity */ "./src/tournaments/entities/tournament.entity.ts");
const tournament_participant_entity_1 = __webpack_require__(/*! ./entities/tournament-participant.entity */ "./src/tournaments/entities/tournament-participant.entity.ts");
const tournament_match_entity_1 = __webpack_require__(/*! ./entities/tournament-match.entity */ "./src/tournaments/entities/tournament-match.entity.ts");
const tournament_spectator_entity_1 = __webpack_require__(/*! ./entities/tournament-spectator.entity */ "./src/tournaments/entities/tournament-spectator.entity.ts");
let TournamentsModule = class TournamentsModule {
};
exports.TournamentsModule = TournamentsModule;
exports.TournamentsModule = TournamentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                tournament_entity_1.Tournament,
                tournament_participant_entity_1.TournamentParticipant,
                tournament_match_entity_1.TournamentMatch,
                tournament_spectator_entity_1.TournamentSpectator,
            ]),
        ],
        controllers: [tournaments_controller_1.TournamentsController],
        providers: [tournaments_service_1.TournamentsService],
        exports: [tournaments_service_1.TournamentsService],
    })
], TournamentsModule);


/***/ }),

/***/ "./src/tournaments/tournaments.service.ts":
/*!************************************************!*\
  !*** ./src/tournaments/tournaments.service.ts ***!
  \************************************************/
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
var TournamentsService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TournamentsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const tournament_entity_1 = __webpack_require__(/*! ./entities/tournament.entity */ "./src/tournaments/entities/tournament.entity.ts");
const tournament_participant_entity_1 = __webpack_require__(/*! ./entities/tournament-participant.entity */ "./src/tournaments/entities/tournament-participant.entity.ts");
const tournament_match_entity_1 = __webpack_require__(/*! ./entities/tournament-match.entity */ "./src/tournaments/entities/tournament-match.entity.ts");
const tournament_spectator_entity_1 = __webpack_require__(/*! ./entities/tournament-spectator.entity */ "./src/tournaments/entities/tournament-spectator.entity.ts");
let TournamentsService = TournamentsService_1 = class TournamentsService {
    constructor(tournamentRepository, participantRepository, matchRepository, spectatorRepository) {
        this.tournamentRepository = tournamentRepository;
        this.participantRepository = participantRepository;
        this.matchRepository = matchRepository;
        this.spectatorRepository = spectatorRepository;
        this.logger = new common_1.Logger(TournamentsService_1.name);
    }
    async create(createTournamentDto, createdBy) {
        this.logger.log(`Creating tournament: ${createTournamentDto.name}`);
        const tournament = this.tournamentRepository.create({
            ...createTournamentDto,
            createdBy,
            status: 'scheduled',
            currentParticipants: 0,
            bracket: {
                rounds: [],
                totalRounds: 0,
                currentRound: 0,
            },
            statistics: {
                totalMatches: 0,
                completedMatches: 0,
                topPerformers: [],
            },
        });
        return await this.tournamentRepository.save(tournament);
    }
    async findAll(query) {
        const { status, bracketType, startDate, endDate, page = 1, limit = 10, sortBy = 'startTime', sortOrder = 'DESC', } = query;
        const queryBuilder = this.tournamentRepository.createQueryBuilder('tournament');
        if (status) {
            queryBuilder.andWhere('tournament.status = :status', { status });
        }
        if (bracketType) {
            queryBuilder.andWhere('tournament.bracketType = :bracketType', {
                bracketType,
            });
        }
        if (startDate && endDate) {
            queryBuilder.andWhere('tournament.startTime BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }
        else if (startDate) {
            queryBuilder.andWhere('tournament.startTime >= :startDate', {
                startDate,
            });
        }
        else if (endDate) {
            queryBuilder.andWhere('tournament.startTime <= :endDate', { endDate });
        }
        queryBuilder
            .orderBy(`tournament.${sortBy}`, sortOrder)
            .skip((page - 1) * limit)
            .take(limit);
        const [tournaments, total] = await queryBuilder.getManyAndCount();
        return {
            tournaments,
            total,
            page,
            limit,
        };
    }
    async findOne(id) {
        return await this.tournamentRepository.findOne({
            where: { id },
            relations: ['participants', 'matches'],
        });
    }
    async update(id, updateTournamentDto) {
        await this.tournamentRepository.update(id, updateTournamentDto);
        return await this.findOne(id);
    }
    async remove(id) {
        await this.tournamentRepository.delete(id);
    }
    async registerParticipant(tournamentId, userId, username, metadata) {
        this.logger.log(`Registering participant ${username} for tournament ${tournamentId}`);
        const tournament = await this.findOne(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        if (tournament.status !== 'registration' &&
            tournament.status !== 'scheduled') {
            throw new Error('Tournament registration is closed');
        }
        if (tournament.currentParticipants >= tournament.maxParticipants) {
            throw new Error('Tournament is full');
        }
        const now = new Date();
        if (now < new Date(tournament.registrationStartTime)) {
            throw new Error('Registration has not started yet');
        }
        if (now > new Date(tournament.registrationEndTime)) {
            throw new Error('Registration has ended');
        }
        const existingParticipant = await this.participantRepository.findOne({
            where: { tournamentId, userId },
        });
        if (existingParticipant) {
            throw new Error('Already registered for this tournament');
        }
        const participant = this.participantRepository.create({
            tournamentId,
            userId,
            username,
            status: 'registered',
            registeredAt: new Date(),
            metadata,
            statistics: {},
        });
        await this.participantRepository.save(participant);
        await this.tournamentRepository.update(tournamentId, {
            currentParticipants: tournament.currentParticipants + 1,
        });
        return participant;
    }
    async withdrawParticipant(tournamentId, userId) {
        const participant = await this.participantRepository.findOne({
            where: { tournamentId, userId },
        });
        if (!participant) {
            throw new Error('Participant not found');
        }
        if (participant.status === 'active' ||
            participant.status === 'eliminated') {
            throw new Error('Cannot withdraw after tournament has started');
        }
        await this.participantRepository.update(participant.id, {
            status: 'withdrawn',
            withdrawnAt: new Date(),
        });
        const tournament = await this.findOne(tournamentId);
        await this.tournamentRepository.update(tournamentId, {
            currentParticipants: Math.max(0, tournament.currentParticipants - 1),
        });
    }
    async generateBracket(tournamentId) {
        this.logger.log(`Generating bracket for tournament ${tournamentId}`);
        const tournament = await this.findOne(tournamentId);
        const participants = await this.participantRepository.find({
            where: { tournamentId, status: 'registered' },
        });
        if (participants.length < 2) {
            throw new Error('Not enough participants to generate bracket');
        }
        const bracketType = tournament.bracketType;
        let bracket;
        switch (bracketType) {
            case 'single-elimination':
                bracket = await this.generateSingleEliminationBracket(tournament, participants);
                break;
            case 'double-elimination':
                bracket = await this.generateDoubleEliminationBracket(tournament, participants);
                break;
            case 'round-robin':
                bracket = await this.generateRoundRobinBracket(tournament, participants);
                break;
            case 'swiss':
                bracket = await this.generateSwissBracket(tournament, participants);
                break;
            default:
                throw new Error(`Unsupported bracket type: ${bracketType}`);
        }
        await this.tournamentRepository.update(tournamentId, {
            bracket: {
                rounds: bracket.rounds.map((r) => ({
                    roundNumber: r.roundNumber,
                    roundName: r.roundName,
                    matches: r.matches.map((m) => m.matchId),
                    startTime: r.startTime,
                    endTime: r.endTime,
                })),
                totalRounds: bracket.totalRounds,
                currentRound: 1,
            },
            status: 'in-progress',
        });
        return bracket;
    }
    async generateSingleEliminationBracket(tournament, participants) {
        const seededParticipants = await this.seedParticipants(participants, tournament);
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(seededParticipants.length)));
        const totalRounds = Math.log2(nextPowerOf2);
        const rounds = [];
        let currentMatches = [];
        const firstRoundMatches = Math.ceil(seededParticipants.length / 2);
        const roundNames = this.getRoundNames(totalRounds);
        for (let i = 0; i < firstRoundMatches; i++) {
            const player1 = seededParticipants[i * 2];
            const player2 = seededParticipants[i * 2 + 1];
            const match = await this.createMatch(tournament.id, 1, i + 1, player1, player2);
            currentMatches.push({
                matchId: match.id,
                roundNumber: 1,
                matchNumber: i + 1,
                player1: player1
                    ? { id: player1.id, name: player1.username, seed: player1.seedNumber }
                    : undefined,
                player2: player2
                    ? { id: player2.id, name: player2.username, seed: player2.seedNumber }
                    : undefined,
                status: 'scheduled',
            });
        }
        rounds.push({
            roundNumber: 1,
            roundName: roundNames[0],
            matches: currentMatches,
            isComplete: false,
        });
        for (let round = 2; round <= totalRounds; round++) {
            const prevMatches = currentMatches;
            currentMatches = [];
            const matchesInRound = Math.ceil(prevMatches.length / 2);
            for (let i = 0; i < matchesInRound; i++) {
                const match = await this.createMatch(tournament.id, round, i + 1);
                if (prevMatches[i * 2]) {
                    await this.matchRepository.update(prevMatches[i * 2].matchId, {
                        nextMatchId: match.id,
                    });
                }
                if (prevMatches[i * 2 + 1]) {
                    await this.matchRepository.update(prevMatches[i * 2 + 1].matchId, {
                        nextMatchId: match.id,
                    });
                }
                currentMatches.push({
                    matchId: match.id,
                    roundNumber: round,
                    matchNumber: i + 1,
                    status: 'scheduled',
                });
            }
            rounds.push({
                roundNumber: round,
                roundName: roundNames[round - 1],
                matches: currentMatches,
                isComplete: false,
            });
        }
        return {
            tournamentId: tournament.id,
            bracketType: 'single-elimination',
            rounds,
            totalRounds,
            currentRound: 1,
        };
    }
    async generateDoubleEliminationBracket(tournament, participants) {
        return await this.generateSingleEliminationBracket(tournament, participants);
    }
    async generateRoundRobinBracket(tournament, participants) {
        const n = participants.length;
        const totalRounds = n % 2 === 0 ? n - 1 : n;
        const rounds = [];
        for (let round = 1; round <= totalRounds; round++) {
            const matches = [];
            for (let i = 0; i < Math.floor(n / 2); i++) {
                const player1Idx = i;
                const player2Idx = n - 1 - i;
                if (player1Idx !== player2Idx) {
                    const player1 = participants[player1Idx];
                    const player2 = participants[player2Idx];
                    const match = await this.createMatch(tournament.id, round, i + 1, player1, player2);
                    matches.push({
                        matchId: match.id,
                        roundNumber: round,
                        matchNumber: i + 1,
                        player1: { id: player1.id, name: player1.username },
                        player2: { id: player2.id, name: player2.username },
                        status: 'scheduled',
                    });
                }
            }
            rounds.push({
                roundNumber: round,
                roundName: `Round ${round}`,
                matches,
                isComplete: false,
            });
            const temp = participants.splice(1, 1)[0];
            participants.push(temp);
        }
        return {
            tournamentId: tournament.id,
            bracketType: 'round-robin',
            rounds,
            totalRounds,
            currentRound: 1,
        };
    }
    async generateSwissBracket(tournament, participants) {
        const rounds = [];
        const matches = [];
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.floor(shuffled.length / 2); i++) {
            const player1 = shuffled[i * 2];
            const player2 = shuffled[i * 2 + 1];
            const match = await this.createMatch(tournament.id, 1, i + 1, player1, player2);
            matches.push({
                matchId: match.id,
                roundNumber: 1,
                matchNumber: i + 1,
                player1: { id: player1.id, name: player1.username },
                player2: { id: player2.id, name: player2.username },
                status: 'scheduled',
            });
        }
        rounds.push({
            roundNumber: 1,
            roundName: 'Round 1',
            matches,
            isComplete: false,
        });
        return {
            tournamentId: tournament.id,
            bracketType: 'swiss',
            rounds,
            totalRounds: Math.ceil(Math.log2(participants.length)),
            currentRound: 1,
        };
    }
    async seedParticipants(participants, tournament) {
        const seedingMethod = tournament.rules?.matchmaking?.seedingMethod || 'random';
        let seeded;
        switch (seedingMethod) {
            case 'ranked':
                seeded = [...participants].sort((a, b) => b.totalScore - a.totalScore);
                break;
            case 'seeded':
                seeded = [...participants].sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999));
                break;
            case 'random':
            default:
                seeded = [...participants].sort(() => Math.random() - 0.5);
                break;
        }
        for (let i = 0; i < seeded.length; i++) {
            seeded[i].seedNumber = i + 1;
            await this.participantRepository.update(seeded[i].id, {
                seedNumber: i + 1,
                status: 'active',
            });
        }
        return seeded;
    }
    getRoundNames(totalRounds) {
        const names = [];
        for (let i = totalRounds; i >= 1; i--) {
            if (i === 1) {
                names.push('Finals');
            }
            else if (i === 2) {
                names.push('Semi-Finals');
            }
            else if (i === 3) {
                names.push('Quarter-Finals');
            }
            else {
                names.push(`Round of ${Math.pow(2, i)}`);
            }
        }
        return names.reverse();
    }
    async createMatch(tournamentId, roundNumber, matchNumber, player1, player2) {
        const match = this.matchRepository.create({
            tournamentId,
            roundNumber,
            matchNumber,
            player1Id: player1?.id,
            player1Name: player1?.username,
            player2Id: player2?.id,
            player2Name: player2?.username,
            status: 'scheduled',
            player1Score: 0,
            player2Score: 0,
            config: {},
            results: {},
            statistics: {},
            metadata: {},
        });
        return await this.matchRepository.save(match);
    }
    async submitMatchResult(matchId, winnerId, player1Score, player2Score, puzzleResults) {
        this.logger.log(`Submitting match result for match ${matchId}`);
        const match = await this.matchRepository.findOne({
            where: { id: matchId },
        });
        if (!match) {
            throw new Error('Match not found');
        }
        if (match.status === 'completed') {
            throw new Error('Match already completed');
        }
        const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;
        await this.matchRepository.update(matchId, {
            winnerId,
            winnerName: winnerId === match.player1Id ? match.player1Name : match.player2Name,
            loserId,
            player1Score,
            player2Score,
            status: 'completed',
            endTime: new Date(),
            duration: match.startTime
                ? Math.floor((new Date().getTime() - new Date(match.startTime).getTime()) / 1000)
                : 0,
            results: {
                puzzleResults,
            },
        });
        if (winnerId) {
            await this.updateParticipantStats(match.tournamentId, winnerId, true, player1Score || player2Score);
        }
        if (loserId) {
            await this.updateParticipantStats(match.tournamentId, loserId, false, winnerId === match.player1Id ? player2Score : player1Score);
        }
        if (match.nextMatchId) {
            await this.advanceToNextMatch(match.nextMatchId, winnerId, winnerId === match.player1Id ? match.player1Name : match.player2Name);
        }
        await this.checkTournamentCompletion(match.tournamentId);
    }
    async updateParticipantStats(tournamentId, participantId, isWin, score) {
        const participant = await this.participantRepository.findOne({
            where: { id: participantId, tournamentId },
        });
        if (!participant)
            return;
        await this.participantRepository.update(participantId, {
            wins: isWin ? participant.wins + 1 : participant.wins,
            losses: !isWin ? participant.losses + 1 : participant.losses,
            totalScore: participant.totalScore + score,
        });
        if (!isWin) {
            await this.participantRepository.update(participantId, {
                status: 'eliminated',
                eliminatedAt: new Date(),
            });
        }
    }
    async advanceToNextMatch(nextMatchId, winnerId, winnerName) {
        const nextMatch = await this.matchRepository.findOne({
            where: { id: nextMatchId },
        });
        if (!nextMatch)
            return;
        if (!nextMatch.player1Id) {
            await this.matchRepository.update(nextMatchId, {
                player1Id: winnerId,
                player1Name: winnerName,
            });
        }
        else if (!nextMatch.player2Id) {
            await this.matchRepository.update(nextMatchId, {
                player2Id: winnerId,
                player2Name: winnerName,
                status: 'ready',
            });
        }
    }
    async checkTournamentCompletion(tournamentId) {
        const tournament = await this.findOne(tournamentId);
        const matches = await this.matchRepository.find({
            where: { tournamentId },
        });
        const allMatchesCompleted = matches.every((m) => m.status === 'completed');
        if (allMatchesCompleted) {
            const finalMatch = matches.reduce((prev, current) => current.roundNumber > prev.roundNumber ? current : prev);
            await this.tournamentRepository.update(tournamentId, {
                status: 'completed',
                endTime: new Date(),
                winnerId: finalMatch.winnerId,
            });
            await this.distributePrizes(tournamentId);
        }
    }
    async distributePrizes(tournamentId) {
        this.logger.log(`Distributing prizes for tournament ${tournamentId}`);
        const tournament = await this.findOne(tournamentId);
        const participants = await this.participantRepository.find({
            where: { tournamentId },
            order: { wins: 'DESC', totalScore: 'DESC' },
        });
        const prizeDistribution = tournament.prizePool?.distribution || [];
        for (let i = 0; i < Math.min(participants.length, prizeDistribution.length); i++) {
            const participant = participants[i];
            const prize = prizeDistribution[i];
            await this.participantRepository.update(participant.id, {
                finalPosition: i + 1,
                prizeAwarded: {
                    amount: prize.amount,
                    currency: tournament.prizePool.currency,
                    badges: prize.badges,
                    achievements: prize.achievements,
                    awardedAt: new Date(),
                },
            });
        }
    }
    async joinAsSpectator(tournamentId, userId, username, matchId) {
        const spectator = this.spectatorRepository.create({
            tournamentId,
            matchId,
            userId,
            username,
            joinedAt: new Date(),
            isActive: true,
            engagement: {},
            preferences: {},
        });
        return await this.spectatorRepository.save(spectator);
    }
    async leaveAsSpectator(spectatorId) {
        const spectator = await this.spectatorRepository.findOne({
            where: { id: spectatorId },
        });
        if (!spectator)
            return;
        const watchTime = Math.floor((new Date().getTime() - new Date(spectator.joinedAt).getTime()) / 1000);
        await this.spectatorRepository.update(spectatorId, {
            leftAt: new Date(),
            isActive: false,
            totalWatchTime: spectator.totalWatchTime + watchTime,
        });
    }
    async getTournamentSpectators(tournamentId) {
        return await this.spectatorRepository.find({
            where: { tournamentId, isActive: true },
        });
    }
    async getBracket(tournamentId) {
        const tournament = await this.findOne(tournamentId);
        const matches = await this.matchRepository.find({
            where: { tournamentId },
            order: { roundNumber: 'ASC', matchNumber: 'ASC' },
        });
        const rounds = [];
        const roundMap = new Map();
        matches.forEach((match) => {
            if (!roundMap.has(match.roundNumber)) {
                roundMap.set(match.roundNumber, []);
            }
            roundMap.get(match.roundNumber).push({
                matchId: match.id,
                roundNumber: match.roundNumber,
                matchNumber: match.matchNumber,
                player1: match.player1Id
                    ? { id: match.player1Id, name: match.player1Name }
                    : undefined,
                player2: match.player2Id
                    ? { id: match.player2Id, name: match.player2Name }
                    : undefined,
                winner: match.winnerId
                    ? { id: match.winnerId, name: match.winnerName }
                    : undefined,
                status: match.status,
                nextMatchId: match.nextMatchId,
                loserNextMatchId: match.loserNextMatchId,
            });
        });
        roundMap.forEach((matches, roundNumber) => {
            rounds.push({
                roundNumber,
                roundName: tournament.bracket.rounds?.find((r) => r.roundNumber === roundNumber)
                    ?.roundName || `Round ${roundNumber}`,
                matches,
                isComplete: matches.every((m) => m.status === 'completed'),
            });
        });
        return {
            tournamentId,
            bracketType: tournament.bracketType,
            rounds,
            totalRounds: tournament.bracket.totalRounds || rounds.length,
            currentRound: tournament.bracket.currentRound || 1,
        };
    }
    async getStandings(tournamentId) {
        const participants = await this.participantRepository.find({
            where: { tournamentId },
            order: { wins: 'DESC', totalScore: 'DESC' },
        });
        return participants.map((p, index) => ({
            position: index + 1,
            participantId: p.id,
            userId: p.userId,
            username: p.username,
            wins: p.wins,
            losses: p.losses,
            draws: p.draws,
            totalScore: p.totalScore,
            averageAccuracy: p.averageAccuracy,
            status: p.status,
        }));
    }
    async getCompletedTournaments(limit = 10) {
        return await this.tournamentRepository.find({
            where: { status: 'completed' },
            order: { endTime: 'DESC' },
            take: limit,
        });
    }
    async getTournamentHistory(tournamentId) {
        const tournament = await this.findOne(tournamentId);
        const participants = await this.participantRepository.find({
            where: { tournamentId },
        });
        const matches = await this.matchRepository.find({
            where: { tournamentId },
            order: { roundNumber: 'ASC', matchNumber: 'ASC' },
        });
        return {
            tournament,
            participants,
            matches,
            winner: participants.find((p) => p.finalPosition === 1),
            topPerformers: participants
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 10),
        };
    }
};
exports.TournamentsService = TournamentsService;
exports.TournamentsService = TournamentsService = TournamentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tournament_entity_1.Tournament)),
    __param(1, (0, typeorm_1.InjectRepository)(tournament_participant_entity_1.TournamentParticipant)),
    __param(2, (0, typeorm_1.InjectRepository)(tournament_match_entity_1.TournamentMatch)),
    __param(3, (0, typeorm_1.InjectRepository)(tournament_spectator_entity_1.TournamentSpectator)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _d : Object])
], TournamentsService);


/***/ }),

/***/ "./src/users/dto/create-user.dto.ts":
/*!******************************************!*\
  !*** ./src/users/dto/create-user.dto.ts ***!
  \******************************************/
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
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
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

/***/ "./src/users/entities/user-stats.entity.ts":
/*!*************************************************!*\
  !*** ./src/users/entities/user-stats.entity.ts ***!
  \*************************************************/
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
exports.UserStats = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
let UserStats = class UserStats {
};
exports.UserStats = UserStats;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserStats.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserStats.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], UserStats.prototype, "totalPuzzlesAttempted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], UserStats.prototype, "totalPuzzlesCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserStats.prototype, "totalPuzzlesFailed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserStats.prototype, "totalScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserStats.prototype, "totalTimeSpent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserStats.prototype, "totalHintsUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserStats.prototype, "currentStreak", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], UserStats.prototype, "longestStreak", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], UserStats.prototype, "overallAccuracy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], UserStats.prototype, "averageCompletionTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserStats.prototype, "totalAchievements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserStats.prototype, "totalGameSessions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserStats.prototype, "difficultyStats", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], UserStats.prototype, "categoryStats", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserStats.prototype, "timeStats", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserStats.prototype, "trends", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserStats.prototype, "milestones", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserStats.prototype, "rankings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], UserStats.prototype, "lastActivityAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], UserStats.prototype, "lastCalculatedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], UserStats.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], UserStats.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_f = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _f : Object)
], UserStats.prototype, "user", void 0);
exports.UserStats = UserStats = __decorate([
    (0, typeorm_1.Entity)('user_stats'),
    (0, typeorm_1.Index)(['userId'], { unique: true })
], UserStats);


/***/ }),

/***/ "./src/users/entities/user.entity.ts":
/*!*******************************************!*\
  !*** ./src/users/entities/user.entity.ts ***!
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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.User = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_achievement_entity_1 = __webpack_require__(/*! ../../achievements/entities/user-achievement.entity */ "./src/achievements/entities/user-achievement.entity.ts");
const game_session_entity_1 = __webpack_require__(/*! ../../game-engine/entities/game-session.entity */ "./src/game-engine/entities/game-session.entity.ts");
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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const platform_express_1 = __webpack_require__(/*! @nestjs/platform-express */ "@nestjs/platform-express");
const file_upload_validator_1 = __webpack_require__(/*! ../common/validators/file-upload.validator */ "./src/common/validators/file-upload.validator.ts");
const users_service_1 = __webpack_require__(/*! ./users.service */ "./src/users/users.service.ts");
const create_user_dto_1 = __webpack_require__(/*! ./dto/create-user.dto */ "./src/users/dto/create-user.dto.ts");
const update_user_dto_1 = __webpack_require__(/*! ./dto/update-user.dto */ "./src/users/dto/update-user.dto.ts");
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
    uploadAvatar(file) {
        return { message: 'Avatar uploaded successfully', filename: file.originalname };
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
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        fileFilter: (0, file_upload_validator_1.fileFilter)(['.png', '.jpg', '.jpeg'], ['image/png', 'image/jpeg']),
        limits: { fileSize: 2 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof Express !== "undefined" && (_d = Express.Multer) !== void 0 && _d.File) === "function" ? _e : Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "uploadAvatar", null);
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

/***/ "@nestjs/passport":
/*!***********************************!*\
  !*** external "@nestjs/passport" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("@nestjs/passport");

/***/ }),

/***/ "@nestjs/platform-express":
/*!*******************************************!*\
  !*** external "@nestjs/platform-express" ***!
  \*******************************************/
/***/ ((module) => {

module.exports = require("@nestjs/platform-express");

/***/ }),

/***/ "@nestjs/schedule":
/*!***********************************!*\
  !*** external "@nestjs/schedule" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("@nestjs/schedule");

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

/***/ "@nestjs/typeorm":
/*!**********************************!*\
  !*** external "@nestjs/typeorm" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("@nestjs/typeorm");

/***/ }),

/***/ "@sentry/node":
/*!*******************************!*\
  !*** external "@sentry/node" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("@sentry/node");

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

/***/ "nodemailer":
/*!*****************************!*\
  !*** external "nodemailer" ***!
  \*****************************/
/***/ ((module) => {

module.exports = require("nodemailer");

/***/ }),

/***/ "rxjs/operators":
/*!*********************************!*\
  !*** external "rxjs/operators" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("rxjs/operators");

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

/***/ "xss":
/*!**********************!*\
  !*** external "xss" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("xss");

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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ })()
;