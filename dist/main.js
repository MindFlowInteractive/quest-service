/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/achievements/entities/achievement.entity.ts":
/*!*********************************************************!*\
  !*** ./src/achievements/entities/achievement.entity.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./src/app.controller.ts":
/*!*******************************!*\
  !*** ./src/app.controller.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

"use strict";

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
const wallet_module_1 = __webpack_require__(/*! ./wallet/wallet.module */ "./src/wallet/wallet.module.ts");
const difficulty_scaling_module_1 = __webpack_require__(/*! ./difficulty-scaling/difficulty-scaling.module */ "./src/difficulty-scaling/difficulty-scaling.module.ts");
const tournaments_module_1 = __webpack_require__(/*! ./tournaments/tournaments.module */ "./src/tournaments/tournaments.module.ts");
const rabbitmq_module_1 = __webpack_require__(/*! ./rabbitmq/rabbitmq.module */ "./src/rabbitmq/rabbitmq.module.ts");
const tutorial_module_1 = __webpack_require__(/*! ./tutorial/tutorial.module */ "./src/tutorial/tutorial.module.ts");
const referrals_module_1 = __webpack_require__(/*! ./referrals/referrals.module */ "./src/referrals/referrals.module.ts");
const save_game_module_1 = __webpack_require__(/*! ./save-game/save-game.module */ "./src/save-game/save-game.module.ts");
const soroban_module_1 = __webpack_require__(/*! ./soroban/soroban.module */ "./src/soroban/soroban.module.ts");
const nft_module_1 = __webpack_require__(/*! ./nft/nft.module */ "./src/nft/nft.module.ts");
const rewards_module_1 = __webpack_require__(/*! ./rewards/rewards.module */ "./src/rewards/rewards.module.ts");
const puzzle_module_1 = __webpack_require__(/*! ./puzzle/puzzle.module */ "./src/puzzle/puzzle.module.ts");
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
            rabbitmq_module_1.RabbitMQModule,
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
            wallet_module_1.WalletModule,
            health_module_1.HealthModule,
            hints_module_1.HintsModule,
            difficulty_scaling_module_1.DifficultyScalingModule,
            tournaments_module_1.TournamentsModule,
            tutorial_module_1.TutorialModule,
            referrals_module_1.ReferralsModule,
            save_game_module_1.SaveGameModule,
            soroban_module_1.SorobanModule,
            nft_module_1.NFTModule,
            rewards_module_1.RewardsModule,
            puzzle_module_1.PuzzleModule,
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [Object])
], AppService);


/***/ }),

/***/ "./src/auth/guards/jwt-auth.guard.ts":
/*!*******************************************!*\
  !*** ./src/auth/guards/jwt-auth.guard.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthController = void 0;
const database_service_1 = __webpack_require__(/*! ../config/database-service */ "./src/config/database-service.ts");
const performance_service_1 = __webpack_require__(/*! ../monitoring/performance.service */ "./src/monitoring/performance.service.ts");
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

"use strict";

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

"use strict";

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
    (0, typeorm_1.ManyToOne)('Hint', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'hintId' }),
    __metadata("design:type", Object)
], HintUsage.prototype, "hint", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Puzzle', { onDelete: 'CASCADE' }),
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Hint = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const hint_usage_entity_1 = __webpack_require__(/*! ./hint-usage.entity */ "./src/hints/entities/hint-usage.entity.ts");
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
    (0, typeorm_1.ManyToOne)('Puzzle', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'puzzleId' }),
    __metadata("design:type", Object)
], Hint.prototype, "puzzle", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hint_usage_entity_1.HintUsage, (usage) => usage.hint),
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

"use strict";

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

"use strict";

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

"use strict";

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

/***/ "./src/nft/nft.controller.ts":
/*!***********************************!*\
  !*** ./src/nft/nft.controller.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NFTController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const nft_service_1 = __webpack_require__(/*! ./nft.service */ "./src/nft/nft.service.ts");
let NFTController = class NFTController {
    constructor(nftService) {
        this.nftService = nftService;
    }
    async mint(body) {
        return this.nftService.mintNFT(body.userAddress, body.tokenId, body.uri);
    }
    async getNFT(tokenId) {
        return this.nftService.getNFT(parseInt(tokenId, 10));
    }
    async transfer(body) {
        return this.nftService.transferNFT(body.from, body.to, body.tokenId);
    }
};
exports.NFTController = NFTController;
__decorate([
    (0, common_1.Post)('mint'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NFTController.prototype, "mint", null);
__decorate([
    (0, common_1.Get)(':tokenId'),
    __param(0, (0, common_1.Param)('tokenId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFTController.prototype, "getNFT", null);
__decorate([
    (0, common_1.Post)('transfer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NFTController.prototype, "transfer", null);
exports.NFTController = NFTController = __decorate([
    (0, common_1.Controller)('nft'),
    __metadata("design:paramtypes", [typeof (_a = typeof nft_service_1.NFTService !== "undefined" && nft_service_1.NFTService) === "function" ? _a : Object])
], NFTController);


/***/ }),

/***/ "./src/nft/nft.module.ts":
/*!*******************************!*\
  !*** ./src/nft/nft.module.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NFTModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const nft_service_1 = __webpack_require__(/*! ./nft.service */ "./src/nft/nft.service.ts");
const nft_controller_1 = __webpack_require__(/*! ./nft.controller */ "./src/nft/nft.controller.ts");
const soroban_module_1 = __webpack_require__(/*! ../soroban/soroban.module */ "./src/soroban/soroban.module.ts");
let NFTModule = class NFTModule {
};
exports.NFTModule = NFTModule;
exports.NFTModule = NFTModule = __decorate([
    (0, common_1.Module)({
        imports: [soroban_module_1.SorobanModule],
        controllers: [nft_controller_1.NFTController],
        providers: [nft_service_1.NFTService],
        exports: [nft_service_1.NFTService],
    })
], NFTModule);


/***/ }),

/***/ "./src/nft/nft.service.ts":
/*!********************************!*\
  !*** ./src/nft/nft.service.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NFTService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const soroban_service_1 = __webpack_require__(/*! ../soroban/soroban.service */ "./src/soroban/soroban.service.ts");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const stellar_sdk_1 = __webpack_require__(/*! @stellar/stellar-sdk */ "@stellar/stellar-sdk");
let NFTService = class NFTService {
    constructor(sorobanService, configService) {
        this.sorobanService = sorobanService;
        this.configService = configService;
        this.nftContractId = this.configService.get('NFT_CONTRACT_ID');
    }
    async mintNFT(userAddress, tokenId, uri) {
        const params = [
            new stellar_sdk_1.Address(userAddress).toScVal(),
            (0, stellar_sdk_1.nativeToScVal)(tokenId, { type: 'u64' }),
            (0, stellar_sdk_1.nativeToScVal)(uri, { type: 'string' }),
        ];
        const result = await this.sorobanService.invokeContract(this.nftContractId, 'mint', params);
        return {
            success: result.status === 'SUCCESS',
            transactionHash: result.hash,
            tokenId,
            owner: userAddress,
            uri,
        };
    }
    async getNFT(tokenId) {
        const params = [(0, stellar_sdk_1.nativeToScVal)(tokenId, { type: 'u64' })];
        const result = (await this.sorobanService.invokeContract(this.nftContractId, 'get_nft', params));
        return result.result;
    }
    async transferNFT(from, to, tokenId) {
        const params = [
            new stellar_sdk_1.Address(from).toScVal(),
            new stellar_sdk_1.Address(to).toScVal(),
            (0, stellar_sdk_1.nativeToScVal)(tokenId, { type: 'u64' }),
        ];
        const result = await this.sorobanService.invokeContract(this.nftContractId, 'transfer', params);
        return {
            success: result.status === 'SUCCESS',
            transactionHash: result.hash,
        };
    }
};
exports.NFTService = NFTService;
exports.NFTService = NFTService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof soroban_service_1.SorobanService !== "undefined" && soroban_service_1.SorobanService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], NFTService);


/***/ }),

/***/ "./src/notifications/devices.controller.ts":
/*!*************************************************!*\
  !*** ./src/notifications/devices.controller.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationService_1;
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const typeorm_2 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const notification_entity_1 = __webpack_require__(/*! ./entities/notification.entity */ "./src/notifications/entities/notification.entity.ts");
const notification_delivery_entity_1 = __webpack_require__(/*! ./entities/notification-delivery.entity */ "./src/notifications/entities/notification-delivery.entity.ts");
const user_entity_1 = __webpack_require__(/*! ../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const email_service_1 = __webpack_require__(/*! ./email.service */ "./src/notifications/email.service.ts");
const schedule_1 = __webpack_require__(/*! @nestjs/schedule */ "@nestjs/schedule");
const device_entity_1 = __webpack_require__(/*! ./entities/device.entity */ "./src/notifications/entities/device.entity.ts");
const push_service_1 = __webpack_require__(/*! ./push.service */ "./src/notifications/push.service.ts");
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
    __param(5, (0, common_1.Inject)(schedule_1.SchedulerRegistry)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _d : Object, typeof (_e = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _e : Object, Object, typeof (_f = typeof push_service_1.PushService !== "undefined" && push_service_1.PushService) === "function" ? _f : Object])
], NotificationService);


/***/ }),

/***/ "./src/notifications/notifications.controller.ts":
/*!*******************************************************!*\
  !*** ./src/notifications/notifications.controller.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

"use strict";

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
/***/ (() => {

throw new Error("Module parse failed: 'return' outside of function (6:8)\nFile was processed with these loaders:\n * ./node_modules/ts-loader/index.js\nYou may need an additional loader to handle the result of these loaders.\n|     if (!this.enabled) {\n|         this.logger.debug('Push disabled - token would be:', token);\n>         return { success: false, queued: true };\n|     }\n|     try {");

/***/ }),

/***/ "./src/puzzle/puzzle.controller.ts":
/*!*****************************************!*\
  !*** ./src/puzzle/puzzle.controller.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzleController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const puzzle_service_1 = __webpack_require__(/*! ./puzzle.service */ "./src/puzzle/puzzle.service.ts");
const rewards_service_1 = __webpack_require__(/*! ../rewards/rewards.service */ "./src/rewards/rewards.service.ts");
const nft_service_1 = __webpack_require__(/*! ../nft/nft.service */ "./src/nft/nft.service.ts");
let PuzzleController = class PuzzleController {
    constructor(puzzleService, rewardsService, nftService) {
        this.puzzleService = puzzleService;
        this.rewardsService = rewardsService;
        this.nftService = nftService;
    }
    async create(body) {
        return this.puzzleService.createPuzzle(body.puzzleId, body.solution);
    }
    async verify(body) {
        const verification = await this.puzzleService.verifySolution(body.puzzleId, body.solution);
        if (verification.verified) {
            await this.puzzleService.markCompleted(body.puzzleId, body.userAddress);
            const rewardResult = await this.rewardsService.distributeReward(body.userAddress, 100);
            const nftResult = await this.nftService.mintNFT(body.userAddress, Date.now(), `ipfs://puzzle-${body.puzzleId}-achievement`);
            return {
                ...verification,
                rewardDistributed: rewardResult.success,
                rewardTransactionHash: rewardResult.transactionHash,
                nftMinted: nftResult.success,
                nftTransactionHash: nftResult.transactionHash,
            };
        }
        return verification;
    }
};
exports.PuzzleController = PuzzleController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PuzzleController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PuzzleController.prototype, "verify", null);
exports.PuzzleController = PuzzleController = __decorate([
    (0, common_1.Controller)('puzzle'),
    __metadata("design:paramtypes", [typeof (_a = typeof puzzle_service_1.PuzzleService !== "undefined" && puzzle_service_1.PuzzleService) === "function" ? _a : Object, typeof (_b = typeof rewards_service_1.RewardsService !== "undefined" && rewards_service_1.RewardsService) === "function" ? _b : Object, typeof (_c = typeof nft_service_1.NFTService !== "undefined" && nft_service_1.NFTService) === "function" ? _c : Object])
], PuzzleController);


/***/ }),

/***/ "./src/puzzle/puzzle.module.ts":
/*!*************************************!*\
  !*** ./src/puzzle/puzzle.module.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzleModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const puzzle_service_1 = __webpack_require__(/*! ./puzzle.service */ "./src/puzzle/puzzle.service.ts");
const puzzle_controller_1 = __webpack_require__(/*! ./puzzle.controller */ "./src/puzzle/puzzle.controller.ts");
const soroban_module_1 = __webpack_require__(/*! ../soroban/soroban.module */ "./src/soroban/soroban.module.ts");
const nft_module_1 = __webpack_require__(/*! ../nft/nft.module */ "./src/nft/nft.module.ts");
const rewards_module_1 = __webpack_require__(/*! ../rewards/rewards.module */ "./src/rewards/rewards.module.ts");
let PuzzleModule = class PuzzleModule {
};
exports.PuzzleModule = PuzzleModule;
exports.PuzzleModule = PuzzleModule = __decorate([
    (0, common_1.Module)({
        imports: [soroban_module_1.SorobanModule, nft_module_1.NFTModule, rewards_module_1.RewardsModule],
        controllers: [puzzle_controller_1.PuzzleController],
        providers: [puzzle_service_1.PuzzleService],
    })
], PuzzleModule);


/***/ }),

/***/ "./src/puzzle/puzzle.service.ts":
/*!**************************************!*\
  !*** ./src/puzzle/puzzle.service.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuzzleService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const soroban_service_1 = __webpack_require__(/*! ../soroban/soroban.service */ "./src/soroban/soroban.service.ts");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const stellar_sdk_1 = __webpack_require__(/*! @stellar/stellar-sdk */ "@stellar/stellar-sdk");
const crypto = __importStar(__webpack_require__(/*! crypto */ "crypto"));
let PuzzleService = class PuzzleService {
    constructor(sorobanService, configService) {
        this.sorobanService = sorobanService;
        this.configService = configService;
        this.puzzleContractId = this.configService.get('PUZZLE_CONTRACT_ID');
    }
    async createPuzzle(puzzleId, solution) {
        const solutionHash = crypto
            .createHash('sha256')
            .update(solution)
            .digest('hex');
        const params = [
            (0, stellar_sdk_1.nativeToScVal)(puzzleId, { type: 'u64' }),
            (0, stellar_sdk_1.nativeToScVal)(solutionHash, { type: 'string' }),
        ];
        const result = await this.sorobanService.invokeContract(this.puzzleContractId, 'create_puzzle', params);
        return {
            success: result.status === 'SUCCESS',
            puzzleId,
            transactionHash: result.hash,
        };
    }
    async verifySolution(puzzleId, solution) {
        const params = [
            (0, stellar_sdk_1.nativeToScVal)(puzzleId, { type: 'u64' }),
            (0, stellar_sdk_1.nativeToScVal)(solution, { type: 'string' }),
        ];
        const result = await this.sorobanService.invokeContract(this.puzzleContractId, 'verify_solution', params);
        return {
            verified: result.status === 'SUCCESS',
            puzzleId,
            transactionHash: result.hash,
        };
    }
    async markCompleted(puzzleId, userAddress) {
        const params = [
            (0, stellar_sdk_1.nativeToScVal)(puzzleId, { type: 'u64' }),
            new stellar_sdk_1.Address(userAddress).toScVal(),
        ];
        const result = await this.sorobanService.invokeContract(this.puzzleContractId, 'mark_completed', params);
        return {
            success: result.status === 'SUCCESS',
            puzzleId,
            user: userAddress,
            transactionHash: result.hash,
        };
    }
};
exports.PuzzleService = PuzzleService;
exports.PuzzleService = PuzzleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof soroban_service_1.SorobanService !== "undefined" && soroban_service_1.SorobanService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], PuzzleService);


/***/ }),

/***/ "./src/puzzles/category.controller.ts":
/*!********************************************!*\
  !*** ./src/puzzles/category.controller.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CategoriesController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const category_service_1 = __webpack_require__(/*! ./category.service */ "./src/puzzles/category.service.ts");
const create_category_dto_1 = __webpack_require__(/*! ./dto/create-category.dto */ "./src/puzzles/dto/create-category.dto.ts");
const update_category_dto_1 = __webpack_require__(/*! ./dto/update-category.dto */ "./src/puzzles/dto/update-category.dto.ts");
let CategoriesController = class CategoriesController {
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    create(createCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }
    findAll() {
        return this.categoriesService.findAll();
    }
    findOne(id) {
        return this.categoriesService.findOne(id);
    }
    update(id, updateCategoryDto) {
        return this.categoriesService.update(id, updateCategoryDto);
    }
    remove(id) {
        return this.categoriesService.remove(id);
    }
};
exports.CategoriesController = CategoriesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_category_dto_1.CreateCategoryDto !== "undefined" && create_category_dto_1.CreateCategoryDto) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], CategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], CategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], CategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof update_category_dto_1.UpdateCategoryDto !== "undefined" && update_category_dto_1.UpdateCategoryDto) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], CategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], CategoriesController.prototype, "remove", null);
exports.CategoriesController = CategoriesController = __decorate([
    (0, common_1.Controller)('categories'),
    __metadata("design:paramtypes", [typeof (_a = typeof category_service_1.CategoriesService !== "undefined" && category_service_1.CategoriesService) === "function" ? _a : Object])
], CategoriesController);


/***/ }),

/***/ "./src/puzzles/category.service.ts":
/*!*****************************************!*\
  !*** ./src/puzzles/category.service.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CategoriesService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const category_entity_1 = __webpack_require__(/*! ./entities/category.entity */ "./src/puzzles/entities/category.entity.ts");
const puzzle_entity_1 = __webpack_require__(/*! ./entities/puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
let CategoriesService = class CategoriesService {
    constructor(categoriesRepository, puzzlesRepository) {
        this.categoriesRepository = categoriesRepository;
        this.puzzlesRepository = puzzlesRepository;
    }
    async create(createCategoryDto) {
        const category = this.categoriesRepository.create(createCategoryDto);
        return this.categoriesRepository.save(category);
    }
    async findAll() {
        return this.categoriesRepository.find({});
    }
    async findOne(id) {
        const category = await this.categoriesRepository.findOne({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID "${id}" not found`);
        }
        return category;
    }
    async update(id, updateCategoryDto) {
        const category = await this.findOne(id);
        Object.assign(category, updateCategoryDto);
        return this.categoriesRepository.save(category);
    }
    async remove(id) {
        const category = await this.findOne(id);
        const result = await this.categoriesRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Category with ID "${id}" not found`);
        }
    }
    getCategoryRepository() {
        return this.categoriesRepository;
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(1, (0, typeorm_1.InjectRepository)(puzzle_entity_1.Puzzle)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], CategoriesService);


/***/ }),

/***/ "./src/puzzles/collection.controller.ts":
/*!**********************************************!*\
  !*** ./src/puzzles/collection.controller.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CollectionsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const collection_service_1 = __webpack_require__(/*! ./collection.service */ "./src/puzzles/collection.service.ts");
const create_collection_dto_1 = __webpack_require__(/*! ./dto/create-collection.dto */ "./src/puzzles/dto/create-collection.dto.ts");
const update_collection_dto_1 = __webpack_require__(/*! ./dto/update-collection.dto */ "./src/puzzles/dto/update-collection.dto.ts");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CollectionQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    IsUUID({}, { each: true }),
    __metadata("design:type", Array)
], CollectionQueryDto.prototype, "categoryIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    IsUUID({}, { each: true }),
    __metadata("design:type", Array)
], CollectionQueryDto.prototype, "themeIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    IsString(),
    __metadata("design:type", String)
], CollectionQueryDto.prototype, "search", void 0);
let CollectionsController = class CollectionsController {
    constructor(collectionsService) {
        this.collectionsService = collectionsService;
    }
    create(createCollectionDto) {
        return this.collectionsService.create(createCollectionDto);
    }
    findAll(query) {
        return this.collectionsService.findAll(query);
    }
    findOne(id) {
        return this.collectionsService.findOne(id);
    }
    update(id, updateCollectionDto) {
        return this.collectionsService.update(id, updateCollectionDto);
    }
    remove(id) {
        return this.collectionsService.remove(id);
    }
};
exports.CollectionsController = CollectionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_collection_dto_1.CreateCollectionDto !== "undefined" && create_collection_dto_1.CreateCollectionDto) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], CollectionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CollectionQueryDto]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], CollectionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], CollectionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof update_collection_dto_1.UpdateCollectionDto !== "undefined" && update_collection_dto_1.UpdateCollectionDto) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], CollectionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], CollectionsController.prototype, "remove", null);
exports.CollectionsController = CollectionsController = __decorate([
    (0, common_1.Controller)('collections'),
    __metadata("design:paramtypes", [typeof (_a = typeof collection_service_1.CollectionsService !== "undefined" && collection_service_1.CollectionsService) === "function" ? _a : Object])
], CollectionsController);


/***/ }),

/***/ "./src/puzzles/collection.service.ts":
/*!*******************************************!*\
  !*** ./src/puzzles/collection.service.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CollectionsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const collection_entity_1 = __webpack_require__(/*! ./entities/collection.entity */ "./src/puzzles/entities/collection.entity.ts");
const puzzle_entity_1 = __webpack_require__(/*! ./entities/puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
const category_entity_1 = __webpack_require__(/*! ./entities/category.entity */ "./src/puzzles/entities/category.entity.ts");
const user_collection_progress_entity_1 = __webpack_require__(/*! ../user-progress/entities/user-collection-progress.entity */ "./src/user-progress/entities/user-collection-progress.entity.ts");
let CollectionsService = class CollectionsService {
    constructor(collectionsRepository, puzzlesRepository, categoriesRepository, userCollectionProgressRepository) {
        this.collectionsRepository = collectionsRepository;
        this.puzzlesRepository = puzzlesRepository;
        this.categoriesRepository = categoriesRepository;
        this.userCollectionProgressRepository = userCollectionProgressRepository;
    }
    async create(createCollectionDto) {
        const { puzzleIds, categoryIds, rewards, ...collectionData } = createCollectionDto;
        const collection = this.collectionsRepository.create({
            ...collectionData,
            rewards: rewards || [],
        });
        if (puzzleIds && puzzleIds.length > 0) {
            const puzzles = await this.puzzlesRepository.findBy({ id: (0, typeorm_2.In)(puzzleIds) });
            if (puzzles.length !== puzzleIds.length) {
                throw new common_1.BadRequestException('One or more puzzle IDs not found.');
            }
            collection.puzzles = puzzles;
        }
        if (categoryIds && categoryIds.length > 0) {
            const categories = await this.categoriesRepository.findBy({ id: (0, typeorm_2.In)(categoryIds) });
            if (categories.length !== categoryIds.length) {
                throw new common_1.BadRequestException('One or more category IDs not found.');
            }
            collection.categories = categories;
        }
        return this.collectionsRepository.save(collection);
    }
    async findAll() {
        return this.collectionsRepository.find({
            relations: ['puzzles', 'categories', 'userProgress'],
        });
    }
    async findOne(id) {
        const collection = await this.collectionsRepository.findOne({
            where: { id },
            relations: ['puzzles', 'categories', 'userProgress'],
        });
        if (!collection) {
            throw new common_1.NotFoundException(`Collection with ID "${id}" not found`);
        }
        return collection;
    }
    async update(id, updateCollectionDto) {
        const collection = await this.findOne(id);
        const { puzzleIds, categoryIds, rewards, ...collectionData } = updateCollectionDto;
        Object.assign(collection, collectionData);
        if (rewards !== undefined) {
            collection.rewards = rewards;
        }
        if (puzzleIds !== undefined) {
            if (puzzleIds.length > 0) {
                const puzzles = await this.puzzlesRepository.findBy({ id: (0, typeorm_2.In)(puzzleIds) });
                if (puzzles.length !== puzzleIds.length) {
                    throw new common_1.BadRequestException('One or more puzzle IDs not found.');
                }
                collection.puzzles = puzzles;
            }
            else {
                collection.puzzles = [];
            }
        }
        if (categoryIds !== undefined) {
            if (categoryIds.length > 0) {
                const categories = await this.categoriesRepository.findBy({ id: (0, typeorm_2.In)(categoryIds) });
                if (categories.length !== categoryIds.length) {
                    throw new common_1.BadRequestException('One or more category IDs not found.');
                }
                collection.categories = categories;
            }
            else {
                collection.categories = [];
            }
        }
        return this.collectionsRepository.save(collection);
    }
    async remove(id) {
        await this.findOne(id);
        const result = await this.collectionsRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Collection with ID "${id}" not found`);
        }
    }
    async grantRewards(collectionId, userId) {
        const collection = await this.findOne(collectionId);
        if (!collection.rewards || collection.rewards.length === 0) {
            return;
        }
        console.log(`Granting ${collection.rewards.length} rewards to user ${userId} for completing collection ${collectionId}.`);
    }
    getCollectionRepository() {
        return this.collectionsRepository;
    }
};
exports.CollectionsService = CollectionsService;
exports.CollectionsService = CollectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(collection_entity_1.Collection)),
    __param(1, (0, typeorm_1.InjectRepository)(puzzle_entity_1.Puzzle)),
    __param(2, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(3, (0, typeorm_1.InjectRepository)(user_collection_progress_entity_1.UserCollectionProgress)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _d : Object])
], CollectionsService);


/***/ }),

/***/ "./src/puzzles/dto/bulk-operations.dto.ts":
/*!************************************************!*\
  !*** ./src/puzzles/dto/bulk-operations.dto.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

/***/ "./src/puzzles/dto/create-category.dto.ts":
/*!************************************************!*\
  !*** ./src/puzzles/dto/create-category.dto.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateCategoryDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateCategoryDto {
}
exports.CreateCategoryDto = CreateCategoryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "description", void 0);


/***/ }),

/***/ "./src/puzzles/dto/create-collection.dto.ts":
/*!**************************************************!*\
  !*** ./src/puzzles/dto/create-collection.dto.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateCollectionDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
class RewardDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RewardDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RewardDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    IsNumber(),
    __metadata("design:type", Number)
], RewardDto.prototype, "quantity", void 0);
class CreateCollectionDto {
}
exports.CreateCollectionDto = CreateCollectionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)({}, { each: true }),
    __metadata("design:type", Array)
], CreateCollectionDto.prototype, "puzzleIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)({}, { each: true }),
    __metadata("design:type", Array)
], CreateCollectionDto.prototype, "categoryIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RewardDto),
    __metadata("design:type", Array)
], CreateCollectionDto.prototype, "rewards", void 0);


/***/ }),

/***/ "./src/puzzles/dto/create-puzzle.dto.ts":
/*!**********************************************!*\
  !*** ./src/puzzles/dto/create-puzzle.dto.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

/***/ "./src/puzzles/dto/create-theme.dto.ts":
/*!*********************************************!*\
  !*** ./src/puzzles/dto/create-theme.dto.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateThemeDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateThemeDto {
}
exports.CreateThemeDto = CreateThemeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateThemeDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateThemeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)({}, { each: true }),
    __metadata("design:type", Array)
], CreateThemeDto.prototype, "collectionIds", void 0);


/***/ }),

/***/ "./src/puzzles/dto/index.ts":
/*!**********************************!*\
  !*** ./src/puzzles/dto/index.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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

/***/ "./src/puzzles/dto/update-category.dto.ts":
/*!************************************************!*\
  !*** ./src/puzzles/dto/update-category.dto.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateCategoryDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_category_dto_1 = __webpack_require__(/*! ./create-category.dto */ "./src/puzzles/dto/create-category.dto.ts");
class UpdateCategoryDto extends (0, mapped_types_1.PartialType)(create_category_dto_1.CreateCategoryDto) {
}
exports.UpdateCategoryDto = UpdateCategoryDto;


/***/ }),

/***/ "./src/puzzles/dto/update-collection.dto.ts":
/*!**************************************************!*\
  !*** ./src/puzzles/dto/update-collection.dto.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateCollectionDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_collection_dto_1 = __webpack_require__(/*! ./create-collection.dto */ "./src/puzzles/dto/create-collection.dto.ts");
class UpdateCollectionDto extends (0, mapped_types_1.PartialType)(create_collection_dto_1.CreateCollectionDto) {
}
exports.UpdateCollectionDto = UpdateCollectionDto;


/***/ }),

/***/ "./src/puzzles/dto/update-puzzle.dto.ts":
/*!**********************************************!*\
  !*** ./src/puzzles/dto/update-puzzle.dto.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

/***/ "./src/puzzles/dto/update-theme.dto.ts":
/*!*********************************************!*\
  !*** ./src/puzzles/dto/update-theme.dto.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateThemeDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_theme_dto_1 = __webpack_require__(/*! ./create-theme.dto */ "./src/puzzles/dto/create-theme.dto.ts");
class UpdateThemeDto extends (0, mapped_types_1.PartialType)(create_theme_dto_1.CreateThemeDto) {
}
exports.UpdateThemeDto = UpdateThemeDto;


/***/ }),

/***/ "./src/puzzles/entities/category.entity.ts":
/*!*************************************************!*\
  !*** ./src/puzzles/entities/category.entity.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Category = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const puzzle_entity_1 = __webpack_require__(/*! ./puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
let Category = class Category {
};
exports.Category = Category;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Category.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Category.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => puzzle_entity_1.Puzzle, (puzzle) => puzzle.categories),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Category.prototype, "puzzles", void 0);
exports.Category = Category = __decorate([
    (0, typeorm_1.Entity)()
], Category);


/***/ }),

/***/ "./src/puzzles/entities/collection.entity.ts":
/*!***************************************************!*\
  !*** ./src/puzzles/entities/collection.entity.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Collection = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const puzzle_entity_1 = __webpack_require__(/*! ./puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
const category_entity_1 = __webpack_require__(/*! ./category.entity */ "./src/puzzles/entities/category.entity.ts");
const user_collection_progress_entity_1 = __webpack_require__(/*! ../../user-progress/entities/user-collection-progress.entity */ "./src/user-progress/entities/user-collection-progress.entity.ts");
let Collection = class Collection {
};
exports.Collection = Collection;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Collection.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Collection.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Collection.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => puzzle_entity_1.Puzzle, (puzzle) => puzzle.collections),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Collection.prototype, "puzzles", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => category_entity_1.Category, (category) => category.collections),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Collection.prototype, "categories", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_collection_progress_entity_1.UserCollectionProgress, (userCollectionProgress) => userCollectionProgress.collection),
    __metadata("design:type", Array)
], Collection.prototype, "userProgress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", typeof (_a = typeof Array !== "undefined" && Array) === "function" ? _a : Object)
], Collection.prototype, "rewards", void 0);
exports.Collection = Collection = __decorate([
    (0, typeorm_1.Entity)()
], Collection);


/***/ }),

/***/ "./src/puzzles/entities/puzzle-rating.entity.ts":
/*!******************************************************!*\
  !*** ./src/puzzles/entities/puzzle-rating.entity.ts ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

/***/ "./src/puzzles/entities/theme.entity.ts":
/*!**********************************************!*\
  !*** ./src/puzzles/entities/theme.entity.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Theme = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const collection_entity_1 = __webpack_require__(/*! ./collection.entity */ "./src/puzzles/entities/collection.entity.ts");
let Theme = class Theme {
};
exports.Theme = Theme;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Theme.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Theme.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Theme.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => collection_entity_1.Collection, (collection) => collection.themes),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Theme.prototype, "collections", void 0);
exports.Theme = Theme = __decorate([
    (0, typeorm_1.Entity)('themes')
], Theme);


/***/ }),

/***/ "./src/puzzles/puzzles.controller.ts":
/*!*******************************************!*\
  !*** ./src/puzzles/puzzles.controller.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

"use strict";

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
const puzzle_entity_1 = __webpack_require__(/*! ./entities/puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
const puzzle_progress_entity_1 = __webpack_require__(/*! ../game-logic/entities/puzzle-progress.entity */ "./src/game-logic/entities/puzzle-progress.entity.ts");
const puzzle_rating_entity_1 = __webpack_require__(/*! ./entities/puzzle-rating.entity */ "./src/puzzles/entities/puzzle-rating.entity.ts");
const category_entity_1 = __webpack_require__(/*! ./entities/category.entity */ "./src/puzzles/entities/category.entity.ts");
const category_service_1 = __webpack_require__(/*! ./category.service */ "./src/puzzles/category.service.ts");
const category_controller_1 = __webpack_require__(/*! ./category.controller */ "./src/puzzles/category.controller.ts");
const collection_entity_1 = __webpack_require__(/*! ./entities/collection.entity */ "./src/puzzles/entities/collection.entity.ts");
const collection_service_1 = __webpack_require__(/*! ./collection.service */ "./src/puzzles/collection.service.ts");
const collection_controller_1 = __webpack_require__(/*! ./collection.controller */ "./src/puzzles/collection.controller.ts");
const theme_entity_1 = __webpack_require__(/*! ./entities/theme.entity */ "./src/puzzles/entities/theme.entity.ts");
const theme_service_1 = __webpack_require__(/*! ./theme.service */ "./src/puzzles/theme.service.ts");
const theme_controller_1 = __webpack_require__(/*! ./theme.controller */ "./src/puzzles/theme.controller.ts");
let PuzzlesModule = class PuzzlesModule {
};
exports.PuzzlesModule = PuzzlesModule;
exports.PuzzlesModule = PuzzlesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                puzzle_entity_1.Puzzle,
                puzzle_progress_entity_1.PuzzleProgress,
                puzzle_rating_entity_1.PuzzleRating,
                category_entity_1.Category,
                collection_entity_1.Collection,
                theme_entity_1.Theme
            ])
        ],
        controllers: [
            puzzles_controller_1.PuzzlesController,
            category_controller_1.CategoriesController,
            collection_controller_1.CollectionsController,
            theme_controller_1.ThemesController
        ],
        providers: [
            puzzles_service_1.PuzzlesService,
            category_service_1.CategoriesService,
            collection_service_1.CollectionsService,
            theme_service_1.ThemesService
        ],
        exports: [puzzles_service_1.PuzzlesService]
    })
], PuzzlesModule);


/***/ }),

/***/ "./src/puzzles/puzzles.service.ts":
/*!****************************************!*\
  !*** ./src/puzzles/puzzles.service.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

/***/ "./src/puzzles/theme.controller.ts":
/*!*****************************************!*\
  !*** ./src/puzzles/theme.controller.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ThemesController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const theme_service_1 = __webpack_require__(/*! ./theme.service */ "./src/puzzles/theme.service.ts");
const create_theme_dto_1 = __webpack_require__(/*! ./dto/create-theme.dto */ "./src/puzzles/dto/create-theme.dto.ts");
const update_theme_dto_1 = __webpack_require__(/*! ./dto/update-theme.dto */ "./src/puzzles/dto/update-theme.dto.ts");
let ThemesController = class ThemesController {
    constructor(themesService) {
        this.themesService = themesService;
    }
    create(createThemeDto) {
        return this.themesService.create(createThemeDto);
    }
    findAll() {
        return this.themesService.findAll();
    }
    findOne(id) {
        return this.themesService.findOne(id);
    }
    update(id, updateThemeDto) {
        return this.themesService.update(id, updateThemeDto);
    }
    remove(id) {
        return this.themesService.remove(id);
    }
};
exports.ThemesController = ThemesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_theme_dto_1.CreateThemeDto !== "undefined" && create_theme_dto_1.CreateThemeDto) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], ThemesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], ThemesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], ThemesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof update_theme_dto_1.UpdateThemeDto !== "undefined" && update_theme_dto_1.UpdateThemeDto) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], ThemesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], ThemesController.prototype, "remove", null);
exports.ThemesController = ThemesController = __decorate([
    (0, common_1.Controller)('themes'),
    __metadata("design:paramtypes", [typeof (_a = typeof theme_service_1.ThemesService !== "undefined" && theme_service_1.ThemesService) === "function" ? _a : Object])
], ThemesController);


/***/ }),

/***/ "./src/puzzles/theme.service.ts":
/*!**************************************!*\
  !*** ./src/puzzles/theme.service.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ThemesService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const theme_entity_1 = __webpack_require__(/*! ./entities/theme.entity */ "./src/puzzles/entities/theme.entity.ts");
const collection_entity_1 = __webpack_require__(/*! ./entities/collection.entity */ "./src/puzzles/entities/collection.entity.ts");
let ThemesService = class ThemesService {
    constructor(themesRepository, collectionsRepository) {
        this.themesRepository = themesRepository;
        this.collectionsRepository = collectionsRepository;
    }
    async create(createThemeDto) {
        const { collectionIds, ...themeData } = createThemeDto;
        const theme = this.themesRepository.create(themeData);
        if (collectionIds && collectionIds.length > 0) {
            const collections = await this.collectionsRepository.findBy({ id: (0, typeorm_2.In)(collectionIds) });
            if (collections.length !== collectionIds.length) {
                throw new common_1.BadRequestException('One or more collection IDs not found.');
            }
            theme.collections = collections;
        }
        return this.themesRepository.save(theme);
    }
    async findAll() {
        return this.themesRepository.find({
            relations: ['collections'],
        });
    }
    async findOne(id) {
        const theme = await this.themesRepository.findOne({
            where: { id },
            relations: ['collections'],
        });
        if (!theme) {
            throw new common_1.NotFoundException(`Theme with ID "${id}" not found`);
        }
        return theme;
    }
    async update(id, updateThemeDto) {
        const theme = await this.findOne(id);
        const { collectionIds, ...themeData } = updateThemeDto;
        Object.assign(theme, themeData);
        if (collectionIds !== undefined) {
            if (collectionIds.length > 0) {
                const collections = await this.collectionsRepository.findBy({ id: (0, typeorm_2.In)(collectionIds) });
                if (collections.length !== collectionIds.length) {
                    throw new common_1.BadRequestException('One or more collection IDs not found.');
                }
                theme.collections = collections;
            }
            else {
                theme.collections = [];
            }
        }
        return this.themesRepository.save(theme);
    }
    async remove(id) {
        await this.findOne(id);
        const result = await this.themesRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Theme with ID "${id}" not found`);
        }
    }
};
exports.ThemesService = ThemesService;
exports.ThemesService = ThemesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(theme_entity_1.Theme)),
    __param(1, (0, typeorm_1.InjectRepository)(collection_entity_1.Collection)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], ThemesService);


/***/ }),

/***/ "./src/rabbitmq/rabbitmq.module.ts":
/*!*****************************************!*\
  !*** ./src/rabbitmq/rabbitmq.module.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RabbitMQModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
let RabbitMQModule = class RabbitMQModule {
};
exports.RabbitMQModule = RabbitMQModule;
exports.RabbitMQModule = RabbitMQModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.registerAsync([
                {
                    name: 'REPLAY_SERVICE',
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [configService.get('RABBITMQ_URL') || 'amqp://admin:rabbitmq123@rabbitmq:5672'],
                            queue: 'replay_queue',
                            queueOptions: {
                                durable: true,
                            },
                        },
                    }),
                    inject: [config_1.ConfigService],
                },
            ]),
        ],
        exports: [microservices_1.ClientsModule],
    })
], RabbitMQModule);


/***/ }),

/***/ "./src/referrals/dto/create-referral-code.dto.ts":
/*!*******************************************************!*\
  !*** ./src/referrals/dto/create-referral-code.dto.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateReferralCodeDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateReferralCodeDto {
}
exports.CreateReferralCodeDto = CreateReferralCodeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateReferralCodeDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateReferralCodeDto.prototype, "isActive", void 0);


/***/ }),

/***/ "./src/referrals/dto/referral-analytics.dto.ts":
/*!*****************************************************!*\
  !*** ./src/referrals/dto/referral-analytics.dto.ts ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReferralAnalyticsDto = exports.ReferralAnalyticsPeriod = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
var ReferralAnalyticsPeriod;
(function (ReferralAnalyticsPeriod) {
    ReferralAnalyticsPeriod["DAY"] = "day";
    ReferralAnalyticsPeriod["WEEK"] = "week";
    ReferralAnalyticsPeriod["MONTH"] = "month";
    ReferralAnalyticsPeriod["YEAR"] = "year";
    ReferralAnalyticsPeriod["ALL_TIME"] = "all_time";
})(ReferralAnalyticsPeriod || (exports.ReferralAnalyticsPeriod = ReferralAnalyticsPeriod = {}));
class ReferralAnalyticsDto {
}
exports.ReferralAnalyticsDto = ReferralAnalyticsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ReferralAnalyticsDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ReferralAnalyticsDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ReferralAnalyticsPeriod),
    __metadata("design:type", String)
], ReferralAnalyticsDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReferralAnalyticsDto.prototype, "userId", void 0);


/***/ }),

/***/ "./src/referrals/dto/referral-leaderboard.dto.ts":
/*!*******************************************************!*\
  !*** ./src/referrals/dto/referral-leaderboard.dto.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReferralLeaderboardDto = exports.ReferralLeaderboardType = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
var ReferralLeaderboardType;
(function (ReferralLeaderboardType) {
    ReferralLeaderboardType["TOTAL_REFERRALS"] = "total_referrals";
    ReferralLeaderboardType["ACTIVE_REFERRALS"] = "active_referrals";
    ReferralLeaderboardType["REWARDS_EARNED"] = "rewards_earned";
})(ReferralLeaderboardType || (exports.ReferralLeaderboardType = ReferralLeaderboardType = {}));
class ReferralLeaderboardDto {
    constructor() {
        this.type = ReferralLeaderboardType.TOTAL_REFERRALS;
        this.limit = 100;
        this.offset = 0;
    }
}
exports.ReferralLeaderboardDto = ReferralLeaderboardDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ReferralLeaderboardType),
    __metadata("design:type", String)
], ReferralLeaderboardDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ReferralLeaderboardDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ReferralLeaderboardDto.prototype, "offset", void 0);


/***/ }),

/***/ "./src/referrals/dto/use-referral-code.dto.ts":
/*!****************************************************!*\
  !*** ./src/referrals/dto/use-referral-code.dto.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UseReferralCodeDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class UseReferralCodeDto {
}
exports.UseReferralCodeDto = UseReferralCodeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UseReferralCodeDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UseReferralCodeDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UseReferralCodeDto.prototype, "campaign", void 0);


/***/ }),

/***/ "./src/referrals/entities/referral-code.entity.ts":
/*!********************************************************!*\
  !*** ./src/referrals/entities/referral-code.entity.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReferralCode = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
let ReferralCode = class ReferralCode {
};
exports.ReferralCode = ReferralCode;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReferralCode.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ReferralCode.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ReferralCode.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], ReferralCode.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ReferralCode.prototype, "totalReferrals", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ReferralCode.prototype, "activeReferrals", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ReferralCode.prototype, "totalRewardsEarned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ReferralCode.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], ReferralCode.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], ReferralCode.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], ReferralCode.prototype, "updatedAt", void 0);
exports.ReferralCode = ReferralCode = __decorate([
    (0, typeorm_1.Entity)('referral_codes'),
    (0, typeorm_1.Index)(['code'], { unique: true }),
    (0, typeorm_1.Index)(['userId'], { unique: true })
], ReferralCode);


/***/ }),

/***/ "./src/referrals/entities/referral.entity.ts":
/*!***************************************************!*\
  !*** ./src/referrals/entities/referral.entity.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Referral = exports.ReferralStatus = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const referral_code_entity_1 = __webpack_require__(/*! ./referral-code.entity */ "./src/referrals/entities/referral-code.entity.ts");
var ReferralStatus;
(function (ReferralStatus) {
    ReferralStatus["PENDING"] = "pending";
    ReferralStatus["COMPLETED"] = "completed";
    ReferralStatus["REWARDED"] = "rewarded";
    ReferralStatus["CANCELLED"] = "cancelled";
})(ReferralStatus || (exports.ReferralStatus = ReferralStatus = {}));
let Referral = class Referral {
};
exports.Referral = Referral;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Referral.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Referral.prototype, "referrerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'referrerId' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], Referral.prototype, "referrer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Referral.prototype, "refereeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'refereeId' }),
    __metadata("design:type", typeof (_b = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _b : Object)
], Referral.prototype, "referee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Referral.prototype, "referralCodeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => referral_code_entity_1.ReferralCode),
    (0, typeorm_1.JoinColumn)({ name: 'referralCodeId' }),
    __metadata("design:type", typeof (_c = typeof referral_code_entity_1.ReferralCode !== "undefined" && referral_code_entity_1.ReferralCode) === "function" ? _c : Object)
], Referral.prototype, "referralCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: ReferralStatus.PENDING,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Referral.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Referral.prototype, "referrerReward", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Referral.prototype, "refereeReward", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Referral.prototype, "referrerRewarded", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Referral.prototype, "refereeRewarded", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Referral.prototype, "referrerRewardedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Referral.prototype, "refereeRewardedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], Referral.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Referral.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], Referral.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_h = typeof Date !== "undefined" && Date) === "function" ? _h : Object)
], Referral.prototype, "updatedAt", void 0);
exports.Referral = Referral = __decorate([
    (0, typeorm_1.Entity)('referrals'),
    (0, typeorm_1.Index)(['referrerId', 'refereeId'], { unique: true }),
    (0, typeorm_1.Index)(['referralCodeId']),
    (0, typeorm_1.Index)(['refereeId']),
    (0, typeorm_1.Index)(['status'])
], Referral);


/***/ }),

/***/ "./src/referrals/referral-analytics.service.ts":
/*!*****************************************************!*\
  !*** ./src/referrals/referral-analytics.service.ts ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReferralAnalyticsService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReferralAnalyticsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const referral_entity_1 = __webpack_require__(/*! ./entities/referral.entity */ "./src/referrals/entities/referral.entity.ts");
const referral_code_entity_1 = __webpack_require__(/*! ./entities/referral-code.entity */ "./src/referrals/entities/referral-code.entity.ts");
const referral_analytics_dto_1 = __webpack_require__(/*! ./dto/referral-analytics.dto */ "./src/referrals/dto/referral-analytics.dto.ts");
const referral_entity_2 = __webpack_require__(/*! ./entities/referral.entity */ "./src/referrals/entities/referral.entity.ts");
let ReferralAnalyticsService = ReferralAnalyticsService_1 = class ReferralAnalyticsService {
    constructor(referralRepository, referralCodeRepository) {
        this.referralRepository = referralRepository;
        this.referralCodeRepository = referralCodeRepository;
        this.logger = new common_1.Logger(ReferralAnalyticsService_1.name);
    }
    async getAnalytics(dto) {
        const { startDate, endDate, period, userId } = dto;
        let dateRange = null;
        if (startDate && endDate) {
            dateRange = {
                start: new Date(startDate),
                end: new Date(endDate),
            };
        }
        else if (period && period !== referral_analytics_dto_1.ReferralAnalyticsPeriod.ALL_TIME) {
            dateRange = this.getPeriodDateRange(period);
        }
        const whereClause = {};
        if (userId) {
            whereClause.referrerId = userId;
        }
        if (dateRange) {
            whereClause.createdAt = (0, typeorm_2.Between)(dateRange.start, dateRange.end);
        }
        const referrals = await this.referralRepository.find({
            where: whereClause,
            relations: ['referrer', 'referee'],
        });
        const totalReferrals = referrals.length;
        const completedReferrals = referrals.filter((r) => r.status === referral_entity_2.ReferralStatus.COMPLETED).length;
        const pendingReferrals = referrals.filter((r) => r.status === referral_entity_2.ReferralStatus.PENDING).length;
        const totalRewardsDistributed = referrals
            .filter((r) => r.referrerRewarded)
            .reduce((sum, r) => sum + r.referrerReward, 0) +
            referrals
                .filter((r) => r.refereeRewarded)
                .reduce((sum, r) => sum + r.refereeReward, 0);
        const referrerRewards = referrals
            .filter((r) => r.referrerRewarded)
            .reduce((sum, r) => sum + r.referrerReward, 0);
        const refereeRewards = referrals
            .filter((r) => r.refereeRewarded)
            .reduce((sum, r) => sum + r.refereeReward, 0);
        const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;
        const averageRewardsPerReferral = completedReferrals > 0
            ? totalRewardsDistributed / completedReferrals
            : 0;
        const referralsByStatus = referrals.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});
        const referralsByPeriod = this.groupReferralsByPeriod(referrals, period || referral_analytics_dto_1.ReferralAnalyticsPeriod.DAY);
        const topReferrers = await this.getTopReferrers(userId, dateRange, 10);
        return {
            totalReferrals,
            completedReferrals,
            pendingReferrals,
            totalRewardsDistributed,
            referrerRewards,
            refereeRewards,
            conversionRate: Math.round(conversionRate * 100) / 100,
            averageRewardsPerReferral: Math.round(averageRewardsPerReferral * 100) / 100,
            referralsByStatus,
            referralsByPeriod,
            topReferrers,
        };
    }
    getPeriodDateRange(period) {
        const end = new Date();
        let start = new Date();
        switch (period) {
            case referral_analytics_dto_1.ReferralAnalyticsPeriod.DAY:
                start.setDate(start.getDate() - 1);
                break;
            case referral_analytics_dto_1.ReferralAnalyticsPeriod.WEEK:
                start.setDate(start.getDate() - 7);
                break;
            case referral_analytics_dto_1.ReferralAnalyticsPeriod.MONTH:
                start.setMonth(start.getMonth() - 1);
                break;
            case referral_analytics_dto_1.ReferralAnalyticsPeriod.YEAR:
                start.setFullYear(start.getFullYear() - 1);
                break;
        }
        return { start, end };
    }
    groupReferralsByPeriod(referrals, period) {
        const groups = new Map();
        referrals.forEach((referral) => {
            let key;
            const date = new Date(referral.createdAt);
            switch (period) {
                case referral_analytics_dto_1.ReferralAnalyticsPeriod.DAY:
                    key = date.toISOString().split('T')[0];
                    break;
                case referral_analytics_dto_1.ReferralAnalyticsPeriod.WEEK:
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case referral_analytics_dto_1.ReferralAnalyticsPeriod.MONTH:
                    const month = date.getMonth() + 1;
                    key = `${date.getFullYear()}-${month < 10 ? '0' : ''}${month}`;
                    break;
                case referral_analytics_dto_1.ReferralAnalyticsPeriod.YEAR:
                    key = String(date.getFullYear());
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }
            if (!groups.has(key)) {
                groups.set(key, { count: 0, completed: 0 });
            }
            const group = groups.get(key);
            group.count++;
            if (referral.status === referral_entity_2.ReferralStatus.COMPLETED) {
                group.completed++;
            }
        });
        return Array.from(groups.entries())
            .map(([period, data]) => ({ period, ...data }))
            .sort((a, b) => a.period.localeCompare(b.period));
    }
    async getTopReferrers(userId, dateRange, limit = 10) {
        const queryBuilder = this.referralCodeRepository
            .createQueryBuilder('rc')
            .leftJoin('rc.user', 'user')
            .select([
            'rc.userId',
            'user.username',
            'rc.totalReferrals',
            'rc.totalRewardsEarned',
        ])
            .where('rc.isActive = :isActive', { isActive: true })
            .andWhere('user.status = :status', { status: 'active' });
        if (userId) {
            queryBuilder.andWhere('rc.userId = :userId', { userId });
        }
        if (dateRange) {
            queryBuilder.andWhere('rc.createdAt BETWEEN :start AND :end', {
                start: dateRange.start,
                end: dateRange.end,
            });
        }
        queryBuilder
            .orderBy('rc.totalReferrals', 'DESC')
            .addOrderBy('rc.totalRewardsEarned', 'DESC')
            .limit(limit);
        const results = await queryBuilder.getRawMany();
        return results.map((result) => ({
            userId: result.rc_userId,
            username: result.user_username || 'Unknown',
            count: result.rc_totalReferrals || 0,
            rewards: result.rc_totalRewardsEarned || 0,
        }));
    }
    async getDashboardSummary(userId) {
        const whereClause = {};
        if (userId) {
            whereClause.referrerId = userId;
        }
        const [referrals, recentReferrals] = await Promise.all([
            this.referralRepository.find({ where: whereClause }),
            this.referralRepository.find({
                where: whereClause,
                relations: ['referee'],
                order: { createdAt: 'DESC' },
                take: 10,
            }),
        ]);
        const totalReferrals = referrals.length;
        const activeReferrals = referrals.filter((r) => r.status === referral_entity_2.ReferralStatus.PENDING).length;
        const completedReferrals = referrals.filter((r) => r.status === referral_entity_2.ReferralStatus.COMPLETED).length;
        const totalRewards = referrals
            .filter((r) => r.referrerRewarded)
            .reduce((sum, r) => sum + r.referrerReward, 0);
        return {
            totalReferrals,
            activeReferrals,
            completedReferrals,
            totalRewards,
            recentReferrals: recentReferrals.map((r) => ({
                id: r.id,
                refereeId: r.refereeId,
                refereeUsername: r.referee?.username || 'Unknown',
                status: r.status,
                createdAt: r.createdAt,
            })),
        };
    }
};
exports.ReferralAnalyticsService = ReferralAnalyticsService;
exports.ReferralAnalyticsService = ReferralAnalyticsService = ReferralAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(referral_entity_1.Referral)),
    __param(1, (0, typeorm_1.InjectRepository)(referral_code_entity_1.ReferralCode)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], ReferralAnalyticsService);


/***/ }),

/***/ "./src/referrals/referral-leaderboard.service.ts":
/*!*******************************************************!*\
  !*** ./src/referrals/referral-leaderboard.service.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReferralLeaderboardService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReferralLeaderboardService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const referral_code_entity_1 = __webpack_require__(/*! ./entities/referral-code.entity */ "./src/referrals/entities/referral-code.entity.ts");
const referral_leaderboard_dto_1 = __webpack_require__(/*! ./dto/referral-leaderboard.dto */ "./src/referrals/dto/referral-leaderboard.dto.ts");
let ReferralLeaderboardService = ReferralLeaderboardService_1 = class ReferralLeaderboardService {
    constructor(referralCodeRepository) {
        this.referralCodeRepository = referralCodeRepository;
        this.logger = new common_1.Logger(ReferralLeaderboardService_1.name);
    }
    async getLeaderboard(type = referral_leaderboard_dto_1.ReferralLeaderboardType.TOTAL_REFERRALS, limit = 100, offset = 0) {
        const queryBuilder = this.referralCodeRepository
            .createQueryBuilder('rc')
            .leftJoin('rc.user', 'user')
            .select([
            'rc.userId',
            'user.username',
            'rc.code',
            'rc.totalReferrals',
            'rc.activeReferrals',
            'rc.totalRewardsEarned',
        ])
            .where('rc.isActive = :isActive', { isActive: true })
            .andWhere('user.status = :status', { status: 'active' });
        queryBuilder
            .leftJoin('referrals', 'r', 'r.referralCodeId = rc.id AND r.status = :completedStatus', { completedStatus: 'completed' })
            .addSelect('COUNT(r.id)', 'completedReferrals')
            .groupBy('rc.id')
            .addGroupBy('user.id')
            .addGroupBy('user.username')
            .addGroupBy('rc.code')
            .addGroupBy('rc.totalReferrals')
            .addGroupBy('rc.activeReferrals')
            .addGroupBy('rc.totalRewardsEarned')
            .addGroupBy('rc.createdAt');
        switch (type) {
            case referral_leaderboard_dto_1.ReferralLeaderboardType.TOTAL_REFERRALS:
                queryBuilder.orderBy('rc.totalReferrals', 'DESC');
                break;
            case referral_leaderboard_dto_1.ReferralLeaderboardType.ACTIVE_REFERRALS:
                queryBuilder.orderBy('rc.activeReferrals', 'DESC');
                break;
            case referral_leaderboard_dto_1.ReferralLeaderboardType.REWARDS_EARNED:
                queryBuilder.orderBy('rc.totalRewardsEarned', 'DESC');
                break;
        }
        queryBuilder.addOrderBy('rc.totalReferrals', 'DESC');
        queryBuilder.addOrderBy('rc.createdAt', 'ASC');
        const countQuery = this.referralCodeRepository
            .createQueryBuilder('rc')
            .leftJoin('rc.user', 'user')
            .where('rc.isActive = :isActive', { isActive: true })
            .andWhere('user.status = :status', { status: 'active' });
        const total = await countQuery.getCount();
        queryBuilder.skip(offset).take(limit);
        const results = await queryBuilder.getRawMany();
        const entries = results.map((result, index) => ({
            userId: result.rc_userId,
            username: result.user_username || 'Unknown',
            code: result.rc_code,
            totalReferrals: result.rc_totalReferrals || 0,
            activeReferrals: result.rc_activeReferrals || 0,
            completedReferrals: parseInt(result.completedReferrals || '0', 10),
            totalRewardsEarned: result.rc_totalRewardsEarned || 0,
            rank: offset + index + 1,
        }));
        return {
            entries,
            total,
            type,
        };
    }
    async getUserRank(userId, type = referral_leaderboard_dto_1.ReferralLeaderboardType.TOTAL_REFERRALS) {
        const referralCode = await this.referralCodeRepository.findOne({
            where: { userId },
        });
        if (!referralCode || !referralCode.isActive) {
            return null;
        }
        const queryBuilder = this.referralCodeRepository
            .createQueryBuilder('rc')
            .where('rc.isActive = :isActive', { isActive: true });
        switch (type) {
            case referral_leaderboard_dto_1.ReferralLeaderboardType.TOTAL_REFERRALS:
                queryBuilder
                    .andWhere('(rc.totalReferrals > :value OR (rc.totalReferrals = :value AND rc.createdAt < :createdAt))', {
                    value: referralCode.totalReferrals,
                    createdAt: referralCode.createdAt,
                })
                    .orderBy('rc.totalReferrals', 'DESC');
                break;
            case referral_leaderboard_dto_1.ReferralLeaderboardType.ACTIVE_REFERRALS:
                queryBuilder
                    .andWhere('(rc.activeReferrals > :value OR (rc.activeReferrals = :value AND rc.createdAt < :createdAt))', {
                    value: referralCode.activeReferrals,
                    createdAt: referralCode.createdAt,
                })
                    .orderBy('rc.activeReferrals', 'DESC');
                break;
            case referral_leaderboard_dto_1.ReferralLeaderboardType.REWARDS_EARNED:
                queryBuilder
                    .andWhere('(rc.totalRewardsEarned > :value OR (rc.totalRewardsEarned = :value AND rc.createdAt < :createdAt))', {
                    value: referralCode.totalRewardsEarned,
                    createdAt: referralCode.createdAt,
                })
                    .orderBy('rc.totalRewardsEarned', 'DESC');
                break;
        }
        const count = await queryBuilder.getCount();
        return count + 1;
    }
};
exports.ReferralLeaderboardService = ReferralLeaderboardService;
exports.ReferralLeaderboardService = ReferralLeaderboardService = ReferralLeaderboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(referral_code_entity_1.ReferralCode)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], ReferralLeaderboardService);


/***/ }),

/***/ "./src/referrals/referrals.controller.ts":
/*!***********************************************!*\
  !*** ./src/referrals/referrals.controller.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReferralsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const referrals_service_1 = __webpack_require__(/*! ./referrals.service */ "./src/referrals/referrals.service.ts");
const referral_leaderboard_service_1 = __webpack_require__(/*! ./referral-leaderboard.service */ "./src/referrals/referral-leaderboard.service.ts");
const referral_analytics_service_1 = __webpack_require__(/*! ./referral-analytics.service */ "./src/referrals/referral-analytics.service.ts");
const create_referral_code_dto_1 = __webpack_require__(/*! ./dto/create-referral-code.dto */ "./src/referrals/dto/create-referral-code.dto.ts");
const use_referral_code_dto_1 = __webpack_require__(/*! ./dto/use-referral-code.dto */ "./src/referrals/dto/use-referral-code.dto.ts");
const referral_analytics_dto_1 = __webpack_require__(/*! ./dto/referral-analytics.dto */ "./src/referrals/dto/referral-analytics.dto.ts");
const referral_leaderboard_dto_1 = __webpack_require__(/*! ./dto/referral-leaderboard.dto */ "./src/referrals/dto/referral-leaderboard.dto.ts");
const jwt_auth_guard_1 = __webpack_require__(/*! ../auth/guards/jwt-auth.guard */ "./src/auth/guards/jwt-auth.guard.ts");
let ReferralsController = class ReferralsController {
    constructor(referralsService, leaderboardService, analyticsService) {
        this.referralsService = referralsService;
        this.leaderboardService = leaderboardService;
        this.analyticsService = analyticsService;
    }
    async createReferralCode(req, createDto) {
        const userId = req.user?.id || req.user?.sub || req.user?.userId;
        return this.referralsService.generateReferralCode(userId, createDto);
    }
    async getReferralCode(req) {
        const userId = req.user?.id || req.user?.sub || req.user?.userId;
        return this.referralsService.getReferralCode(userId);
    }
    async getInviteLink(req) {
        const userId = req.user?.id || req.user?.sub || req.user?.userId;
        const link = await this.referralsService.generateInviteLink(userId);
        return { inviteLink: link };
    }
    async useReferralCode(useDto, req) {
        const refereeId = req.user?.id || req.user?.sub;
        const metadata = {
            registrationIp: req.ip,
            userAgent: req.headers['user-agent'],
        };
        return this.referralsService.useReferralCode(refereeId, useDto, metadata);
    }
    async getReferralStats(req) {
        const userId = req.user?.id || req.user?.sub || req.user?.userId;
        return this.referralsService.getReferralStats(userId);
    }
    async getMyReferrals(req, status) {
        const userId = req.user?.id || req.user?.sub || req.user?.userId;
        return this.referralsService.getReferralsByReferrer(userId, status);
    }
    async getReferral(id) {
        return this.referralsService.getReferralById(id);
    }
    async completeReferral(id) {
        return this.referralsService.completeReferral(id);
    }
    async getLeaderboard(query) {
        return this.leaderboardService.getLeaderboard(query.type, query.limit, query.offset);
    }
    async getUserRank(req, type) {
        const userId = req.user?.id || req.user?.sub || req.user?.userId;
        return this.leaderboardService.getUserRank(userId, type);
    }
    async getDashboard(req) {
        const userId = req.user?.id || req.user?.sub || req.user?.userId;
        return this.analyticsService.getDashboardSummary(userId);
    }
    async getAnalytics(query) {
        return this.analyticsService.getAnalytics(query);
    }
};
exports.ReferralsController = ReferralsController;
__decorate([
    (0, common_1.Post)('code'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_d = typeof create_referral_code_dto_1.CreateReferralCodeDto !== "undefined" && create_referral_code_dto_1.CreateReferralCodeDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "createReferralCode", null);
__decorate([
    (0, common_1.Get)('code'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getReferralCode", null);
__decorate([
    (0, common_1.Get)('invite-link'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getInviteLink", null);
__decorate([
    (0, common_1.Post)('use'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof use_referral_code_dto_1.UseReferralCodeDto !== "undefined" && use_referral_code_dto_1.UseReferralCodeDto) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "useReferralCode", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getReferralStats", null);
__decorate([
    (0, common_1.Get)('my-referrals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getMyReferrals", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getReferral", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "completeReferral", null);
__decorate([
    (0, common_1.Get)('leaderboard/all'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof referral_leaderboard_dto_1.ReferralLeaderboardDto !== "undefined" && referral_leaderboard_dto_1.ReferralLeaderboardDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('leaderboard/rank'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getUserRank", null);
__decorate([
    (0, common_1.Get)('analytics/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('analytics/overview'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof referral_analytics_dto_1.ReferralAnalyticsDto !== "undefined" && referral_analytics_dto_1.ReferralAnalyticsDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getAnalytics", null);
exports.ReferralsController = ReferralsController = __decorate([
    (0, common_1.Controller)('referrals'),
    __metadata("design:paramtypes", [typeof (_a = typeof referrals_service_1.ReferralsService !== "undefined" && referrals_service_1.ReferralsService) === "function" ? _a : Object, typeof (_b = typeof referral_leaderboard_service_1.ReferralLeaderboardService !== "undefined" && referral_leaderboard_service_1.ReferralLeaderboardService) === "function" ? _b : Object, typeof (_c = typeof referral_analytics_service_1.ReferralAnalyticsService !== "undefined" && referral_analytics_service_1.ReferralAnalyticsService) === "function" ? _c : Object])
], ReferralsController);


/***/ }),

/***/ "./src/referrals/referrals.module.ts":
/*!*******************************************!*\
  !*** ./src/referrals/referrals.module.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReferralsModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const referrals_controller_1 = __webpack_require__(/*! ./referrals.controller */ "./src/referrals/referrals.controller.ts");
const referrals_service_1 = __webpack_require__(/*! ./referrals.service */ "./src/referrals/referrals.service.ts");
const referral_leaderboard_service_1 = __webpack_require__(/*! ./referral-leaderboard.service */ "./src/referrals/referral-leaderboard.service.ts");
const referral_analytics_service_1 = __webpack_require__(/*! ./referral-analytics.service */ "./src/referrals/referral-analytics.service.ts");
const referral_code_entity_1 = __webpack_require__(/*! ./entities/referral-code.entity */ "./src/referrals/entities/referral-code.entity.ts");
const referral_entity_1 = __webpack_require__(/*! ./entities/referral.entity */ "./src/referrals/entities/referral.entity.ts");
const user_entity_1 = __webpack_require__(/*! ../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
let ReferralsModule = class ReferralsModule {
};
exports.ReferralsModule = ReferralsModule;
exports.ReferralsModule = ReferralsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([referral_code_entity_1.ReferralCode, referral_entity_1.Referral, user_entity_1.User]),
            config_1.ConfigModule,
        ],
        controllers: [referrals_controller_1.ReferralsController],
        providers: [
            referrals_service_1.ReferralsService,
            referral_leaderboard_service_1.ReferralLeaderboardService,
            referral_analytics_service_1.ReferralAnalyticsService,
        ],
        exports: [referrals_service_1.ReferralsService, referral_leaderboard_service_1.ReferralLeaderboardService, referral_analytics_service_1.ReferralAnalyticsService],
    })
], ReferralsModule);


/***/ }),

/***/ "./src/referrals/referrals.service.ts":
/*!********************************************!*\
  !*** ./src/referrals/referrals.service.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReferralsService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReferralsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const referral_code_entity_1 = __webpack_require__(/*! ./entities/referral-code.entity */ "./src/referrals/entities/referral-code.entity.ts");
const referral_entity_1 = __webpack_require__(/*! ./entities/referral.entity */ "./src/referrals/entities/referral.entity.ts");
const user_entity_1 = __webpack_require__(/*! ../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
let ReferralsService = ReferralsService_1 = class ReferralsService {
    constructor(referralCodeRepository, referralRepository, userRepository, configService) {
        this.referralCodeRepository = referralCodeRepository;
        this.referralRepository = referralRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(ReferralsService_1.name);
        this.REFERRER_REWARD = 100;
        this.REFEREE_REWARD = 50;
        this.baseUrl =
            this.configService.get('APP_BASE_URL') ||
                this.configService.get('app.cors.origin') ||
                'http://localhost:3000';
    }
    async generateReferralCode(userId, createDto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const existingCode = await this.referralCodeRepository.findOne({
            where: { userId },
        });
        if (existingCode) {
            return existingCode;
        }
        const code = await this.generateUniqueCode();
        const referralCode = this.referralCodeRepository.create({
            code,
            userId,
            isActive: createDto?.isActive ?? true,
            expiresAt: createDto?.expiresAt
                ? new Date(createDto.expiresAt)
                : undefined,
        });
        const saved = await this.referralCodeRepository.save(referralCode);
        if (!user.metadata) {
            user.metadata = {};
        }
        user.metadata.referralCode = code;
        await this.userRepository.save(user);
        this.logger.log(`Generated referral code ${code} for user ${userId}`);
        return saved;
    }
    async generateUniqueCode() {
        const maxAttempts = 10;
        let attempts = 0;
        while (attempts < maxAttempts) {
            const code = this.generateRandomCode();
            const exists = await this.referralCodeRepository.findOne({
                where: { code },
            });
            if (!exists) {
                return code;
            }
            attempts++;
        }
        throw new Error('Failed to generate unique referral code');
    }
    generateRandomCode(length = 8) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    async getReferralCode(userId) {
        const code = await this.referralCodeRepository.findOne({
            where: { userId },
            relations: ['user'],
        });
        if (!code) {
            return this.generateReferralCode(userId);
        }
        return code;
    }
    async generateInviteLink(userId) {
        const referralCode = await this.getReferralCode(userId);
        if (!referralCode.isActive) {
            throw new common_1.BadRequestException('Referral code is not active');
        }
        if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Referral code has expired');
        }
        const inviteLink = `${this.baseUrl}/signup?ref=${referralCode.code}`;
        return inviteLink;
    }
    async useReferralCode(refereeId, useDto, metadata) {
        const referee = await this.userRepository.findOne({
            where: { id: refereeId },
        });
        if (!referee) {
            throw new common_1.NotFoundException(`User with ID ${refereeId} not found`);
        }
        const referralCode = await this.referralCodeRepository.findOne({
            where: { code: useDto.code },
            relations: ['user'],
        });
        if (!referralCode) {
            throw new common_1.NotFoundException(`Referral code ${useDto.code} not found`);
        }
        if (!referralCode.isActive) {
            throw new common_1.BadRequestException('Referral code is not active');
        }
        if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Referral code has expired');
        }
        if (referralCode.userId === refereeId) {
            throw new common_1.BadRequestException('Cannot use your own referral code');
        }
        const existingReferral = await this.referralRepository.findOne({
            where: {
                referrerId: referralCode.userId,
                refereeId,
            },
        });
        if (existingReferral) {
            throw new common_1.BadRequestException('Referral already exists');
        }
        const referral = this.referralRepository.create({
            referrerId: referralCode.userId,
            refereeId,
            referralCodeId: referralCode.id,
            status: referral_entity_1.ReferralStatus.PENDING,
            referrerReward: this.REFERRER_REWARD,
            refereeReward: this.REFEREE_REWARD,
            metadata: {
                registrationIp: metadata?.registrationIp,
                userAgent: metadata?.userAgent,
                source: useDto.source,
                campaign: useDto.campaign,
            },
        });
        const saved = await this.referralRepository.save(referral);
        referralCode.totalReferrals += 1;
        referralCode.activeReferrals += 1;
        await this.referralCodeRepository.save(referralCode);
        if (!referee.metadata) {
            referee.metadata = {};
        }
        referee.metadata.referredBy = referralCode.userId;
        await this.userRepository.save(referee);
        this.logger.log(`Referral created: ${referralCode.userId} -> ${refereeId} (code: ${useDto.code})`);
        return saved;
    }
    async completeReferral(referralId) {
        const referral = await this.referralRepository.findOne({
            where: { id: referralId },
            relations: ['referrer', 'referee', 'referralCode'],
        });
        if (!referral) {
            throw new common_1.NotFoundException(`Referral with ID ${referralId} not found`);
        }
        if (referral.status === referral_entity_1.ReferralStatus.COMPLETED) {
            return referral;
        }
        referral.status = referral_entity_1.ReferralStatus.COMPLETED;
        referral.completedAt = new Date();
        await this.referralRepository.save(referral);
        await this.distributeRewards(referral);
        this.logger.log(`Referral ${referralId} completed and rewards distributed`);
        return referral;
    }
    async distributeRewards(referral) {
        try {
            if (!referral.referrerRewarded && referral.referrerReward > 0) {
                await this.grantReward(referral.referrerId, referral.referrerReward, 'referral_referrer', referral.id);
                referral.referrerRewarded = true;
                referral.referrerRewardedAt = new Date();
                const referralCode = await this.referralCodeRepository.findOne({
                    where: { id: referral.referralCodeId },
                });
                if (referralCode) {
                    referralCode.totalRewardsEarned += referral.referrerReward;
                    await this.referralCodeRepository.save(referralCode);
                }
            }
            if (!referral.refereeRewarded && referral.refereeReward > 0) {
                await this.grantReward(referral.refereeId, referral.refereeReward, 'referral_referee', referral.id);
                referral.refereeRewarded = true;
                referral.refereeRewardedAt = new Date();
            }
            await this.referralRepository.save(referral);
        }
        catch (error) {
            this.logger.error(`Failed to distribute rewards for referral ${referral.id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async grantReward(userId, amount, type, referralId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user) {
            user.experience += amount;
            user.totalScore += amount;
            await this.userRepository.save(user);
        }
        this.logger.log(`Granted ${amount} points to user ${userId} (type: ${type}, referral: ${referralId})`);
    }
    async getReferralsByReferrer(userId, status) {
        const where = { referrerId: userId };
        if (status) {
            where.status = status;
        }
        return this.referralRepository.find({
            where,
            relations: ['referee', 'referralCode'],
            order: { createdAt: 'DESC' },
        });
    }
    async getReferralStats(userId) {
        const referralCode = await this.referralCodeRepository.findOne({
            where: { userId },
        });
        if (!referralCode) {
            return {
                totalReferrals: 0,
                activeReferrals: 0,
                completedReferrals: 0,
                totalRewardsEarned: 0,
                hasCode: false,
            };
        }
        const [total, completed] = await Promise.all([
            this.referralRepository.count({
                where: { referrerId: userId },
            }),
            this.referralRepository.count({
                where: {
                    referrerId: userId,
                    status: referral_entity_1.ReferralStatus.COMPLETED,
                },
            }),
        ]);
        return {
            totalReferrals: total,
            activeReferrals: referralCode.activeReferrals,
            completedReferrals: completed,
            totalRewardsEarned: referralCode.totalRewardsEarned,
            hasCode: true,
            code: referralCode.code,
            inviteLink: await this.generateInviteLink(userId),
        };
    }
    async getReferralById(referralId) {
        const referral = await this.referralRepository.findOne({
            where: { id: referralId },
            relations: ['referrer', 'referee', 'referralCode'],
        });
        if (!referral) {
            throw new common_1.NotFoundException(`Referral with ID ${referralId} not found`);
        }
        return referral;
    }
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = ReferralsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(referral_code_entity_1.ReferralCode)),
    __param(1, (0, typeorm_1.InjectRepository)(referral_entity_1.Referral)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _d : Object])
], ReferralsService);


/***/ }),

/***/ "./src/rewards/rewards.controller.ts":
/*!*******************************************!*\
  !*** ./src/rewards/rewards.controller.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RewardsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const rewards_service_1 = __webpack_require__(/*! ./rewards.service */ "./src/rewards/rewards.service.ts");
let RewardsController = class RewardsController {
    constructor(rewardsService) {
        this.rewardsService = rewardsService;
    }
    async distribute(body) {
        return this.rewardsService.distributeReward(body.userAddress, body.amount);
    }
    async getUserRewards(address) {
        return this.rewardsService.getUserRewards(address);
    }
};
exports.RewardsController = RewardsController;
__decorate([
    (0, common_1.Post)('distribute'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "distribute", null);
__decorate([
    (0, common_1.Get)('user/:address'),
    __param(0, (0, common_1.Param)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "getUserRewards", null);
exports.RewardsController = RewardsController = __decorate([
    (0, common_1.Controller)('rewards'),
    __metadata("design:paramtypes", [typeof (_a = typeof rewards_service_1.RewardsService !== "undefined" && rewards_service_1.RewardsService) === "function" ? _a : Object])
], RewardsController);


/***/ }),

/***/ "./src/rewards/rewards.module.ts":
/*!***************************************!*\
  !*** ./src/rewards/rewards.module.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RewardsModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const rewards_service_1 = __webpack_require__(/*! ./rewards.service */ "./src/rewards/rewards.service.ts");
const rewards_controller_1 = __webpack_require__(/*! ./rewards.controller */ "./src/rewards/rewards.controller.ts");
const soroban_module_1 = __webpack_require__(/*! ../soroban/soroban.module */ "./src/soroban/soroban.module.ts");
let RewardsModule = class RewardsModule {
};
exports.RewardsModule = RewardsModule;
exports.RewardsModule = RewardsModule = __decorate([
    (0, common_1.Module)({
        imports: [soroban_module_1.SorobanModule],
        controllers: [rewards_controller_1.RewardsController],
        providers: [rewards_service_1.RewardsService],
        exports: [rewards_service_1.RewardsService],
    })
], RewardsModule);


/***/ }),

/***/ "./src/rewards/rewards.service.ts":
/*!****************************************!*\
  !*** ./src/rewards/rewards.service.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RewardsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const soroban_service_1 = __webpack_require__(/*! ../soroban/soroban.service */ "./src/soroban/soroban.service.ts");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const stellar_sdk_1 = __webpack_require__(/*! @stellar/stellar-sdk */ "@stellar/stellar-sdk");
let RewardsService = class RewardsService {
    constructor(sorobanService, configService) {
        this.sorobanService = sorobanService;
        this.configService = configService;
        this.rewardContractId = this.configService.get('REWARD_CONTRACT_ID');
    }
    async distributeReward(userAddress, amount) {
        const params = [
            new stellar_sdk_1.Address(userAddress).toScVal(),
            (0, stellar_sdk_1.nativeToScVal)(BigInt(amount) * 10000000n, { type: 'i128' }),
        ];
        const result = await this.sorobanService.invokeContract(this.rewardContractId, 'distribute_reward', params);
        return {
            success: result.status === 'SUCCESS',
            transactionHash: result.hash,
            recipient: userAddress,
            amount,
        };
    }
    async getUserRewards(userAddress) {
        const params = [new stellar_sdk_1.Address(userAddress).toScVal()];
        const result = (await this.sorobanService.invokeContract(this.rewardContractId, 'get_user_rewards', params));
        return result.result;
    }
};
exports.RewardsService = RewardsService;
exports.RewardsService = RewardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof soroban_service_1.SorobanService !== "undefined" && soroban_service_1.SorobanService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], RewardsService);


/***/ }),

/***/ "./src/save-game/controllers/save-game.controller.ts":
/*!***********************************************************!*\
  !*** ./src/save-game/controllers/save-game.controller.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveGameController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const jwt_auth_guard_1 = __webpack_require__(/*! ../../auth/guards/jwt-auth.guard */ "./src/auth/guards/jwt-auth.guard.ts");
const save_game_service_1 = __webpack_require__(/*! ../services/save-game.service */ "./src/save-game/services/save-game.service.ts");
const cloud_sync_service_1 = __webpack_require__(/*! ../services/cloud-sync.service */ "./src/save-game/services/cloud-sync.service.ts");
const auto_save_service_1 = __webpack_require__(/*! ../services/auto-save.service */ "./src/save-game/services/auto-save.service.ts");
const save_backup_service_1 = __webpack_require__(/*! ../services/save-backup.service */ "./src/save-game/services/save-backup.service.ts");
const save_analytics_service_1 = __webpack_require__(/*! ../services/save-analytics.service */ "./src/save-game/services/save-analytics.service.ts");
const create_save_game_dto_1 = __webpack_require__(/*! ../dto/create-save-game.dto */ "./src/save-game/dto/create-save-game.dto.ts");
const update_save_game_dto_1 = __webpack_require__(/*! ../dto/update-save-game.dto */ "./src/save-game/dto/update-save-game.dto.ts");
const sync_save_game_dto_1 = __webpack_require__(/*! ../dto/sync-save-game.dto */ "./src/save-game/dto/sync-save-game.dto.ts");
const create_save_game_dto_2 = __webpack_require__(/*! ../dto/create-save-game.dto */ "./src/save-game/dto/create-save-game.dto.ts");
let SaveGameController = class SaveGameController {
    constructor(saveGameService, cloudSyncService, autoSaveService, backupService, analyticsService) {
        this.saveGameService = saveGameService;
        this.cloudSyncService = cloudSyncService;
        this.autoSaveService = autoSaveService;
        this.backupService = backupService;
        this.analyticsService = analyticsService;
    }
    async create(req, dto) {
        return this.saveGameService.create(req.user.id, dto);
    }
    async findAll(req) {
        return this.saveGameService.findAll(req.user.id);
    }
    async getEmptySlots(req, count) {
        return this.saveGameService.getEmptySlots(req.user.id, count || 10);
    }
    async findOne(req, slotId) {
        return this.saveGameService.findOne(req.user.id, slotId);
    }
    async load(req, slotId) {
        return this.saveGameService.load(req.user.id, slotId);
    }
    async update(req, slotId, dto) {
        return this.saveGameService.update(req.user.id, slotId, dto);
    }
    async delete(req, slotId) {
        await this.saveGameService.delete(req.user.id, slotId);
    }
    async sync(req, dto) {
        return this.cloudSyncService.syncSave(req.user.id, dto);
    }
    async batchSync(req, dto) {
        return this.cloudSyncService.batchSync(req.user.id, dto);
    }
    async resolveConflict(req, dto) {
        return this.cloudSyncService.resolveConflict(req.user.id, dto);
    }
    async uploadToCloud(req, slotId, data, deviceId, platform) {
        return this.cloudSyncService.uploadToCloud(req.user.id, slotId, data, deviceId, platform);
    }
    async downloadFromCloud(req, slotId) {
        return this.cloudSyncService.downloadFromCloud(req.user.id, slotId);
    }
    async getCloudSaves(req) {
        return this.cloudSyncService.getCloudSaves(req.user.id);
    }
    async enableAutoSave(req, slotId, intervalMs) {
        await this.autoSaveService.enableAutoSave(req.user.id, slotId, intervalMs);
        return { enabled: true, slotId, intervalMs };
    }
    async disableAutoSave(req, slotId) {
        await this.autoSaveService.disableAutoSave(req.user.id, slotId);
        return { enabled: false };
    }
    async triggerAutoSave(req, data) {
        return this.autoSaveService.triggerAutoSave(req.user.id, data);
    }
    async getAutoSaveConfig(req, slotId) {
        return this.autoSaveService.getAutoSaveConfig(req.user.id, slotId);
    }
    async quickSave(req, data) {
        return this.autoSaveService.quickSave(req.user.id, data);
    }
    async quickLoad(req) {
        return this.autoSaveService.quickLoad(req.user.id);
    }
    async getBackups(req, slotId) {
        return this.backupService.getBackups(req.user.id, slotId);
    }
    async restoreFromBackup(req, backupId) {
        return this.backupService.restoreFromBackup(backupId, req.user.id);
    }
    async deleteBackup(req, backupId) {
        await this.backupService.deleteBackup(backupId, req.user.id);
    }
    async getAnalytics(req) {
        return this.analyticsService.getAnalytics(req.user.id);
    }
};
exports.SaveGameController = SaveGameController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_f = typeof create_save_game_dto_1.CreateSaveGameDto !== "undefined" && create_save_game_dto_1.CreateSaveGameDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('slots/empty'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('count', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "getEmptySlots", null);
__decorate([
    (0, common_1.Get)(':slotId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slotId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':slotId/load'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slotId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "load", null);
__decorate([
    (0, common_1.Put)(':slotId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slotId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, typeof (_g = typeof update_save_game_dto_1.UpdateSaveGameDto !== "undefined" && update_save_game_dto_1.UpdateSaveGameDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':slotId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slotId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_h = typeof sync_save_game_dto_1.SyncSaveGameDto !== "undefined" && sync_save_game_dto_1.SyncSaveGameDto) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "sync", null);
__decorate([
    (0, common_1.Post)('sync/batch'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_j = typeof sync_save_game_dto_1.BatchSyncDto !== "undefined" && sync_save_game_dto_1.BatchSyncDto) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "batchSync", null);
__decorate([
    (0, common_1.Post)('sync/resolve-conflict'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_k = typeof sync_save_game_dto_1.ResolveConflictDto !== "undefined" && sync_save_game_dto_1.ResolveConflictDto) === "function" ? _k : Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "resolveConflict", null);
__decorate([
    (0, common_1.Post)('sync/upload/:slotId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slotId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Query)('deviceId')),
    __param(4, (0, common_1.Query)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, typeof (_l = typeof create_save_game_dto_2.SaveGameDataDto !== "undefined" && create_save_game_dto_2.SaveGameDataDto) === "function" ? _l : Object, String, String]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "uploadToCloud", null);
__decorate([
    (0, common_1.Get)('sync/download/:slotId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slotId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "downloadFromCloud", null);
__decorate([
    (0, common_1.Get)('cloud'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "getCloudSaves", null);
__decorate([
    (0, common_1.Post)('auto-save/enable'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('slotId', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('intervalMs', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "enableAutoSave", null);
__decorate([
    (0, common_1.Post)('auto-save/disable'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('slotId', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "disableAutoSave", null);
__decorate([
    (0, common_1.Post)('auto-save/trigger'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_m = typeof create_save_game_dto_2.SaveGameDataDto !== "undefined" && create_save_game_dto_2.SaveGameDataDto) === "function" ? _m : Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "triggerAutoSave", null);
__decorate([
    (0, common_1.Get)('auto-save/config'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('slotId', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "getAutoSaveConfig", null);
__decorate([
    (0, common_1.Post)('quick-save'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_o = typeof create_save_game_dto_2.SaveGameDataDto !== "undefined" && create_save_game_dto_2.SaveGameDataDto) === "function" ? _o : Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "quickSave", null);
__decorate([
    (0, common_1.Get)('quick-load'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "quickLoad", null);
__decorate([
    (0, common_1.Get)('backups'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('slotId', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "getBackups", null);
__decorate([
    (0, common_1.Post)('backups/:backupId/restore'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('backupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "restoreFromBackup", null);
__decorate([
    (0, common_1.Delete)('backups/:backupId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('backupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "deleteBackup", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SaveGameController.prototype, "getAnalytics", null);
exports.SaveGameController = SaveGameController = __decorate([
    (0, common_1.Controller)('save-games'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof save_game_service_1.SaveGameService !== "undefined" && save_game_service_1.SaveGameService) === "function" ? _a : Object, typeof (_b = typeof cloud_sync_service_1.CloudSyncService !== "undefined" && cloud_sync_service_1.CloudSyncService) === "function" ? _b : Object, typeof (_c = typeof auto_save_service_1.AutoSaveService !== "undefined" && auto_save_service_1.AutoSaveService) === "function" ? _c : Object, typeof (_d = typeof save_backup_service_1.SaveBackupService !== "undefined" && save_backup_service_1.SaveBackupService) === "function" ? _d : Object, typeof (_e = typeof save_analytics_service_1.SaveAnalyticsService !== "undefined" && save_analytics_service_1.SaveAnalyticsService) === "function" ? _e : Object])
], SaveGameController);


/***/ }),

/***/ "./src/save-game/dto/create-save-game.dto.ts":
/*!***************************************************!*\
  !*** ./src/save-game/dto/create-save-game.dto.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateSaveGameDto = exports.SaveGameDataDto = exports.ProgressStateDto = exports.PlayerStateDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const save_game_interfaces_1 = __webpack_require__(/*! ../interfaces/save-game.interfaces */ "./src/save-game/interfaces/save-game.interfaces.ts");
class PlayerStateDto {
}
exports.PlayerStateDto = PlayerStateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PlayerStateDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PlayerStateDto.prototype, "health", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], PlayerStateDto.prototype, "inventory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], PlayerStateDto.prototype, "stats", void 0);
class ProgressStateDto {
}
exports.ProgressStateDto = ProgressStateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProgressStateDto.prototype, "completedLevels", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProgressStateDto.prototype, "unlockedAchievements", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProgressStateDto.prototype, "collectibles", void 0);
class SaveGameDataDto {
}
exports.SaveGameDataDto = SaveGameDataDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SaveGameDataDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", typeof (_b = typeof Record !== "undefined" && Record) === "function" ? _b : Object)
], SaveGameDataDto.prototype, "gameState", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PlayerStateDto),
    __metadata("design:type", PlayerStateDto)
], SaveGameDataDto.prototype, "playerState", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProgressStateDto),
    __metadata("design:type", ProgressStateDto)
], SaveGameDataDto.prototype, "progressState", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", typeof (_c = typeof Record !== "undefined" && Record) === "function" ? _c : Object)
], SaveGameDataDto.prototype, "settings", void 0);
class CreateSaveGameDto {
}
exports.CreateSaveGameDto = CreateSaveGameDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(99),
    __metadata("design:type", Number)
], CreateSaveGameDto.prototype, "slotId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSaveGameDto.prototype, "slotName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(save_game_interfaces_1.SaveType),
    __metadata("design:type", typeof (_d = typeof save_game_interfaces_1.SaveType !== "undefined" && save_game_interfaces_1.SaveType) === "function" ? _d : Object)
], CreateSaveGameDto.prototype, "saveType", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SaveGameDataDto),
    __metadata("design:type", SaveGameDataDto)
], CreateSaveGameDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSaveGameDto.prototype, "playtime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], CreateSaveGameDto.prototype, "deviceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateSaveGameDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", typeof (_e = typeof Record !== "undefined" && Record) === "function" ? _e : Object)
], CreateSaveGameDto.prototype, "customMetadata", void 0);


/***/ }),

/***/ "./src/save-game/dto/sync-save-game.dto.ts":
/*!*************************************************!*\
  !*** ./src/save-game/dto/sync-save-game.dto.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BatchSyncDto = exports.ResolveConflictDto = exports.SyncSaveGameDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const save_game_interfaces_1 = __webpack_require__(/*! ../interfaces/save-game.interfaces */ "./src/save-game/interfaces/save-game.interfaces.ts");
const create_save_game_dto_1 = __webpack_require__(/*! ./create-save-game.dto */ "./src/save-game/dto/create-save-game.dto.ts");
class SyncSaveGameDto {
}
exports.SyncSaveGameDto = SyncSaveGameDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SyncSaveGameDto.prototype, "slotId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncSaveGameDto.prototype, "localChecksum", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], SyncSaveGameDto.prototype, "lastModifiedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SyncSaveGameDto.prototype, "saveVersion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => create_save_game_dto_1.SaveGameDataDto),
    __metadata("design:type", typeof (_b = typeof create_save_game_dto_1.SaveGameDataDto !== "undefined" && create_save_game_dto_1.SaveGameDataDto) === "function" ? _b : Object)
], SyncSaveGameDto.prototype, "localData", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncSaveGameDto.prototype, "deviceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncSaveGameDto.prototype, "platform", void 0);
class ResolveConflictDto {
}
exports.ResolveConflictDto = ResolveConflictDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ResolveConflictDto.prototype, "saveId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(save_game_interfaces_1.ConflictResolution),
    __metadata("design:type", typeof (_c = typeof save_game_interfaces_1.ConflictResolution !== "undefined" && save_game_interfaces_1.ConflictResolution) === "function" ? _c : Object)
], ResolveConflictDto.prototype, "resolution", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => create_save_game_dto_1.SaveGameDataDto),
    __metadata("design:type", typeof (_d = typeof create_save_game_dto_1.SaveGameDataDto !== "undefined" && create_save_game_dto_1.SaveGameDataDto) === "function" ? _d : Object)
], ResolveConflictDto.prototype, "mergedData", void 0);
class BatchSyncDto {
}
exports.BatchSyncDto = BatchSyncDto;
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SyncSaveGameDto),
    __metadata("design:type", Array)
], BatchSyncDto.prototype, "saves", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BatchSyncDto.prototype, "forceCloud", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchSyncDto.prototype, "deviceId", void 0);


/***/ }),

/***/ "./src/save-game/dto/update-save-game.dto.ts":
/*!***************************************************!*\
  !*** ./src/save-game/dto/update-save-game.dto.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateSaveGameDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const create_save_game_dto_1 = __webpack_require__(/*! ./create-save-game.dto */ "./src/save-game/dto/create-save-game.dto.ts");
class UpdateSaveGameDto {
}
exports.UpdateSaveGameDto = UpdateSaveGameDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateSaveGameDto.prototype, "slotName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => create_save_game_dto_1.SaveGameDataDto),
    __metadata("design:type", typeof (_a = typeof create_save_game_dto_1.SaveGameDataDto !== "undefined" && create_save_game_dto_1.SaveGameDataDto) === "function" ? _a : Object)
], UpdateSaveGameDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateSaveGameDto.prototype, "playtime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], UpdateSaveGameDto.prototype, "deviceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateSaveGameDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", typeof (_b = typeof Record !== "undefined" && Record) === "function" ? _b : Object)
], UpdateSaveGameDto.prototype, "customMetadata", void 0);


/***/ }),

/***/ "./src/save-game/entities/save-game-analytics.entity.ts":
/*!**************************************************************!*\
  !*** ./src/save-game/entities/save-game-analytics.entity.ts ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveGameAnalytics = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
let SaveGameAnalytics = class SaveGameAnalytics {
};
exports.SaveGameAnalytics = SaveGameAnalytics;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SaveGameAnalytics.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SaveGameAnalytics.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], SaveGameAnalytics.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "totalSaves", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "totalLoads", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "autoSaves", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "manualSaves", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "quickSaves", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "cloudSyncs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "syncConflicts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "conflictsResolved", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "corruptionEvents", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "recoveryAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "successfulRecoveries", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "totalDataSaved", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SaveGameAnalytics.prototype, "averageSaveSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], SaveGameAnalytics.prototype, "lastSaveAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], SaveGameAnalytics.prototype, "lastLoadAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], SaveGameAnalytics.prototype, "lastSyncAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], SaveGameAnalytics.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], SaveGameAnalytics.prototype, "updatedAt", void 0);
exports.SaveGameAnalytics = SaveGameAnalytics = __decorate([
    (0, typeorm_1.Entity)('save_game_analytics'),
    (0, typeorm_1.Index)(['userId'], { unique: true })
], SaveGameAnalytics);


/***/ }),

/***/ "./src/save-game/entities/save-game-backup.entity.ts":
/*!***********************************************************!*\
  !*** ./src/save-game/entities/save-game-backup.entity.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveGameBackup = exports.BackupReason = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const save_game_entity_1 = __webpack_require__(/*! ./save-game.entity */ "./src/save-game/entities/save-game.entity.ts");
var BackupReason;
(function (BackupReason) {
    BackupReason["SCHEDULED"] = "SCHEDULED";
    BackupReason["PRE_UPDATE"] = "PRE_UPDATE";
    BackupReason["MANUAL"] = "MANUAL";
    BackupReason["CONFLICT"] = "CONFLICT";
    BackupReason["CORRUPTION_DETECTED"] = "CORRUPTION_DETECTED";
})(BackupReason || (exports.BackupReason = BackupReason = {}));
let SaveGameBackup = class SaveGameBackup {
};
exports.SaveGameBackup = SaveGameBackup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SaveGameBackup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SaveGameBackup.prototype, "saveGameId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => save_game_entity_1.SaveGame, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'saveGameId' }),
    __metadata("design:type", typeof (_a = typeof save_game_entity_1.SaveGame !== "undefined" && save_game_entity_1.SaveGame) === "function" ? _a : Object)
], SaveGameBackup.prototype, "saveGame", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SaveGameBackup.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SaveGameBackup.prototype, "slotId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SaveGameBackup.prototype, "saveVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BackupReason,
        default: BackupReason.SCHEDULED,
    }),
    __metadata("design:type", String)
], SaveGameBackup.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)('bytea'),
    __metadata("design:type", typeof (_b = typeof Buffer !== "undefined" && Buffer) === "function" ? _b : Object)
], SaveGameBackup.prototype, "compressedData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], SaveGameBackup.prototype, "checksum", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SaveGameBackup.prototype, "dataSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], SaveGameBackup.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], SaveGameBackup.prototype, "createdAt", void 0);
exports.SaveGameBackup = SaveGameBackup = __decorate([
    (0, typeorm_1.Entity)('save_game_backups'),
    (0, typeorm_1.Index)(['saveGameId', 'createdAt']),
    (0, typeorm_1.Index)(['userId', 'createdAt']),
    (0, typeorm_1.Index)(['expiresAt'])
], SaveGameBackup);


/***/ }),

/***/ "./src/save-game/entities/save-game.entity.ts":
/*!****************************************************!*\
  !*** ./src/save-game/entities/save-game.entity.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveGame = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const save_game_interfaces_1 = __webpack_require__(/*! ../interfaces/save-game.interfaces */ "./src/save-game/interfaces/save-game.interfaces.ts");
let SaveGame = class SaveGame {
};
exports.SaveGame = SaveGame;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SaveGame.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SaveGame.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], SaveGame.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SaveGame.prototype, "slotId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: 'Save Slot' }),
    __metadata("design:type", String)
], SaveGame.prototype, "slotName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: save_game_interfaces_1.SaveType,
        default: save_game_interfaces_1.SaveType.MANUAL,
    }),
    __metadata("design:type", typeof (_b = typeof save_game_interfaces_1.SaveType !== "undefined" && save_game_interfaces_1.SaveType) === "function" ? _b : Object)
], SaveGame.prototype, "saveType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], SaveGame.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], SaveGame.prototype, "saveVersion", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", typeof (_c = typeof save_game_interfaces_1.SaveGameMetadata !== "undefined" && save_game_interfaces_1.SaveGameMetadata) === "function" ? _c : Object)
], SaveGame.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)('bytea', { nullable: true }),
    __metadata("design:type", typeof (_d = typeof Buffer !== "undefined" && Buffer) === "function" ? _d : Object)
], SaveGame.prototype, "compressedData", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", typeof (_e = typeof save_game_interfaces_1.SaveGameData !== "undefined" && save_game_interfaces_1.SaveGameData) === "function" ? _e : Object)
], SaveGame.prototype, "rawData", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", typeof (_f = typeof save_game_interfaces_1.SaveGameChecksum !== "undefined" && save_game_interfaces_1.SaveGameChecksum) === "function" ? _f : Object)
], SaveGame.prototype, "checksum", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", typeof (_g = typeof save_game_interfaces_1.CompressionInfo !== "undefined" && save_game_interfaces_1.CompressionInfo) === "function" ? _g : Object)
], SaveGame.prototype, "compressionInfo", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", typeof (_h = typeof save_game_interfaces_1.EncryptionInfo !== "undefined" && save_game_interfaces_1.EncryptionInfo) === "function" ? _h : Object)
], SaveGame.prototype, "encryptionInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: save_game_interfaces_1.SyncStatus,
        default: save_game_interfaces_1.SyncStatus.LOCAL_ONLY,
    }),
    __metadata("design:type", typeof (_j = typeof save_game_interfaces_1.SyncStatus !== "undefined" && save_game_interfaces_1.SyncStatus) === "function" ? _j : Object)
], SaveGame.prototype, "syncStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", typeof (_k = typeof Date !== "undefined" && Date) === "function" ? _k : Object)
], SaveGame.prototype, "lastSyncedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_l = typeof Date !== "undefined" && Date) === "function" ? _l : Object)
], SaveGame.prototype, "lastModifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], SaveGame.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], SaveGame.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SaveGame.prototype, "isCorrupted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SaveGame.prototype, "corruptionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGame.prototype, "loadCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SaveGame.prototype, "saveCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_m = typeof Date !== "undefined" && Date) === "function" ? _m : Object)
], SaveGame.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_o = typeof Date !== "undefined" && Date) === "function" ? _o : Object)
], SaveGame.prototype, "updatedAt", void 0);
exports.SaveGame = SaveGame = __decorate([
    (0, typeorm_1.Entity)('save_games'),
    (0, typeorm_1.Index)(['userId', 'slotId'], { unique: true }),
    (0, typeorm_1.Index)(['userId', 'syncStatus']),
    (0, typeorm_1.Index)(['lastModifiedAt'])
], SaveGame);


/***/ }),

/***/ "./src/save-game/interfaces/save-game.interfaces.ts":
/*!**********************************************************!*\
  !*** ./src/save-game/interfaces/save-game.interfaces.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConflictResolution = exports.SaveType = exports.SyncStatus = void 0;
var SyncStatus;
(function (SyncStatus) {
    SyncStatus["LOCAL_ONLY"] = "LOCAL_ONLY";
    SyncStatus["CLOUD_ONLY"] = "CLOUD_ONLY";
    SyncStatus["SYNCED"] = "SYNCED";
    SyncStatus["LOCAL_NEWER"] = "LOCAL_NEWER";
    SyncStatus["CLOUD_NEWER"] = "CLOUD_NEWER";
    SyncStatus["CONFLICT"] = "CONFLICT";
})(SyncStatus || (exports.SyncStatus = SyncStatus = {}));
var SaveType;
(function (SaveType) {
    SaveType["AUTO"] = "AUTO";
    SaveType["MANUAL"] = "MANUAL";
    SaveType["QUICKSAVE"] = "QUICKSAVE";
})(SaveType || (exports.SaveType = SaveType = {}));
var ConflictResolution;
(function (ConflictResolution) {
    ConflictResolution["USE_LOCAL"] = "USE_LOCAL";
    ConflictResolution["USE_CLOUD"] = "USE_CLOUD";
    ConflictResolution["USE_NEWEST"] = "USE_NEWEST";
    ConflictResolution["MERGE"] = "MERGE";
    ConflictResolution["KEEP_BOTH"] = "KEEP_BOTH";
})(ConflictResolution || (exports.ConflictResolution = ConflictResolution = {}));


/***/ }),

/***/ "./src/save-game/save-game.module.ts":
/*!*******************************************!*\
  !*** ./src/save-game/save-game.module.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveGameModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const schedule_1 = __webpack_require__(/*! @nestjs/schedule */ "@nestjs/schedule");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const save_game_entity_1 = __webpack_require__(/*! ./entities/save-game.entity */ "./src/save-game/entities/save-game.entity.ts");
const save_game_backup_entity_1 = __webpack_require__(/*! ./entities/save-game-backup.entity */ "./src/save-game/entities/save-game-backup.entity.ts");
const save_game_analytics_entity_1 = __webpack_require__(/*! ./entities/save-game-analytics.entity */ "./src/save-game/entities/save-game-analytics.entity.ts");
const save_game_service_1 = __webpack_require__(/*! ./services/save-game.service */ "./src/save-game/services/save-game.service.ts");
const cloud_sync_service_1 = __webpack_require__(/*! ./services/cloud-sync.service */ "./src/save-game/services/cloud-sync.service.ts");
const save_compression_service_1 = __webpack_require__(/*! ./services/save-compression.service */ "./src/save-game/services/save-compression.service.ts");
const save_encryption_service_1 = __webpack_require__(/*! ./services/save-encryption.service */ "./src/save-game/services/save-encryption.service.ts");
const save_versioning_service_1 = __webpack_require__(/*! ./services/save-versioning.service */ "./src/save-game/services/save-versioning.service.ts");
const save_backup_service_1 = __webpack_require__(/*! ./services/save-backup.service */ "./src/save-game/services/save-backup.service.ts");
const save_analytics_service_1 = __webpack_require__(/*! ./services/save-analytics.service */ "./src/save-game/services/save-analytics.service.ts");
const auto_save_service_1 = __webpack_require__(/*! ./services/auto-save.service */ "./src/save-game/services/auto-save.service.ts");
const save_game_controller_1 = __webpack_require__(/*! ./controllers/save-game.controller */ "./src/save-game/controllers/save-game.controller.ts");
let SaveGameModule = class SaveGameModule {
};
exports.SaveGameModule = SaveGameModule;
exports.SaveGameModule = SaveGameModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([save_game_entity_1.SaveGame, save_game_backup_entity_1.SaveGameBackup, save_game_analytics_entity_1.SaveGameAnalytics]),
            schedule_1.ScheduleModule.forRoot(),
            config_1.ConfigModule,
        ],
        controllers: [save_game_controller_1.SaveGameController],
        providers: [
            save_compression_service_1.SaveCompressionService,
            save_encryption_service_1.SaveEncryptionService,
            save_versioning_service_1.SaveVersioningService,
            save_analytics_service_1.SaveAnalyticsService,
            save_backup_service_1.SaveBackupService,
            save_game_service_1.SaveGameService,
            cloud_sync_service_1.CloudSyncService,
            auto_save_service_1.AutoSaveService,
        ],
        exports: [
            save_game_service_1.SaveGameService,
            cloud_sync_service_1.CloudSyncService,
            auto_save_service_1.AutoSaveService,
            save_backup_service_1.SaveBackupService,
            save_analytics_service_1.SaveAnalyticsService,
        ],
    })
], SaveGameModule);


/***/ }),

/***/ "./src/save-game/services/auto-save.service.ts":
/*!*****************************************************!*\
  !*** ./src/save-game/services/auto-save.service.ts ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AutoSaveService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AutoSaveService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const schedule_1 = __webpack_require__(/*! @nestjs/schedule */ "@nestjs/schedule");
const save_game_entity_1 = __webpack_require__(/*! ../entities/save-game.entity */ "./src/save-game/entities/save-game.entity.ts");
const save_game_interfaces_1 = __webpack_require__(/*! ../interfaces/save-game.interfaces */ "./src/save-game/interfaces/save-game.interfaces.ts");
const save_game_service_1 = __webpack_require__(/*! ./save-game.service */ "./src/save-game/services/save-game.service.ts");
const cloud_sync_service_1 = __webpack_require__(/*! ./cloud-sync.service */ "./src/save-game/services/cloud-sync.service.ts");
let AutoSaveService = AutoSaveService_1 = class AutoSaveService {
    constructor(saveGameRepo, saveGameService, cloudSyncService) {
        this.saveGameRepo = saveGameRepo;
        this.saveGameService = saveGameService;
        this.cloudSyncService = cloudSyncService;
        this.logger = new common_1.Logger(AutoSaveService_1.name);
        this.autoSaveConfigs = new Map();
        this.pendingAutoSaves = [];
        this.DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
        this.AUTO_SAVE_SLOT = 99;
        this.QUICK_SAVE_SLOT = 98;
    }
    async enableAutoSave(userId, slotId = this.AUTO_SAVE_SLOT, intervalMs = this.DEFAULT_INTERVAL_MS) {
        const configKey = this.getConfigKey(userId, slotId);
        this.autoSaveConfigs.set(configKey, {
            userId,
            slotId,
            intervalMs,
            enabled: true,
        });
        this.logger.log(`Auto-save enabled for user ${userId}, slot ${slotId}, interval ${intervalMs}ms`);
    }
    async disableAutoSave(userId, slotId = this.AUTO_SAVE_SLOT) {
        const configKey = this.getConfigKey(userId, slotId);
        const config = this.autoSaveConfigs.get(configKey);
        if (config) {
            config.enabled = false;
            this.autoSaveConfigs.set(configKey, config);
        }
        this.logger.log(`Auto-save disabled for user ${userId}, slot ${slotId}`);
    }
    async queueAutoSave(userId, data, slotId) {
        const targetSlot = slotId ?? this.AUTO_SAVE_SLOT;
        const configKey = this.getConfigKey(userId, targetSlot);
        const config = this.autoSaveConfigs.get(configKey);
        if (config && !config.enabled) {
            return;
        }
        if (config?.lastAutoSave) {
            const elapsed = Date.now() - config.lastAutoSave.getTime();
            if (elapsed < (config.intervalMs || this.DEFAULT_INTERVAL_MS)) {
                return;
            }
        }
        this.pendingAutoSaves.push({
            userId,
            slotId: targetSlot,
            data,
            timestamp: new Date(),
        });
        this.logger.debug(`Queued auto-save for user ${userId}, slot ${targetSlot}`);
    }
    async triggerAutoSave(userId, data) {
        const slotId = this.AUTO_SAVE_SLOT;
        try {
            const existingSave = await this.saveGameRepo.findOne({
                where: { userId, slotId },
            });
            if (existingSave) {
                return await this.saveGameService.update(userId, slotId, {
                    data: {
                        version: data.version,
                        gameState: data.gameState,
                        playerState: data.playerState,
                        progressState: data.progressState,
                        settings: data.settings,
                    },
                });
            }
            else {
                return await this.saveGameService.create(userId, {
                    slotId,
                    slotName: 'Auto Save',
                    saveType: save_game_interfaces_1.SaveType.AUTO,
                    data: {
                        version: data.version,
                        gameState: data.gameState,
                        playerState: data.playerState,
                        progressState: data.progressState,
                        settings: data.settings,
                    },
                });
            }
        }
        catch (error) {
            this.logger.error(`Auto-save failed for user ${userId}: ${error.message}`);
            return null;
        }
    }
    async quickSave(userId, data) {
        const slotId = this.QUICK_SAVE_SLOT;
        const existingSave = await this.saveGameRepo.findOne({
            where: { userId, slotId },
        });
        if (existingSave) {
            return await this.saveGameService.update(userId, slotId, {
                slotName: 'Quick Save',
                data: {
                    version: data.version,
                    gameState: data.gameState,
                    playerState: data.playerState,
                    progressState: data.progressState,
                    settings: data.settings,
                },
            });
        }
        return await this.saveGameService.create(userId, {
            slotId,
            slotName: 'Quick Save',
            saveType: save_game_interfaces_1.SaveType.QUICKSAVE,
            data: {
                version: data.version,
                gameState: data.gameState,
                playerState: data.playerState,
                progressState: data.progressState,
                settings: data.settings,
            },
        });
    }
    async quickLoad(userId) {
        return await this.saveGameService.load(userId, this.QUICK_SAVE_SLOT);
    }
    async processPendingAutoSaves() {
        if (this.pendingAutoSaves.length === 0) {
            return;
        }
        this.logger.debug(`Processing ${this.pendingAutoSaves.length} pending auto-saves`);
        const latestSaves = new Map();
        for (const pending of this.pendingAutoSaves) {
            const key = this.getConfigKey(pending.userId, pending.slotId);
            const existing = latestSaves.get(key);
            if (!existing || pending.timestamp > existing.timestamp) {
                latestSaves.set(key, pending);
            }
        }
        this.pendingAutoSaves = [];
        for (const [key, pending] of latestSaves) {
            try {
                await this.triggerAutoSave(pending.userId, pending.data);
                const config = this.autoSaveConfigs.get(key);
                if (config) {
                    config.lastAutoSave = new Date();
                    this.autoSaveConfigs.set(key, config);
                }
            }
            catch (error) {
                this.logger.error(`Failed to process auto-save for ${key}: ${error.message}`);
            }
        }
    }
    getAutoSaveConfig(userId, slotId = this.AUTO_SAVE_SLOT) {
        const configKey = this.getConfigKey(userId, slotId);
        return this.autoSaveConfigs.get(configKey) || null;
    }
    getConfigKey(userId, slotId) {
        return `${userId}:${slotId}`;
    }
};
exports.AutoSaveService = AutoSaveService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], AutoSaveService.prototype, "processPendingAutoSaves", null);
exports.AutoSaveService = AutoSaveService = AutoSaveService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(save_game_entity_1.SaveGame)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof save_game_service_1.SaveGameService !== "undefined" && save_game_service_1.SaveGameService) === "function" ? _b : Object, typeof (_c = typeof cloud_sync_service_1.CloudSyncService !== "undefined" && cloud_sync_service_1.CloudSyncService) === "function" ? _c : Object])
], AutoSaveService);


/***/ }),

/***/ "./src/save-game/services/cloud-sync.service.ts":
/*!******************************************************!*\
  !*** ./src/save-game/services/cloud-sync.service.ts ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CloudSyncService_1;
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CloudSyncService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const save_game_entity_1 = __webpack_require__(/*! ../entities/save-game.entity */ "./src/save-game/entities/save-game.entity.ts");
const save_game_backup_entity_1 = __webpack_require__(/*! ../entities/save-game-backup.entity */ "./src/save-game/entities/save-game-backup.entity.ts");
const save_game_interfaces_1 = __webpack_require__(/*! ../interfaces/save-game.interfaces */ "./src/save-game/interfaces/save-game.interfaces.ts");
const save_compression_service_1 = __webpack_require__(/*! ./save-compression.service */ "./src/save-game/services/save-compression.service.ts");
const save_encryption_service_1 = __webpack_require__(/*! ./save-encryption.service */ "./src/save-game/services/save-encryption.service.ts");
const save_versioning_service_1 = __webpack_require__(/*! ./save-versioning.service */ "./src/save-game/services/save-versioning.service.ts");
const save_backup_service_1 = __webpack_require__(/*! ./save-backup.service */ "./src/save-game/services/save-backup.service.ts");
const save_analytics_service_1 = __webpack_require__(/*! ./save-analytics.service */ "./src/save-game/services/save-analytics.service.ts");
let CloudSyncService = CloudSyncService_1 = class CloudSyncService {
    constructor(saveGameRepo, compressionService, encryptionService, versioningService, backupService, analyticsService) {
        this.saveGameRepo = saveGameRepo;
        this.compressionService = compressionService;
        this.encryptionService = encryptionService;
        this.versioningService = versioningService;
        this.backupService = backupService;
        this.analyticsService = analyticsService;
        this.logger = new common_1.Logger(CloudSyncService_1.name);
        this.CONFLICT_THRESHOLD_MS = 60000;
    }
    async syncSave(userId, dto) {
        const cloudSave = await this.saveGameRepo.findOne({
            where: { userId, slotId: dto.slotId },
        });
        if (!cloudSave) {
            return {
                success: true,
                syncStatus: save_game_interfaces_1.SyncStatus.LOCAL_ONLY,
            };
        }
        const syncResult = this.determineSyncStatus(cloudSave, dto);
        await this.analyticsService.recordSync(userId, syncResult.syncStatus === save_game_interfaces_1.SyncStatus.CONFLICT);
        return syncResult;
    }
    determineSyncStatus(cloudSave, localInfo) {
        const cloudSummary = this.toSummary(cloudSave);
        if (!localInfo.localChecksum && !localInfo.lastModifiedAt) {
            return {
                success: true,
                syncStatus: save_game_interfaces_1.SyncStatus.CLOUD_ONLY,
                cloudSave: cloudSummary,
            };
        }
        if (localInfo.localChecksum === cloudSave.checksum?.value) {
            return {
                success: true,
                syncStatus: save_game_interfaces_1.SyncStatus.SYNCED,
                cloudSave: cloudSummary,
            };
        }
        const localModified = localInfo.lastModifiedAt
            ? new Date(localInfo.lastModifiedAt)
            : null;
        const cloudModified = cloudSave.lastModifiedAt;
        if (!localModified) {
            return {
                success: true,
                syncStatus: save_game_interfaces_1.SyncStatus.CLOUD_NEWER,
                cloudSave: cloudSummary,
            };
        }
        const timeDiff = Math.abs(localModified.getTime() - cloudModified.getTime());
        if (timeDiff < this.CONFLICT_THRESHOLD_MS) {
            return {
                success: false,
                syncStatus: save_game_interfaces_1.SyncStatus.CONFLICT,
                cloudSave: cloudSummary,
                conflictDetails: {
                    localLastModified: localModified,
                    cloudLastModified: cloudModified,
                    localChecksum: localInfo.localChecksum || '',
                    cloudChecksum: cloudSave.checksum?.value || '',
                    suggestedResolution: this.suggestResolution(localModified, cloudModified),
                },
            };
        }
        if (localModified > cloudModified) {
            return {
                success: true,
                syncStatus: save_game_interfaces_1.SyncStatus.LOCAL_NEWER,
                cloudSave: cloudSummary,
            };
        }
        return {
            success: true,
            syncStatus: save_game_interfaces_1.SyncStatus.CLOUD_NEWER,
            cloudSave: cloudSummary,
        };
    }
    suggestResolution(localModified, cloudModified) {
        if (localModified > cloudModified) {
            return save_game_interfaces_1.ConflictResolution.USE_LOCAL;
        }
        return save_game_interfaces_1.ConflictResolution.USE_CLOUD;
    }
    async resolveConflict(userId, dto) {
        const cloudSave = await this.saveGameRepo.findOne({
            where: { id: dto.saveId, userId },
        });
        if (!cloudSave) {
            throw new common_1.BadRequestException('Save not found');
        }
        await this.backupService.createBackup(cloudSave, save_game_backup_entity_1.BackupReason.CONFLICT);
        switch (dto.resolution) {
            case save_game_interfaces_1.ConflictResolution.USE_CLOUD:
                cloudSave.syncStatus = save_game_interfaces_1.SyncStatus.SYNCED;
                break;
            case save_game_interfaces_1.ConflictResolution.USE_LOCAL:
                cloudSave.syncStatus = save_game_interfaces_1.SyncStatus.LOCAL_NEWER;
                break;
            case save_game_interfaces_1.ConflictResolution.USE_NEWEST:
                cloudSave.syncStatus = save_game_interfaces_1.SyncStatus.SYNCED;
                break;
            case save_game_interfaces_1.ConflictResolution.MERGE:
                if (!dto.mergedData) {
                    throw new common_1.BadRequestException('Merged data required for MERGE resolution');
                }
                await this.updateSaveData(cloudSave, dto.mergedData);
                cloudSave.syncStatus = save_game_interfaces_1.SyncStatus.SYNCED;
                break;
            case save_game_interfaces_1.ConflictResolution.KEEP_BOTH:
                const newSlotId = await this.findNextEmptySlot(userId);
                const backupSave = this.saveGameRepo.create({
                    ...cloudSave,
                    id: undefined,
                    slotId: newSlotId,
                    slotName: `${cloudSave.slotName} (Cloud Backup)`,
                    syncStatus: save_game_interfaces_1.SyncStatus.SYNCED,
                });
                await this.saveGameRepo.save(backupSave);
                cloudSave.syncStatus = save_game_interfaces_1.SyncStatus.LOCAL_NEWER;
                break;
        }
        cloudSave.lastSyncedAt = new Date();
        const saved = await this.saveGameRepo.save(cloudSave);
        await this.analyticsService.recordConflictResolved(userId);
        this.logger.log(`Resolved conflict for save ${dto.saveId} with resolution: ${dto.resolution}`);
        return saved;
    }
    async uploadToCloud(userId, slotId, data, deviceId, platform) {
        let cloudSave = await this.saveGameRepo.findOne({
            where: { userId, slotId },
        });
        const validation = this.versioningService.validateDataStructure(data);
        if (!validation.valid) {
            throw new common_1.BadRequestException(`Invalid save data: ${validation.errors.join(', ')}`);
        }
        const saveData = this.versioningService.mergeWithDefaults(data);
        const { compressedData, compressionInfo } = await this.compressionService.compress(saveData);
        const { encryptedData, encryptionInfo } = await this.encryptionService.encrypt(compressedData);
        const checksum = {
            algorithm: 'sha256',
            value: this.encryptionService.generateChecksum(compressedData),
        };
        if (cloudSave) {
            cloudSave.compressedData = encryptedData;
            cloudSave.compressionInfo = compressionInfo;
            cloudSave.encryptionInfo = encryptionInfo;
            cloudSave.checksum = checksum;
            cloudSave.saveVersion++;
            cloudSave.lastModifiedAt = new Date();
            cloudSave.lastSyncedAt = new Date();
            cloudSave.syncStatus = save_game_interfaces_1.SyncStatus.SYNCED;
            cloudSave.deviceId = deviceId || cloudSave.deviceId;
            cloudSave.platform = platform || cloudSave.platform;
            if (process.env.NODE_ENV === 'development') {
                cloudSave.rawData = saveData;
            }
        }
        else {
            cloudSave = this.saveGameRepo.create({
                userId,
                slotId,
                slotName: `Save Slot ${slotId}`,
                version: this.versioningService.CURRENT_VERSION,
                saveVersion: 1,
                metadata: {
                    slotId,
                    slotName: `Save Slot ${slotId}`,
                    saveType: save_game_interfaces_1.SaveType.MANUAL,
                    playtime: 0,
                },
                compressedData: encryptedData,
                rawData: process.env.NODE_ENV === 'development' ? saveData : null,
                checksum,
                compressionInfo,
                encryptionInfo,
                syncStatus: save_game_interfaces_1.SyncStatus.SYNCED,
                lastModifiedAt: new Date(),
                lastSyncedAt: new Date(),
                deviceId,
                platform,
            });
        }
        return this.saveGameRepo.save(cloudSave);
    }
    async downloadFromCloud(userId, slotId) {
        const cloudSave = await this.saveGameRepo.findOne({
            where: { userId, slotId },
        });
        if (!cloudSave) {
            throw new common_1.BadRequestException(`No cloud save found for slot ${slotId}`);
        }
        if (cloudSave.isCorrupted) {
            throw new common_1.BadRequestException('Cloud save is corrupted');
        }
        const decryptedData = await this.encryptionService.decrypt(cloudSave.compressedData, cloudSave.encryptionInfo);
        if (!this.encryptionService.verifyChecksum(decryptedData, cloudSave.checksum.value)) {
            throw new common_1.BadRequestException('Cloud save data corrupted - checksum mismatch');
        }
        const saveData = await this.compressionService.decompress(decryptedData, cloudSave.compressionInfo);
        const migratedData = this.versioningService.migrateToCurrentVersion(saveData);
        cloudSave.syncStatus = save_game_interfaces_1.SyncStatus.SYNCED;
        cloudSave.lastSyncedAt = new Date();
        await this.saveGameRepo.save(cloudSave);
        return {
            data: migratedData,
            metadata: this.toSummary(cloudSave),
        };
    }
    async batchSync(userId, dto) {
        const results = [];
        for (const save of dto.saves) {
            const result = await this.syncSave(userId, {
                ...save,
                deviceId: dto.deviceId || save.deviceId,
            });
            results.push(result);
        }
        return results;
    }
    async getCloudSaves(userId) {
        const saves = await this.saveGameRepo.find({
            where: { userId },
            order: { slotId: 'ASC' },
        });
        return saves.map((save) => this.toSummary(save));
    }
    async updateSaveData(save, data) {
        const saveData = this.versioningService.mergeWithDefaults(data);
        const { compressedData, compressionInfo } = await this.compressionService.compress(saveData);
        const { encryptedData, encryptionInfo } = await this.encryptionService.encrypt(compressedData);
        save.compressedData = encryptedData;
        save.compressionInfo = compressionInfo;
        save.encryptionInfo = encryptionInfo;
        save.checksum = {
            algorithm: 'sha256',
            value: this.encryptionService.generateChecksum(compressedData),
        };
        save.saveVersion++;
        save.lastModifiedAt = new Date();
        if (process.env.NODE_ENV === 'development') {
            save.rawData = saveData;
        }
    }
    async findNextEmptySlot(userId) {
        const usedSlots = await this.saveGameRepo
            .createQueryBuilder('save')
            .select('save.slotId')
            .where('save.userId = :userId', { userId })
            .getMany();
        const usedSlotIds = new Set(usedSlots.map((s) => s.slotId));
        for (let i = 0; i < 100; i++) {
            if (!usedSlotIds.has(i)) {
                return i;
            }
        }
        throw new common_1.BadRequestException('No empty save slots available');
    }
    toSummary(save) {
        return {
            id: save.id,
            slotId: save.slotId,
            slotName: save.slotName,
            version: save.saveVersion,
            checksum: save.checksum?.value || '',
            lastModifiedAt: save.lastModifiedAt,
            playtime: save.metadata?.playtime || 0,
            isCompressed: save.compressionInfo?.algorithm !== 'none',
            isEncrypted: !!save.encryptionInfo,
        };
    }
};
exports.CloudSyncService = CloudSyncService;
exports.CloudSyncService = CloudSyncService = CloudSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(save_game_entity_1.SaveGame)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof save_compression_service_1.SaveCompressionService !== "undefined" && save_compression_service_1.SaveCompressionService) === "function" ? _b : Object, typeof (_c = typeof save_encryption_service_1.SaveEncryptionService !== "undefined" && save_encryption_service_1.SaveEncryptionService) === "function" ? _c : Object, typeof (_d = typeof save_versioning_service_1.SaveVersioningService !== "undefined" && save_versioning_service_1.SaveVersioningService) === "function" ? _d : Object, typeof (_e = typeof save_backup_service_1.SaveBackupService !== "undefined" && save_backup_service_1.SaveBackupService) === "function" ? _e : Object, typeof (_f = typeof save_analytics_service_1.SaveAnalyticsService !== "undefined" && save_analytics_service_1.SaveAnalyticsService) === "function" ? _f : Object])
], CloudSyncService);


/***/ }),

/***/ "./src/save-game/services/save-analytics.service.ts":
/*!**********************************************************!*\
  !*** ./src/save-game/services/save-analytics.service.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SaveAnalyticsService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveAnalyticsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const save_game_analytics_entity_1 = __webpack_require__(/*! ../entities/save-game-analytics.entity */ "./src/save-game/entities/save-game-analytics.entity.ts");
const save_game_interfaces_1 = __webpack_require__(/*! ../interfaces/save-game.interfaces */ "./src/save-game/interfaces/save-game.interfaces.ts");
let SaveAnalyticsService = SaveAnalyticsService_1 = class SaveAnalyticsService {
    constructor(analyticsRepo) {
        this.analyticsRepo = analyticsRepo;
        this.logger = new common_1.Logger(SaveAnalyticsService_1.name);
    }
    async getOrCreateAnalytics(userId) {
        let analytics = await this.analyticsRepo.findOne({ where: { userId } });
        if (!analytics) {
            analytics = this.analyticsRepo.create({ userId });
            analytics = await this.analyticsRepo.save(analytics);
        }
        return analytics;
    }
    async recordSave(userId, saveType, dataSize) {
        const analytics = await this.getOrCreateAnalytics(userId);
        analytics.totalSaves++;
        analytics.lastSaveAt = new Date();
        analytics.totalDataSaved = Number(analytics.totalDataSaved) + dataSize;
        analytics.averageSaveSize =
            Number(analytics.totalDataSaved) / analytics.totalSaves;
        switch (saveType) {
            case save_game_interfaces_1.SaveType.AUTO:
                analytics.autoSaves++;
                break;
            case save_game_interfaces_1.SaveType.MANUAL:
                analytics.manualSaves++;
                break;
            case save_game_interfaces_1.SaveType.QUICKSAVE:
                analytics.quickSaves++;
                break;
        }
        await this.analyticsRepo.save(analytics);
    }
    async recordLoad(userId) {
        const analytics = await this.getOrCreateAnalytics(userId);
        analytics.totalLoads++;
        analytics.lastLoadAt = new Date();
        await this.analyticsRepo.save(analytics);
    }
    async recordSync(userId, hadConflict) {
        const analytics = await this.getOrCreateAnalytics(userId);
        analytics.cloudSyncs++;
        analytics.lastSyncAt = new Date();
        if (hadConflict) {
            analytics.syncConflicts++;
        }
        await this.analyticsRepo.save(analytics);
    }
    async recordConflictResolved(userId) {
        const analytics = await this.getOrCreateAnalytics(userId);
        analytics.conflictsResolved++;
        await this.analyticsRepo.save(analytics);
    }
    async recordCorruption(userId) {
        const analytics = await this.getOrCreateAnalytics(userId);
        analytics.corruptionEvents++;
        await this.analyticsRepo.save(analytics);
    }
    async recordRecoveryAttempt(userId, success) {
        const analytics = await this.getOrCreateAnalytics(userId);
        analytics.recoveryAttempts++;
        if (success) {
            analytics.successfulRecoveries++;
        }
        await this.analyticsRepo.save(analytics);
    }
    async getAnalytics(userId) {
        const analytics = await this.getOrCreateAnalytics(userId);
        return {
            totalSaves: analytics.totalSaves,
            totalLoads: analytics.totalLoads,
            autoSaves: analytics.autoSaves,
            manualSaves: analytics.manualSaves,
            cloudSyncs: analytics.cloudSyncs,
            syncConflicts: analytics.syncConflicts,
            corruptionEvents: analytics.corruptionEvents,
            lastSaveAt: analytics.lastSaveAt,
            lastLoadAt: analytics.lastLoadAt,
            averageSaveSize: analytics.averageSaveSize,
        };
    }
    async getGlobalStats() {
        const result = await this.analyticsRepo
            .createQueryBuilder('analytics')
            .select('COUNT(DISTINCT analytics.userId)', 'totalUsers')
            .addSelect('SUM(analytics.totalSaves)', 'totalSaves')
            .addSelect('SUM(analytics.cloudSyncs)', 'totalSyncs')
            .addSelect('AVG(CASE WHEN analytics.cloudSyncs > 0 THEN analytics.syncConflicts::float / analytics.cloudSyncs ELSE 0 END)', 'avgConflictRate')
            .addSelect('AVG(CASE WHEN analytics.totalSaves > 0 THEN analytics.corruptionEvents::float / analytics.totalSaves ELSE 0 END)', 'avgCorruptionRate')
            .getRawOne();
        return {
            totalUsers: parseInt(result.totalUsers) || 0,
            totalSaves: parseInt(result.totalSaves) || 0,
            totalSyncs: parseInt(result.totalSyncs) || 0,
            averageConflictRate: parseFloat(result.avgConflictRate) || 0,
            averageCorruptionRate: parseFloat(result.avgCorruptionRate) || 0,
        };
    }
};
exports.SaveAnalyticsService = SaveAnalyticsService;
exports.SaveAnalyticsService = SaveAnalyticsService = SaveAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(save_game_analytics_entity_1.SaveGameAnalytics)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], SaveAnalyticsService);


/***/ }),

/***/ "./src/save-game/services/save-backup.service.ts":
/*!*******************************************************!*\
  !*** ./src/save-game/services/save-backup.service.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SaveBackupService_1;
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveBackupService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const schedule_1 = __webpack_require__(/*! @nestjs/schedule */ "@nestjs/schedule");
const save_game_entity_1 = __webpack_require__(/*! ../entities/save-game.entity */ "./src/save-game/entities/save-game.entity.ts");
const save_game_backup_entity_1 = __webpack_require__(/*! ../entities/save-game-backup.entity */ "./src/save-game/entities/save-game-backup.entity.ts");
const save_compression_service_1 = __webpack_require__(/*! ./save-compression.service */ "./src/save-game/services/save-compression.service.ts");
const save_encryption_service_1 = __webpack_require__(/*! ./save-encryption.service */ "./src/save-game/services/save-encryption.service.ts");
const save_game_interfaces_1 = __webpack_require__(/*! ../interfaces/save-game.interfaces */ "./src/save-game/interfaces/save-game.interfaces.ts");
let SaveBackupService = SaveBackupService_1 = class SaveBackupService {
    constructor(backupRepo, saveGameRepo, compressionService, encryptionService) {
        this.backupRepo = backupRepo;
        this.saveGameRepo = saveGameRepo;
        this.compressionService = compressionService;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(SaveBackupService_1.name);
        this.SCHEDULED_BACKUP_RETENTION = 7;
        this.CONFLICT_BACKUP_RETENTION = 30;
        this.MANUAL_BACKUP_RETENTION = 90;
        this.MAX_BACKUPS_PER_SLOT = 10;
    }
    async createBackup(saveGame, reason) {
        this.logger.debug(`Creating ${reason} backup for save ${saveGame.id} (slot ${saveGame.slotId})`);
        const retentionDays = this.getRetentionDays(reason);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + retentionDays);
        const checksum = this.encryptionService.generateChecksum(saveGame.compressedData);
        const backup = this.backupRepo.create({
            saveGameId: saveGame.id,
            userId: saveGame.userId,
            slotId: saveGame.slotId,
            saveVersion: saveGame.saveVersion,
            reason,
            compressedData: saveGame.compressedData,
            checksum,
            dataSize: saveGame.compressedData?.length || 0,
            expiresAt,
        });
        const savedBackup = await this.backupRepo.save(backup);
        await this.cleanupOldBackups(saveGame.userId, saveGame.slotId);
        return savedBackup;
    }
    getRetentionDays(reason) {
        switch (reason) {
            case save_game_backup_entity_1.BackupReason.MANUAL:
                return this.MANUAL_BACKUP_RETENTION;
            case save_game_backup_entity_1.BackupReason.CONFLICT:
            case save_game_backup_entity_1.BackupReason.CORRUPTION_DETECTED:
                return this.CONFLICT_BACKUP_RETENTION;
            default:
                return this.SCHEDULED_BACKUP_RETENTION;
        }
    }
    async getBackups(userId, slotId) {
        const where = { userId };
        if (slotId !== undefined) {
            where.slotId = slotId;
        }
        return this.backupRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    async restoreFromBackup(backupId, userId) {
        const backup = await this.backupRepo.findOne({
            where: { id: backupId, userId },
        });
        if (!backup) {
            throw new Error('Backup not found');
        }
        const currentChecksum = this.encryptionService.generateChecksum(backup.compressedData);
        if (currentChecksum !== backup.checksum) {
            throw new Error('Backup data corrupted - checksum mismatch');
        }
        let saveGame = await this.saveGameRepo.findOne({
            where: { userId, slotId: backup.slotId },
        });
        if (saveGame) {
            await this.createBackup(saveGame, save_game_backup_entity_1.BackupReason.PRE_UPDATE);
            saveGame.compressedData = backup.compressedData;
            saveGame.saveVersion = backup.saveVersion;
            saveGame.lastModifiedAt = new Date();
            saveGame.isCorrupted = false;
            saveGame.corruptionReason = null;
        }
        else {
            saveGame = this.saveGameRepo.create({
                userId,
                slotId: backup.slotId,
                compressedData: backup.compressedData,
                saveVersion: backup.saveVersion,
                lastModifiedAt: new Date(),
                metadata: {
                    slotId: backup.slotId,
                    slotName: `Restored Save (Slot ${backup.slotId})`,
                    saveType: save_game_interfaces_1.SaveType.MANUAL,
                    playtime: 0,
                },
            });
        }
        return this.saveGameRepo.save(saveGame);
    }
    async deleteBackup(backupId, userId) {
        const result = await this.backupRepo.delete({ id: backupId, userId });
        if (result.affected === 0) {
            throw new Error('Backup not found');
        }
    }
    async cleanupOldBackups(userId, slotId) {
        const backups = await this.backupRepo.find({
            where: { userId, slotId },
            order: { createdAt: 'DESC' },
        });
        if (backups.length > this.MAX_BACKUPS_PER_SLOT) {
            const toDelete = backups.slice(this.MAX_BACKUPS_PER_SLOT);
            const idsToDelete = toDelete.map((b) => b.id);
            await this.backupRepo.delete(idsToDelete);
            this.logger.debug(`Cleaned up ${idsToDelete.length} old backups for user ${userId}, slot ${slotId}`);
        }
    }
    async cleanupExpiredBackups() {
        this.logger.log('Running scheduled backup cleanup');
        const result = await this.backupRepo.delete({
            expiresAt: (0, typeorm_2.LessThan)(new Date()),
        });
        this.logger.log(`Cleaned up ${result.affected} expired backups`);
    }
};
exports.SaveBackupService = SaveBackupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], SaveBackupService.prototype, "cleanupExpiredBackups", null);
exports.SaveBackupService = SaveBackupService = SaveBackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(save_game_backup_entity_1.SaveGameBackup)),
    __param(1, (0, typeorm_1.InjectRepository)(save_game_entity_1.SaveGame)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof save_compression_service_1.SaveCompressionService !== "undefined" && save_compression_service_1.SaveCompressionService) === "function" ? _c : Object, typeof (_d = typeof save_encryption_service_1.SaveEncryptionService !== "undefined" && save_encryption_service_1.SaveEncryptionService) === "function" ? _d : Object])
], SaveBackupService);


/***/ }),

/***/ "./src/save-game/services/save-compression.service.ts":
/*!************************************************************!*\
  !*** ./src/save-game/services/save-compression.service.ts ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
var SaveCompressionService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveCompressionService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const zlib = __importStar(__webpack_require__(/*! zlib */ "zlib"));
const util_1 = __webpack_require__(/*! util */ "util");
const { Buffer: NodeBuffer } = __webpack_require__(/*! buffer */ "buffer");
const gzip = (0, util_1.promisify)(zlib.gzip);
const gunzip = (0, util_1.promisify)(zlib.gunzip);
let SaveCompressionService = SaveCompressionService_1 = class SaveCompressionService {
    constructor() {
        this.logger = new common_1.Logger(SaveCompressionService_1.name);
    }
    async compress(data) {
        const jsonString = JSON.stringify(data);
        const originalSize = NodeBuffer.byteLength(jsonString, 'utf8');
        try {
            const compressedData = await gzip(jsonString, { level: 6 });
            const compressedSize = compressedData.length;
            if (compressedSize >= originalSize) {
                this.logger.debug('Compression not beneficial, using raw data');
                return {
                    compressedData: NodeBuffer.from(jsonString, 'utf8'),
                    compressionInfo: {
                        algorithm: 'none',
                        originalSize,
                        compressedSize: originalSize,
                    },
                };
            }
            const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
            this.logger.debug(`Compressed save data: ${originalSize} -> ${compressedSize} bytes (${compressionRatio}% reduction)`);
            return {
                compressedData,
                compressionInfo: {
                    algorithm: 'gzip',
                    originalSize,
                    compressedSize,
                },
            };
        }
        catch (error) {
            this.logger.error('Compression failed, using raw data', error);
            return {
                compressedData: NodeBuffer.from(jsonString, 'utf8'),
                compressionInfo: {
                    algorithm: 'none',
                    originalSize,
                    compressedSize: originalSize,
                },
            };
        }
    }
    async decompress(compressedData, compressionInfo) {
        try {
            let jsonString;
            if (compressionInfo.algorithm === 'none') {
                jsonString = compressedData.toString('utf8');
            }
            else if (compressionInfo.algorithm === 'gzip') {
                const decompressed = await gunzip(compressedData);
                jsonString = decompressed.toString('utf8');
            }
            else {
                throw new Error(`Unsupported compression algorithm: ${compressionInfo.algorithm}`);
            }
            return JSON.parse(jsonString);
        }
        catch (error) {
            this.logger.error('Decompression failed', error);
            throw new Error(`Failed to decompress save data: ${error.message}`);
        }
    }
    estimateCompressedSize(data) {
        const jsonSize = JSON.stringify(data).length;
        return Math.ceil(jsonSize * 0.35);
    }
};
exports.SaveCompressionService = SaveCompressionService;
exports.SaveCompressionService = SaveCompressionService = SaveCompressionService_1 = __decorate([
    (0, common_1.Injectable)()
], SaveCompressionService);


/***/ }),

/***/ "./src/save-game/services/save-encryption.service.ts":
/*!***********************************************************!*\
  !*** ./src/save-game/services/save-encryption.service.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
var SaveEncryptionService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveEncryptionService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const crypto = __importStar(__webpack_require__(/*! crypto */ "crypto"));
const { Buffer: NodeBuffer } = __webpack_require__(/*! buffer */ "buffer");
let SaveEncryptionService = SaveEncryptionService_1 = class SaveEncryptionService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SaveEncryptionService_1.name);
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
        this.initializeKey();
    }
    initializeKey() {
        const keyString = this.configService.get('SAVE_ENCRYPTION_KEY');
        if (keyString) {
            this.encryptionKey = NodeBuffer.from(keyString, 'hex');
            if (this.encryptionKey.length !== this.keyLength) {
                throw new Error(`Invalid encryption key length. Expected ${this.keyLength * 2} hex characters.`);
            }
        }
        else {
            this.logger.warn('SAVE_ENCRYPTION_KEY not configured. Using random key. Save data will not persist across restarts.');
            this.encryptionKey = crypto.randomBytes(this.keyLength);
        }
    }
    async encrypt(data) {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv, {
            authTagLength: this.tagLength,
        });
        const encrypted = NodeBuffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return {
            encryptedData: encrypted,
            encryptionInfo: {
                algorithm: 'aes-256-gcm',
                iv: iv.toString('base64'),
                tag: authTag.toString('base64'),
            },
        };
    }
    async decrypt(encryptedData, encryptionInfo) {
        if (encryptionInfo.algorithm !== 'aes-256-gcm') {
            throw new Error(`Unsupported encryption algorithm: ${encryptionInfo.algorithm}`);
        }
        const iv = NodeBuffer.from(encryptionInfo.iv, 'base64');
        const authTag = NodeBuffer.from(encryptionInfo.tag, 'base64');
        const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv, {
            authTagLength: this.tagLength,
        });
        decipher.setAuthTag(authTag);
        try {
            const decrypted = NodeBuffer.concat([decipher.update(encryptedData), decipher.final()]);
            return decrypted;
        }
        catch (error) {
            this.logger.error('Decryption failed - data may be corrupted or tampered with');
            throw new Error('Failed to decrypt save data: integrity check failed');
        }
    }
    generateChecksum(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    verifyChecksum(data, expectedChecksum) {
        const actualChecksum = this.generateChecksum(data);
        return crypto.timingSafeEqual(NodeBuffer.from(actualChecksum, 'hex'), NodeBuffer.from(expectedChecksum, 'hex'));
    }
    generateDeviceKey(userId, deviceId) {
        return crypto
            .createHmac('sha256', this.encryptionKey)
            .update(`${userId}:${deviceId}`)
            .digest('hex');
    }
};
exports.SaveEncryptionService = SaveEncryptionService;
exports.SaveEncryptionService = SaveEncryptionService = SaveEncryptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], SaveEncryptionService);


/***/ }),

/***/ "./src/save-game/services/save-game.service.ts":
/*!*****************************************************!*\
  !*** ./src/save-game/services/save-game.service.ts ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SaveGameService_1;
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveGameService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const save_game_entity_1 = __webpack_require__(/*! ../entities/save-game.entity */ "./src/save-game/entities/save-game.entity.ts");
const save_game_backup_entity_1 = __webpack_require__(/*! ../entities/save-game-backup.entity */ "./src/save-game/entities/save-game-backup.entity.ts");
const save_game_interfaces_1 = __webpack_require__(/*! ../interfaces/save-game.interfaces */ "./src/save-game/interfaces/save-game.interfaces.ts");
const save_compression_service_1 = __webpack_require__(/*! ./save-compression.service */ "./src/save-game/services/save-compression.service.ts");
const save_encryption_service_1 = __webpack_require__(/*! ./save-encryption.service */ "./src/save-game/services/save-encryption.service.ts");
const save_versioning_service_1 = __webpack_require__(/*! ./save-versioning.service */ "./src/save-game/services/save-versioning.service.ts");
const save_backup_service_1 = __webpack_require__(/*! ./save-backup.service */ "./src/save-game/services/save-backup.service.ts");
const save_analytics_service_1 = __webpack_require__(/*! ./save-analytics.service */ "./src/save-game/services/save-analytics.service.ts");
let SaveGameService = SaveGameService_1 = class SaveGameService {
    constructor(saveGameRepo, compressionService, encryptionService, versioningService, backupService, analyticsService) {
        this.saveGameRepo = saveGameRepo;
        this.compressionService = compressionService;
        this.encryptionService = encryptionService;
        this.versioningService = versioningService;
        this.backupService = backupService;
        this.analyticsService = analyticsService;
        this.logger = new common_1.Logger(SaveGameService_1.name);
        this.MAX_SLOTS = 100;
    }
    async create(userId, dto) {
        if (dto.slotId < 0 || dto.slotId >= this.MAX_SLOTS) {
            throw new common_1.BadRequestException(`Slot ID must be between 0 and ${this.MAX_SLOTS - 1}`);
        }
        const existingSave = await this.saveGameRepo.findOne({
            where: { userId, slotId: dto.slotId },
        });
        if (existingSave) {
            throw new common_1.BadRequestException(`Save slot ${dto.slotId} already exists. Use update instead.`);
        }
        const validation = this.versioningService.validateDataStructure(dto.data);
        if (!validation.valid) {
            throw new common_1.BadRequestException(`Invalid save data: ${validation.errors.join(', ')}`);
        }
        const saveData = this.versioningService.mergeWithDefaults(dto.data);
        const { compressedData, compressionInfo } = await this.compressionService.compress(saveData);
        const { encryptedData, encryptionInfo } = await this.encryptionService.encrypt(compressedData);
        const checksum = {
            algorithm: 'sha256',
            value: this.encryptionService.generateChecksum(compressedData),
        };
        const metadata = {
            slotId: dto.slotId,
            slotName: dto.slotName || `Save Slot ${dto.slotId}`,
            saveType: dto.saveType || save_game_interfaces_1.SaveType.MANUAL,
            playtime: dto.playtime || 0,
            customData: dto.customMetadata,
        };
        const saveGame = this.saveGameRepo.create({
            userId,
            slotId: dto.slotId,
            slotName: dto.slotName || `Save Slot ${dto.slotId}`,
            saveType: dto.saveType || save_game_interfaces_1.SaveType.MANUAL,
            version: this.versioningService.CURRENT_VERSION,
            saveVersion: 1,
            metadata,
            compressedData: encryptedData,
            rawData: process.env.NODE_ENV === 'development' ? saveData : null,
            checksum,
            compressionInfo,
            encryptionInfo,
            syncStatus: save_game_interfaces_1.SyncStatus.LOCAL_ONLY,
            lastModifiedAt: new Date(),
            deviceId: dto.deviceId,
            platform: dto.platform,
            saveCount: 1,
        });
        const saved = await this.saveGameRepo.save(saveGame);
        await this.analyticsService.recordSave(userId, dto.saveType || save_game_interfaces_1.SaveType.MANUAL, encryptedData.length);
        this.logger.log(`Created save game ${saved.id} for user ${userId} in slot ${dto.slotId}`);
        return saved;
    }
    async update(userId, slotId, dto) {
        const saveGame = await this.saveGameRepo.findOne({
            where: { userId, slotId },
        });
        if (!saveGame) {
            throw new common_1.NotFoundException(`Save slot ${slotId} not found`);
        }
        await this.backupService.createBackup(saveGame, save_game_backup_entity_1.BackupReason.PRE_UPDATE);
        if (dto.slotName) {
            saveGame.slotName = dto.slotName;
            saveGame.metadata.slotName = dto.slotName;
        }
        if (dto.playtime !== undefined) {
            saveGame.metadata.playtime = dto.playtime;
        }
        if (dto.customMetadata) {
            saveGame.metadata.customData = {
                ...saveGame.metadata.customData,
                ...dto.customMetadata,
            };
        }
        if (dto.data) {
            const validation = this.versioningService.validateDataStructure(dto.data);
            if (!validation.valid) {
                throw new common_1.BadRequestException(`Invalid save data: ${validation.errors.join(', ')}`);
            }
            const saveData = this.versioningService.mergeWithDefaults(dto.data);
            const { compressedData, compressionInfo } = await this.compressionService.compress(saveData);
            const { encryptedData, encryptionInfo } = await this.encryptionService.encrypt(compressedData);
            saveGame.compressedData = encryptedData;
            saveGame.compressionInfo = compressionInfo;
            saveGame.encryptionInfo = encryptionInfo;
            saveGame.checksum = {
                algorithm: 'sha256',
                value: this.encryptionService.generateChecksum(compressedData),
            };
            if (process.env.NODE_ENV === 'development') {
                saveGame.rawData = saveData;
            }
        }
        saveGame.saveVersion++;
        saveGame.saveCount++;
        saveGame.lastModifiedAt = new Date();
        saveGame.deviceId = dto.deviceId || saveGame.deviceId;
        saveGame.platform = dto.platform || saveGame.platform;
        saveGame.syncStatus = save_game_interfaces_1.SyncStatus.LOCAL_NEWER;
        const updated = await this.saveGameRepo.save(saveGame);
        await this.analyticsService.recordSave(userId, saveGame.saveType, saveGame.compressedData?.length || 0);
        return updated;
    }
    async findOne(userId, slotId) {
        const saveGame = await this.saveGameRepo.findOne({
            where: { userId, slotId },
        });
        if (!saveGame) {
            throw new common_1.NotFoundException(`Save slot ${slotId} not found`);
        }
        return saveGame;
    }
    async findAll(userId) {
        const saves = await this.saveGameRepo.find({
            where: { userId },
            order: { slotId: 'ASC' },
        });
        return saves.map((save) => this.toSummary(save));
    }
    async load(userId, slotId) {
        const saveGame = await this.findOne(userId, slotId);
        if (saveGame.isCorrupted) {
            throw new common_1.BadRequestException(`Save is corrupted: ${saveGame.corruptionReason}. Try restoring from backup.`);
        }
        try {
            const decryptedData = await this.encryptionService.decrypt(saveGame.compressedData, saveGame.encryptionInfo);
            if (!this.encryptionService.verifyChecksum(decryptedData, saveGame.checksum.value)) {
                await this.markCorrupted(saveGame, 'Checksum verification failed');
                throw new common_1.BadRequestException('Save data corrupted - checksum mismatch');
            }
            const saveData = await this.compressionService.decompress(decryptedData, saveGame.compressionInfo);
            const migratedData = this.versioningService.migrateToCurrentVersion(saveData);
            saveGame.loadCount++;
            await this.saveGameRepo.save(saveGame);
            await this.analyticsService.recordLoad(userId);
            return migratedData;
        }
        catch (error) {
            this.logger.error(`Failed to load save ${saveGame.id}: ${error.message}`);
            if (!saveGame.isCorrupted) {
                await this.markCorrupted(saveGame, error.message);
                await this.analyticsService.recordCorruption(userId);
            }
            throw error;
        }
    }
    async delete(userId, slotId) {
        const saveGame = await this.findOne(userId, slotId);
        await this.backupService.createBackup(saveGame, save_game_backup_entity_1.BackupReason.MANUAL);
        await this.saveGameRepo.remove(saveGame);
        this.logger.log(`Deleted save game slot ${slotId} for user ${userId}`);
    }
    async getEmptySlots(userId, count = 10) {
        const usedSlots = await this.saveGameRepo
            .createQueryBuilder('save')
            .select('save.slotId')
            .where('save.userId = :userId', { userId })
            .getMany();
        const usedSlotIds = new Set(usedSlots.map((s) => s.slotId));
        const emptySlots = [];
        for (let i = 0; i < this.MAX_SLOTS && emptySlots.length < count; i++) {
            if (!usedSlotIds.has(i)) {
                emptySlots.push(i);
            }
        }
        return emptySlots;
    }
    async markCorrupted(saveGame, reason) {
        saveGame.isCorrupted = true;
        saveGame.corruptionReason = reason;
        await this.saveGameRepo.save(saveGame);
        try {
            await this.backupService.createBackup(saveGame, save_game_backup_entity_1.BackupReason.CORRUPTION_DETECTED);
        }
        catch {
            this.logger.warn(`Failed to create corruption backup for save ${saveGame.id}`);
        }
    }
    toSummary(save) {
        return {
            id: save.id,
            slotId: save.slotId,
            slotName: save.slotName,
            version: save.saveVersion,
            checksum: save.checksum?.value || '',
            lastModifiedAt: save.lastModifiedAt,
            playtime: save.metadata?.playtime || 0,
            isCompressed: save.compressionInfo?.algorithm !== 'none',
            isEncrypted: !!save.encryptionInfo,
        };
    }
};
exports.SaveGameService = SaveGameService;
exports.SaveGameService = SaveGameService = SaveGameService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(save_game_entity_1.SaveGame)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof save_compression_service_1.SaveCompressionService !== "undefined" && save_compression_service_1.SaveCompressionService) === "function" ? _b : Object, typeof (_c = typeof save_encryption_service_1.SaveEncryptionService !== "undefined" && save_encryption_service_1.SaveEncryptionService) === "function" ? _c : Object, typeof (_d = typeof save_versioning_service_1.SaveVersioningService !== "undefined" && save_versioning_service_1.SaveVersioningService) === "function" ? _d : Object, typeof (_e = typeof save_backup_service_1.SaveBackupService !== "undefined" && save_backup_service_1.SaveBackupService) === "function" ? _e : Object, typeof (_f = typeof save_analytics_service_1.SaveAnalyticsService !== "undefined" && save_analytics_service_1.SaveAnalyticsService) === "function" ? _f : Object])
], SaveGameService);


/***/ }),

/***/ "./src/save-game/services/save-versioning.service.ts":
/*!***********************************************************!*\
  !*** ./src/save-game/services/save-versioning.service.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SaveVersioningService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SaveVersioningService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let SaveVersioningService = SaveVersioningService_1 = class SaveVersioningService {
    constructor() {
        this.logger = new common_1.Logger(SaveVersioningService_1.name);
        this.CURRENT_VERSION = 1;
        this.migrations = [];
    }
    isCompatible(version) {
        if (version === this.CURRENT_VERSION) {
            return true;
        }
        return this.canMigrate(version, this.CURRENT_VERSION);
    }
    canMigrate(fromVersion, toVersion) {
        if (fromVersion >= toVersion) {
            return fromVersion === toVersion;
        }
        let currentVersion = fromVersion;
        while (currentVersion < toVersion) {
            const migration = this.migrations.find((m) => m.fromVersion === currentVersion);
            if (!migration) {
                return false;
            }
            currentVersion = migration.toVersion;
        }
        return currentVersion === toVersion;
    }
    migrateToCurrentVersion(data) {
        if (data.version === this.CURRENT_VERSION) {
            return data;
        }
        if (data.version > this.CURRENT_VERSION) {
            this.logger.warn(`Save data version ${data.version} is newer than supported version ${this.CURRENT_VERSION}. ` +
                'Data may not load correctly.');
            return data;
        }
        this.logger.log(`Migrating save data from v${data.version} to v${this.CURRENT_VERSION}`);
        let migratedData = { ...data };
        let currentVersion = data.version;
        while (currentVersion < this.CURRENT_VERSION) {
            const migration = this.migrations.find((m) => m.fromVersion === currentVersion);
            if (!migration) {
                throw new Error(`No migration path from version ${currentVersion} to ${this.CURRENT_VERSION}`);
            }
            this.logger.debug(`Applying migration v${migration.fromVersion} -> v${migration.toVersion}`);
            migratedData = migration.migrate(migratedData);
            currentVersion = migration.toVersion;
        }
        return migratedData;
    }
    validateDataStructure(data) {
        const errors = [];
        if (!data || typeof data !== 'object') {
            return { valid: false, errors: ['Data must be an object'] };
        }
        const saveData = data;
        if (typeof saveData.version !== 'number') {
            errors.push('Missing or invalid version field');
        }
        if (!saveData.gameState || typeof saveData.gameState !== 'object') {
            errors.push('Missing or invalid gameState field');
        }
        if (!saveData.playerState || typeof saveData.playerState !== 'object') {
            errors.push('Missing or invalid playerState field');
        }
        if (!saveData.progressState || typeof saveData.progressState !== 'object') {
            errors.push('Missing or invalid progressState field');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    createDefaultSaveData() {
        return {
            version: this.CURRENT_VERSION,
            gameState: {},
            playerState: {
                position: { x: 0, y: 0 },
                health: 100,
                inventory: [],
                stats: {},
            },
            progressState: {
                completedLevels: [],
                unlockedAchievements: [],
                collectibles: [],
            },
            settings: {},
        };
    }
    mergeWithDefaults(partialData) {
        const defaults = this.createDefaultSaveData();
        return {
            ...defaults,
            ...partialData,
            version: this.CURRENT_VERSION,
            playerState: {
                ...defaults.playerState,
                ...partialData.playerState,
            },
            progressState: {
                ...defaults.progressState,
                ...partialData.progressState,
            },
        };
    }
};
exports.SaveVersioningService = SaveVersioningService;
exports.SaveVersioningService = SaveVersioningService = SaveVersioningService_1 = __decorate([
    (0, common_1.Injectable)()
], SaveVersioningService);


/***/ }),

/***/ "./src/soroban/soroban.module.ts":
/*!***************************************!*\
  !*** ./src/soroban/soroban.module.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SorobanModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const soroban_service_1 = __webpack_require__(/*! ./soroban.service */ "./src/soroban/soroban.service.ts");
let SorobanModule = class SorobanModule {
};
exports.SorobanModule = SorobanModule;
exports.SorobanModule = SorobanModule = __decorate([
    (0, common_1.Module)({
        providers: [soroban_service_1.SorobanService],
        exports: [soroban_service_1.SorobanService],
    })
], SorobanModule);


/***/ }),

/***/ "./src/soroban/soroban.service.ts":
/*!****************************************!*\
  !*** ./src/soroban/soroban.service.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var SorobanService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SorobanService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const stellar_sdk_1 = __webpack_require__(/*! @stellar/stellar-sdk */ "@stellar/stellar-sdk");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
let SorobanService = SorobanService_1 = class SorobanService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SorobanService_1.name);
        const rpcUrl = this.configService.get('SOROBAN_RPC_URL') || 'https://soroban-testnet.stellar.org';
        this.server = new stellar_sdk_1.rpc.Server(rpcUrl);
        this.networkPassphrase = this.configService.get('STELLAR_NETWORK_PASSPHRASE') || stellar_sdk_1.Networks.TESTNET;
        const secretKey = this.configService.get('STELLAR_SECRET_KEY');
        if (secretKey) {
            this.sourceKeypair = stellar_sdk_1.Keypair.fromSecret(secretKey);
        }
        else {
            this.logger.warn('STELLAR_SECRET_KEY not provided. SorobanService will be unable to sign transactions.');
        }
    }
    async invokeContract(contractId, method, params) {
        if (!this.sourceKeypair) {
            throw new Error('Source keypair not initialized. Cannot invoke contract.');
        }
        try {
            const contract = new stellar_sdk_1.Contract(contractId);
            const sourceAccount = await this.server.getAccount(this.sourceKeypair.publicKey());
            const transaction = new stellar_sdk_1.TransactionBuilder(sourceAccount, {
                fee: '1000000',
                networkPassphrase: this.networkPassphrase,
            })
                .addOperation(contract.call(method, ...params))
                .setTimeout(30)
                .build();
            const preparedTransaction = await this.server.prepareTransaction(transaction);
            preparedTransaction.sign(this.sourceKeypair);
            const response = await this.server.sendTransaction(preparedTransaction);
            if (response.status === 'ERROR') {
                throw new Error(`Transaction failed: ${JSON.stringify(response.errorResult)}`);
            }
            this.logger.log(`Transaction sent: ${response.hash}. Waiting for confirmation...`);
            let status = await this.server.getTransaction(response.hash);
            let attempts = 0;
            const maxAttempts = 15;
            while (status.status === 'NOT_FOUND' && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                status = await this.server.getTransaction(response.hash);
                attempts++;
            }
            const isSuccess = status.status === 'SUCCESS';
            if (!isSuccess) {
                this.logger.error(`Transaction ${response.hash} failed or timed out with status: ${status.status}`);
            }
            else {
                this.logger.log(`Transaction ${response.hash} confirmed successfully.`);
            }
            return {
                hash: response.hash,
                status: status.status,
                result: status,
            };
        }
        catch (error) {
            this.logger.error(`Error invoking contract ${contractId} method ${method}:`, error);
            throw error;
        }
    }
    async getContractData(contractId, key) {
        try {
            const contract = new stellar_sdk_1.Contract(contractId);
            const ledgerKey = stellar_sdk_1.xdr.LedgerKey.contractData(new stellar_sdk_1.xdr.LedgerKeyContractData({
                contract: contract.address().toScAddress(),
                key: key,
                durability: stellar_sdk_1.xdr.ContractDataDurability.persistent(),
            }));
            const response = await this.server.getLedgerEntries(ledgerKey);
            return response.entries[0];
        }
        catch (error) {
            this.logger.error(`Error fetching contract data for ${contractId}:`, error);
            throw error;
        }
    }
};
exports.SorobanService = SorobanService;
exports.SorobanService = SorobanService = SorobanService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], SorobanService);


/***/ }),

/***/ "./src/tournaments/dto/create-tournament.dto.ts":
/*!******************************************************!*\
  !*** ./src/tournaments/dto/create-tournament.dto.ts ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

"use strict";

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
        const tournament = await this.tournamentRepository.findOne({
            where: { id },
            relations: ['participants', 'matches'],
        });
        if (!tournament) {
            throw new common_1.NotFoundException(`Tournament with ID ${id} not found`);
        }
        return tournament;
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
            await this.advanceToNextMatch(match.nextMatchId, winnerId, (winnerId === match.player1Id ? match.player1Name : match.player2Name));
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

/***/ "./src/tutorial/controllers/contextual-help.controller.ts":
/*!****************************************************************!*\
  !*** ./src/tutorial/controllers/contextual-help.controller.ts ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ContextualHelpController_1;
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ContextualHelpController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const contextual_help_service_1 = __webpack_require__(/*! ../services/contextual-help.service */ "./src/tutorial/services/contextual-help.service.ts");
const localization_service_1 = __webpack_require__(/*! ../services/localization.service */ "./src/tutorial/services/localization.service.ts");
const dto_1 = __webpack_require__(/*! ../dto */ "./src/tutorial/dto/index.ts");
let ContextualHelpController = ContextualHelpController_1 = class ContextualHelpController {
    constructor(helpService, localizationService) {
        this.helpService = helpService;
        this.localizationService = localizationService;
        this.logger = new common_1.Logger(ContextualHelpController_1.name);
    }
    async create(dto) {
        this.logger.log(`Creating contextual help: ${dto.name}`);
        return this.helpService.create(dto);
    }
    async findAll(filters) {
        this.logger.log(`Fetching contextual help with filters: ${JSON.stringify(filters)}`);
        return this.helpService.findAll(filters);
    }
    async findOne(id, locale) {
        this.logger.log(`Fetching contextual help: ${id}`);
        const help = await this.helpService.findById(id);
        if (locale) {
            return this.localizationService.localizeHelp(help, locale);
        }
        return help;
    }
    async update(id, dto) {
        this.logger.log(`Updating contextual help: ${id}`);
        return this.helpService.update(id, dto);
    }
    async delete(id) {
        this.logger.log(`Deleting contextual help: ${id}`);
        await this.helpService.delete(id);
    }
    async triggerHelp(userId, dto, locale) {
        this.logger.log(`Triggering help for user ${userId} in context: ${dto.context}`);
        const help = await this.helpService.triggerHelp(userId, dto);
        if (help && locale) {
            return this.localizationService.localizeHelp(help, locale);
        }
        return help;
    }
    async recordInteraction(userId, dto) {
        this.logger.log(`Recording interaction for user ${userId} on help ${dto.helpId}`);
        await this.helpService.recordInteraction(userId, dto);
        return { message: 'Interaction recorded successfully' };
    }
    async getUserHistory(userId, helpId) {
        this.logger.log(`Fetching help history for user ${userId}`);
        return this.helpService.getUserHelpHistory(userId, helpId);
    }
    async getHelpForPuzzleStart(userId, puzzleType, locale) {
        this.logger.log(`Getting puzzle start help for user ${userId}, type: ${puzzleType}`);
        const help = await this.helpService.getHelpForPuzzleStart(userId, puzzleType);
        if (help && locale) {
            return this.localizationService.localizeHelp(help, locale);
        }
        return help;
    }
    async getHelpForRepeatedFailure(userId, puzzleId, attempts, locale) {
        this.logger.log(`Getting failure help for user ${userId}, puzzle: ${puzzleId}`);
        const help = await this.helpService.getHelpForRepeatedFailure(userId, puzzleId, attempts);
        if (help && locale) {
            return this.localizationService.localizeHelp(help, locale);
        }
        return help;
    }
    async getHelpForFeature(userId, feature, locale) {
        this.logger.log(`Getting feature help for user ${userId}, feature: ${feature}`);
        const help = await this.helpService.getHelpForFeature(userId, feature);
        if (help && locale) {
            return this.localizationService.localizeHelp(help, locale);
        }
        return help;
    }
    async getHelpAnalytics(helpId) {
        this.logger.log('Fetching contextual help analytics');
        return this.helpService.getHelpAnalytics(helpId);
    }
};
exports.ContextualHelpController = ContextualHelpController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof dto_1.CreateContextualHelpDto !== "undefined" && dto_1.CreateContextualHelpDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof dto_1.ContextualHelpFilterDto !== "undefined" && dto_1.ContextualHelpFilterDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof dto_1.UpdateContextualHelpDto !== "undefined" && dto_1.UpdateContextualHelpDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('user/:userId/trigger'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof dto_1.TriggerContextualHelpDto !== "undefined" && dto_1.TriggerContextualHelpDto) === "function" ? _f : Object, String]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "triggerHelp", null);
__decorate([
    (0, common_1.Post)('user/:userId/interaction'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof dto_1.RecordHelpInteractionDto !== "undefined" && dto_1.RecordHelpInteractionDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "recordInteraction", null);
__decorate([
    (0, common_1.Get)('user/:userId/history'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('helpId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "getUserHistory", null);
__decorate([
    (0, common_1.Get)('puzzle-start/:userId/:puzzleType'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('puzzleType')),
    __param(2, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "getHelpForPuzzleStart", null);
__decorate([
    (0, common_1.Get)('repeated-failure/:userId/:puzzleId'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('puzzleId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)('attempts')),
    __param(3, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "getHelpForRepeatedFailure", null);
__decorate([
    (0, common_1.Get)('feature/:userId/:feature'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('feature')),
    __param(2, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "getHelpForFeature", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Query)('helpId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContextualHelpController.prototype, "getHelpAnalytics", null);
exports.ContextualHelpController = ContextualHelpController = ContextualHelpController_1 = __decorate([
    (0, common_1.Controller)('contextual-help'),
    __metadata("design:paramtypes", [typeof (_a = typeof contextual_help_service_1.ContextualHelpService !== "undefined" && contextual_help_service_1.ContextualHelpService) === "function" ? _a : Object, typeof (_b = typeof localization_service_1.LocalizationService !== "undefined" && localization_service_1.LocalizationService) === "function" ? _b : Object])
], ContextualHelpController);


/***/ }),

/***/ "./src/tutorial/controllers/index.ts":
/*!*******************************************!*\
  !*** ./src/tutorial/controllers/index.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
__exportStar(__webpack_require__(/*! ./tutorial.controller */ "./src/tutorial/controllers/tutorial.controller.ts"), exports);
__exportStar(__webpack_require__(/*! ./tutorial-progress.controller */ "./src/tutorial/controllers/tutorial-progress.controller.ts"), exports);
__exportStar(__webpack_require__(/*! ./contextual-help.controller */ "./src/tutorial/controllers/contextual-help.controller.ts"), exports);
__exportStar(__webpack_require__(/*! ./tutorial-analytics.controller */ "./src/tutorial/controllers/tutorial-analytics.controller.ts"), exports);


/***/ }),

/***/ "./src/tutorial/controllers/tutorial-analytics.controller.ts":
/*!*******************************************************************!*\
  !*** ./src/tutorial/controllers/tutorial-analytics.controller.ts ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TutorialAnalyticsController_1;
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialAnalyticsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const tutorial_analytics_service_1 = __webpack_require__(/*! ../services/tutorial-analytics.service */ "./src/tutorial/services/tutorial-analytics.service.ts");
const dto_1 = __webpack_require__(/*! ../dto */ "./src/tutorial/dto/index.ts");
let TutorialAnalyticsController = TutorialAnalyticsController_1 = class TutorialAnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
        this.logger = new common_1.Logger(TutorialAnalyticsController_1.name);
    }
    async getCompletionRate(tutorialId, dateRange) {
        this.logger.log(`Getting completion rate for tutorial: ${tutorialId}`);
        const rate = await this.analyticsService.getCompletionRate(tutorialId, dateRange);
        return { tutorialId, rate };
    }
    async getAllCompletionRates(filters) {
        this.logger.log('Getting all tutorial completion rates');
        return this.analyticsService.getAllCompletionRates(filters);
    }
    async getStepCompletionRates(tutorialId) {
        this.logger.log(`Getting step completion rates for tutorial: ${tutorialId}`);
        return this.analyticsService.getStepCompletionRates(tutorialId);
    }
    async getDropOffAnalysis(tutorialId) {
        this.logger.log(`Getting drop-off analysis for tutorial: ${tutorialId}`);
        return this.analyticsService.getDropOffAnalysis(tutorialId);
    }
    async getCommonDropOffPoints() {
        this.logger.log('Getting common drop-off points across all tutorials');
        return this.analyticsService.getCommonDropOffPoints();
    }
    async getEffectivenessReport(tutorialId, filters) {
        this.logger.log(`Getting effectiveness report for tutorial: ${tutorialId}`);
        return this.analyticsService.getEffectivenessReport(tutorialId, filters);
    }
    async getStepEffectiveness(stepId) {
        this.logger.log(`Getting effectiveness for step: ${stepId}`);
        return this.analyticsService.getStepEffectiveness(stepId);
    }
    async getUserLearningProfile(userId) {
        this.logger.log(`Getting learning profile for user: ${userId}`);
        return this.analyticsService.getUserLearningProfile(userId);
    }
    async getAverageCompletionTime(tutorialId) {
        this.logger.log(`Getting average completion time for tutorial: ${tutorialId}`);
        const time = await this.analyticsService.getAverageTimeToCompletion(tutorialId);
        return { tutorialId, averageCompletionTimeSeconds: time };
    }
    async getHintUsageAnalytics(tutorialId) {
        this.logger.log(`Getting hint usage analytics for tutorial: ${tutorialId}`);
        return this.analyticsService.getHintUsageAnalytics(tutorialId);
    }
    async getErrorPatterns(tutorialId) {
        this.logger.log(`Getting error patterns for tutorial: ${tutorialId}`);
        return this.analyticsService.getErrorPatterns(tutorialId);
    }
    async getDashboardReport(dateRange) {
        this.logger.log('Generating tutorial analytics dashboard');
        return this.analyticsService.generateDashboardReport(dateRange);
    }
    async getActiveUsers() {
        this.logger.log('Getting active tutorial users count');
        const count = await this.analyticsService.getActiveUsers();
        return { count };
    }
    async getCurrentCompletions(interval) {
        this.logger.log(`Getting completions for interval: ${interval}`);
        const count = await this.analyticsService.getCurrentCompletions(interval);
        return { interval, count };
    }
    async exportAnalytics(filters) {
        this.logger.log('Exporting tutorial analytics');
        return this.analyticsService.exportAnalyticsData(filters);
    }
    async getEvents(filters) {
        this.logger.log(`Querying tutorial analytics events`);
        return this.analyticsService.queryEvents(filters);
    }
};
exports.TutorialAnalyticsController = TutorialAnalyticsController;
__decorate([
    (0, common_1.Get)('completion-rate/:tutorialId'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof dto_1.DateRangeDto !== "undefined" && dto_1.DateRangeDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getCompletionRate", null);
__decorate([
    (0, common_1.Get)('completion-rates'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof dto_1.TutorialAnalyticsFilterDto !== "undefined" && dto_1.TutorialAnalyticsFilterDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getAllCompletionRates", null);
__decorate([
    (0, common_1.Get)('step-completion-rates/:tutorialId'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getStepCompletionRates", null);
__decorate([
    (0, common_1.Get)('drop-off/:tutorialId'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getDropOffAnalysis", null);
__decorate([
    (0, common_1.Get)('drop-off-points'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getCommonDropOffPoints", null);
__decorate([
    (0, common_1.Get)('effectiveness/:tutorialId'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof dto_1.TutorialEffectivenessFilterDto !== "undefined" && dto_1.TutorialEffectivenessFilterDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getEffectivenessReport", null);
__decorate([
    (0, common_1.Get)('step-effectiveness/:stepId'),
    __param(0, (0, common_1.Param)('stepId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getStepEffectiveness", null);
__decorate([
    (0, common_1.Get)('user/:userId/learning-profile'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getUserLearningProfile", null);
__decorate([
    (0, common_1.Get)('average-time/:tutorialId'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getAverageCompletionTime", null);
__decorate([
    (0, common_1.Get)('hint-usage/:tutorialId'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getHintUsageAnalytics", null);
__decorate([
    (0, common_1.Get)('error-patterns/:tutorialId'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getErrorPatterns", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof dto_1.DateRangeDto !== "undefined" && dto_1.DateRangeDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getDashboardReport", null);
__decorate([
    (0, common_1.Get)('active-users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getActiveUsers", null);
__decorate([
    (0, common_1.Get)('completions/:interval'),
    __param(0, (0, common_1.Param)('interval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getCurrentCompletions", null);
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof dto_1.AnalyticsExportFilterDto !== "undefined" && dto_1.AnalyticsExportFilterDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "exportAnalytics", null);
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof dto_1.TutorialAnalyticsFilterDto !== "undefined" && dto_1.TutorialAnalyticsFilterDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], TutorialAnalyticsController.prototype, "getEvents", null);
exports.TutorialAnalyticsController = TutorialAnalyticsController = TutorialAnalyticsController_1 = __decorate([
    (0, common_1.Controller)('tutorial-analytics'),
    __metadata("design:paramtypes", [typeof (_a = typeof tutorial_analytics_service_1.TutorialAnalyticsService !== "undefined" && tutorial_analytics_service_1.TutorialAnalyticsService) === "function" ? _a : Object])
], TutorialAnalyticsController);


/***/ }),

/***/ "./src/tutorial/controllers/tutorial-progress.controller.ts":
/*!******************************************************************!*\
  !*** ./src/tutorial/controllers/tutorial-progress.controller.ts ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TutorialProgressController_1;
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialProgressController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const tutorial_progress_service_1 = __webpack_require__(/*! ../services/tutorial-progress.service */ "./src/tutorial/services/tutorial-progress.service.ts");
const dto_1 = __webpack_require__(/*! ../dto */ "./src/tutorial/dto/index.ts");
let TutorialProgressController = TutorialProgressController_1 = class TutorialProgressController {
    constructor(progressService) {
        this.progressService = progressService;
        this.logger = new common_1.Logger(TutorialProgressController_1.name);
    }
    async startTutorial(userId, dto) {
        this.logger.log(`User ${userId} starting tutorial: ${dto.tutorialId}`);
        return this.progressService.startTutorial(userId, dto);
    }
    async getAllProgress(userId) {
        this.logger.log(`Fetching all progress for user: ${userId}`);
        return this.progressService.getAllUserProgress(userId);
    }
    async getProgress(userId, tutorialId) {
        this.logger.log(`Fetching progress for user ${userId} on tutorial ${tutorialId}`);
        return this.progressService.getUserProgress(userId, tutorialId);
    }
    async updateStepProgress(userId, dto) {
        this.logger.log(`Updating step progress for user ${userId}`);
        return this.progressService.updateStepProgress(userId, dto);
    }
    async skipTutorial(userId, dto) {
        this.logger.log(`User ${userId} skipping tutorial: ${dto.tutorialId}`);
        return this.progressService.skipTutorial(userId, dto);
    }
    async skipStep(userId, dto) {
        this.logger.log(`User ${userId} skipping step: ${dto.stepId}`);
        return this.progressService.skipStep(userId, dto);
    }
    async resumeTutorial(userId, dto) {
        this.logger.log(`User ${userId} resuming tutorial: ${dto.tutorialId}`);
        return this.progressService.resumeTutorial(userId, dto);
    }
    async saveCheckpoint(userId, dto) {
        this.logger.log(`Saving checkpoint for user ${userId} on tutorial ${dto.tutorialId}`);
        await this.progressService.saveCheckpoint(userId, dto);
        return { message: 'Checkpoint saved successfully' };
    }
    async getNextStep(userId, tutorialId) {
        this.logger.log(`Getting next step for user ${userId} on tutorial ${tutorialId}`);
        return this.progressService.getNextStep(userId, tutorialId);
    }
    async getAdaptiveState(userId, tutorialId) {
        this.logger.log(`Getting adaptive state for user ${userId} on tutorial ${tutorialId}`);
        return this.progressService.getAdaptiveState(userId, tutorialId);
    }
    async completeTutorial(userId, tutorialId) {
        this.logger.log(`Completing tutorial ${tutorialId} for user ${userId}`);
        return this.progressService.completeTutorial(userId, tutorialId);
    }
    async getCompletedTutorials(userId) {
        this.logger.log(`Getting completed tutorials for user ${userId}`);
        return this.progressService.getCompletedTutorials(userId);
    }
};
exports.TutorialProgressController = TutorialProgressController;
__decorate([
    (0, common_1.Post)('user/:userId/start'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof dto_1.StartTutorialDto !== "undefined" && dto_1.StartTutorialDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "startTutorial", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "getAllProgress", null);
__decorate([
    (0, common_1.Get)('user/:userId/tutorial/:tutorialId'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Post)('user/:userId/step'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof dto_1.UpdateStepProgressDto !== "undefined" && dto_1.UpdateStepProgressDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "updateStepProgress", null);
__decorate([
    (0, common_1.Post)('user/:userId/skip'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof dto_1.SkipTutorialDto !== "undefined" && dto_1.SkipTutorialDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "skipTutorial", null);
__decorate([
    (0, common_1.Post)('user/:userId/skip-step'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof dto_1.SkipStepDto !== "undefined" && dto_1.SkipStepDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "skipStep", null);
__decorate([
    (0, common_1.Post)('user/:userId/resume'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof dto_1.ResumeTutorialDto !== "undefined" && dto_1.ResumeTutorialDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "resumeTutorial", null);
__decorate([
    (0, common_1.Post)('user/:userId/checkpoint'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof dto_1.SaveCheckpointDto !== "undefined" && dto_1.SaveCheckpointDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "saveCheckpoint", null);
__decorate([
    (0, common_1.Get)('user/:userId/tutorial/:tutorialId/next-step'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "getNextStep", null);
__decorate([
    (0, common_1.Get)('user/:userId/tutorial/:tutorialId/adaptive-state'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "getAdaptiveState", null);
__decorate([
    (0, common_1.Post)('user/:userId/tutorial/:tutorialId/complete'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "completeTutorial", null);
__decorate([
    (0, common_1.Get)('user/:userId/completed'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialProgressController.prototype, "getCompletedTutorials", null);
exports.TutorialProgressController = TutorialProgressController = TutorialProgressController_1 = __decorate([
    (0, common_1.Controller)('tutorial-progress'),
    __metadata("design:paramtypes", [typeof (_a = typeof tutorial_progress_service_1.TutorialProgressService !== "undefined" && tutorial_progress_service_1.TutorialProgressService) === "function" ? _a : Object])
], TutorialProgressController);


/***/ }),

/***/ "./src/tutorial/controllers/tutorial.controller.ts":
/*!*********************************************************!*\
  !*** ./src/tutorial/controllers/tutorial.controller.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TutorialController_1;
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const tutorial_service_1 = __webpack_require__(/*! ../services/tutorial.service */ "./src/tutorial/services/tutorial.service.ts");
const localization_service_1 = __webpack_require__(/*! ../services/localization.service */ "./src/tutorial/services/localization.service.ts");
const dto_1 = __webpack_require__(/*! ../dto */ "./src/tutorial/dto/index.ts");
let TutorialController = TutorialController_1 = class TutorialController {
    constructor(tutorialService, localizationService) {
        this.tutorialService = tutorialService;
        this.localizationService = localizationService;
        this.logger = new common_1.Logger(TutorialController_1.name);
    }
    async create(dto) {
        this.logger.log(`Creating tutorial: ${dto.name}`);
        return this.tutorialService.create(dto);
    }
    async findAll(filters) {
        this.logger.log(`Fetching tutorials with filters: ${JSON.stringify(filters)}`);
        return this.tutorialService.findAll(filters);
    }
    async getOnboardingCurriculum() {
        this.logger.log('Fetching onboarding curriculum');
        return this.tutorialService.getOnboardingCurriculum();
    }
    async getRecommendedTutorials(userId) {
        this.logger.log(`Fetching recommended tutorials for user: ${userId}`);
        return this.tutorialService.getRecommendedTutorials(userId);
    }
    async getTutorialsByMechanic(mechanic) {
        this.logger.log(`Fetching tutorials for mechanic: ${mechanic}`);
        return this.tutorialService.getTutorialsByMechanic(mechanic);
    }
    async findOne(id, locale) {
        this.logger.log(`Fetching tutorial: ${id}`);
        const tutorial = await this.tutorialService.findById(id);
        if (locale) {
            return this.localizationService.localizeTutorial(tutorial, locale);
        }
        return tutorial;
    }
    async update(id, dto) {
        this.logger.log(`Updating tutorial: ${id}`);
        return this.tutorialService.update(id, dto);
    }
    async delete(id) {
        this.logger.log(`Deleting tutorial: ${id}`);
        await this.tutorialService.delete(id);
    }
    async validatePrerequisites(id, userId) {
        this.logger.log(`Validating prerequisites for tutorial ${id} and user ${userId}`);
        return this.tutorialService.validatePrerequisites(userId, id);
    }
    async createStep(tutorialId, dto) {
        this.logger.log(`Creating step for tutorial: ${tutorialId}`);
        dto.tutorialId = tutorialId;
        return this.tutorialService.createStep(dto);
    }
    async getSteps(tutorialId, locale) {
        this.logger.log(`Fetching steps for tutorial: ${tutorialId}`);
        const steps = await this.tutorialService.getStepsByTutorial(tutorialId);
        if (locale) {
            return Promise.all(steps.map((step) => this.localizationService.localizeStep(step, locale)));
        }
        return steps;
    }
    async getStep(stepId, locale) {
        this.logger.log(`Fetching step: ${stepId}`);
        const step = await this.tutorialService.getStepById(stepId);
        if (locale) {
            return this.localizationService.localizeStep(step, locale);
        }
        return step;
    }
    async updateStep(stepId, dto) {
        this.logger.log(`Updating step: ${stepId}`);
        return this.tutorialService.updateStep(stepId, dto);
    }
    async deleteStep(stepId) {
        this.logger.log(`Deleting step: ${stepId}`);
        await this.tutorialService.deleteStep(stepId);
    }
    async reorderSteps(tutorialId, orders) {
        this.logger.log(`Reordering steps for tutorial: ${tutorialId}`);
        await this.tutorialService.reorderSteps(tutorialId, orders);
        return { message: 'Steps reordered successfully' };
    }
    async getSupportedLocales() {
        return this.localizationService.getSupportedLocales();
    }
    async importTranslations(locale, translations) {
        await this.localizationService.importTranslations(locale, translations);
        return { message: `Imported translations for locale: ${locale}` };
    }
    async getTranslations(locale) {
        return this.localizationService.getTranslationsForLocale(locale);
    }
    async validateTranslations(locale) {
        return this.localizationService.validateTranslations(locale);
    }
};
exports.TutorialController = TutorialController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof dto_1.CreateTutorialDto !== "undefined" && dto_1.CreateTutorialDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof dto_1.TutorialFilterDto !== "undefined" && dto_1.TutorialFilterDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('onboarding'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "getOnboardingCurriculum", null);
__decorate([
    (0, common_1.Get)('recommended/:userId'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "getRecommendedTutorials", null);
__decorate([
    (0, common_1.Get)('mechanic/:mechanic'),
    __param(0, (0, common_1.Param)('mechanic')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "getTutorialsByMechanic", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof dto_1.UpdateTutorialDto !== "undefined" && dto_1.UpdateTutorialDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':id/prerequisites/:userId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "validatePrerequisites", null);
__decorate([
    (0, common_1.Post)(':tutorialId/steps'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof dto_1.CreateTutorialStepDto !== "undefined" && dto_1.CreateTutorialStepDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "createStep", null);
__decorate([
    (0, common_1.Get)(':tutorialId/steps'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "getSteps", null);
__decorate([
    (0, common_1.Get)(':tutorialId/steps/:stepId'),
    __param(0, (0, common_1.Param)('stepId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "getStep", null);
__decorate([
    (0, common_1.Patch)(':tutorialId/steps/:stepId'),
    __param(0, (0, common_1.Param)('stepId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof dto_1.UpdateTutorialStepDto !== "undefined" && dto_1.UpdateTutorialStepDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "updateStep", null);
__decorate([
    (0, common_1.Delete)(':tutorialId/steps/:stepId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('stepId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "deleteStep", null);
__decorate([
    (0, common_1.Post)(':tutorialId/steps/reorder'),
    __param(0, (0, common_1.Param)('tutorialId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "reorderSteps", null);
__decorate([
    (0, common_1.Get)(':id/locales'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "getSupportedLocales", null);
__decorate([
    (0, common_1.Post)(':id/translations/:locale'),
    __param(0, (0, common_1.Param)('locale')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_h = typeof Record !== "undefined" && Record) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "importTranslations", null);
__decorate([
    (0, common_1.Get)(':id/translations/:locale'),
    __param(0, (0, common_1.Param)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "getTranslations", null);
__decorate([
    (0, common_1.Get)(':id/translations/:locale/validate'),
    __param(0, (0, common_1.Param)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TutorialController.prototype, "validateTranslations", null);
exports.TutorialController = TutorialController = TutorialController_1 = __decorate([
    (0, common_1.Controller)('tutorials'),
    __metadata("design:paramtypes", [typeof (_a = typeof tutorial_service_1.TutorialService !== "undefined" && tutorial_service_1.TutorialService) === "function" ? _a : Object, typeof (_b = typeof localization_service_1.LocalizationService !== "undefined" && localization_service_1.LocalizationService) === "function" ? _b : Object])
], TutorialController);


/***/ }),

/***/ "./src/tutorial/dto/analytics.dto.ts":
/*!*******************************************!*\
  !*** ./src/tutorial/dto/analytics.dto.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnalyticsExportFilterDto = exports.TutorialEffectivenessFilterDto = exports.TutorialAnalyticsFilterDto = exports.DateRangeDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
class DateRangeDto {
}
exports.DateRangeDto = DateRangeDto;
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], DateRangeDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], DateRangeDto.prototype, "endDate", void 0);
class TutorialAnalyticsFilterDto {
}
exports.TutorialAnalyticsFilterDto = TutorialAnalyticsFilterDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TutorialAnalyticsFilterDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TutorialAnalyticsFilterDto.prototype, "stepId", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], TutorialAnalyticsFilterDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], TutorialAnalyticsFilterDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TutorialAnalyticsFilterDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['day', 'week', 'month']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TutorialAnalyticsFilterDto.prototype, "groupBy", void 0);
class TutorialEffectivenessFilterDto {
}
exports.TutorialEffectivenessFilterDto = TutorialEffectivenessFilterDto;
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], TutorialEffectivenessFilterDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], TutorialEffectivenessFilterDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TutorialEffectivenessFilterDto.prototype, "includeStepBreakdown", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TutorialEffectivenessFilterDto.prototype, "includeDropOffAnalysis", void 0);
class AnalyticsExportFilterDto {
}
exports.AnalyticsExportFilterDto = AnalyticsExportFilterDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AnalyticsExportFilterDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], AnalyticsExportFilterDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_h = typeof Date !== "undefined" && Date) === "function" ? _h : Object)
], AnalyticsExportFilterDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['csv', 'json']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AnalyticsExportFilterDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AnalyticsExportFilterDto.prototype, "includeUserDetails", void 0);


/***/ }),

/***/ "./src/tutorial/dto/contextual-help.dto.ts":
/*!*************************************************!*\
  !*** ./src/tutorial/dto/contextual-help.dto.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RecordHelpInteractionDto = exports.TriggerContextualHelpDto = exports.ContextualHelpFilterDto = exports.UpdateContextualHelpDto = exports.CreateContextualHelpDto = exports.DisplayRulesDto = exports.TriggerConditionsDto = exports.HelpContentDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const contextual_help_entity_1 = __webpack_require__(/*! ../entities/contextual-help.entity */ "./src/tutorial/entities/contextual-help.entity.ts");
const contextual_help_interaction_entity_1 = __webpack_require__(/*! ../entities/contextual-help-interaction.entity */ "./src/tutorial/entities/contextual-help-interaction.entity.ts");
class HelpContentDto {
}
exports.HelpContentDto = HelpContentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], HelpContentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], HelpContentDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['tooltip', 'modal', 'overlay', 'sidebar', 'banner']),
    __metadata("design:type", typeof (_a = typeof contextual_help_entity_1.HelpDisplayType !== "undefined" && contextual_help_entity_1.HelpDisplayType) === "function" ? _a : Object)
], HelpContentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], HelpContentDto.prototype, "media", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof Array !== "undefined" && Array) === "function" ? _b : Object)
], HelpContentDto.prototype, "actions", void 0);
class TriggerConditionsDto {
}
exports.TriggerConditionsDto = TriggerConditionsDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TriggerConditionsDto.prototype, "minAttempts", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TriggerConditionsDto.prototype, "maxAttempts", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TriggerConditionsDto.prototype, "timeThreshold", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], TriggerConditionsDto.prototype, "errorPatterns", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TriggerConditionsDto.prototype, "userLevel", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TriggerConditionsDto.prototype, "hasCompletedTutorial", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TriggerConditionsDto.prototype, "tutorialId", void 0);
class DisplayRulesDto {
}
exports.DisplayRulesDto = DisplayRulesDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], DisplayRulesDto.prototype, "maxShowCount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], DisplayRulesDto.prototype, "cooldownSeconds", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DisplayRulesDto.prototype, "showOnce", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DisplayRulesDto.prototype, "dismissable", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], DisplayRulesDto.prototype, "autoHideAfter", void 0);
class CreateContextualHelpDto {
}
exports.CreateContextualHelpDto = CreateContextualHelpDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateContextualHelpDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)([
        'puzzle_start',
        'hint_needed',
        'repeated_failure',
        'first_visit',
        'feature_discovery',
        'idle_timeout',
        'achievement_near',
        'custom',
    ]),
    __metadata("design:type", typeof (_c = typeof contextual_help_entity_1.TriggerContext !== "undefined" && contextual_help_entity_1.TriggerContext) === "function" ? _c : Object)
], CreateContextualHelpDto.prototype, "triggerContext", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContextualHelpDto.prototype, "targetFeature", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContextualHelpDto.prototype, "targetPuzzleType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateContextualHelpDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => HelpContentDto),
    __metadata("design:type", HelpContentDto)
], CreateContextualHelpDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TriggerConditionsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", TriggerConditionsDto)
], CreateContextualHelpDto.prototype, "triggerConditions", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DisplayRulesDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", DisplayRulesDto)
], CreateContextualHelpDto.prototype, "displayRules", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateContextualHelpDto.prototype, "isActive", void 0);
class UpdateContextualHelpDto extends (0, mapped_types_1.PartialType)(CreateContextualHelpDto) {
}
exports.UpdateContextualHelpDto = UpdateContextualHelpDto;
class ContextualHelpFilterDto {
}
exports.ContextualHelpFilterDto = ContextualHelpFilterDto;
__decorate([
    (0, class_validator_1.IsEnum)([
        'puzzle_start',
        'hint_needed',
        'repeated_failure',
        'first_visit',
        'feature_discovery',
        'idle_timeout',
        'achievement_near',
        'custom',
    ]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_d = typeof contextual_help_entity_1.TriggerContext !== "undefined" && contextual_help_entity_1.TriggerContext) === "function" ? _d : Object)
], ContextualHelpFilterDto.prototype, "triggerContext", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ContextualHelpFilterDto.prototype, "targetFeature", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ContextualHelpFilterDto.prototype, "targetPuzzleType", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ContextualHelpFilterDto.prototype, "isActive", void 0);
class TriggerContextualHelpDto {
}
exports.TriggerContextualHelpDto = TriggerContextualHelpDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TriggerContextualHelpDto.prototype, "context", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TriggerContextualHelpDto.prototype, "puzzleId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TriggerContextualHelpDto.prototype, "puzzleType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TriggerContextualHelpDto.prototype, "feature", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TriggerContextualHelpDto.prototype, "attempts", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TriggerContextualHelpDto.prototype, "timeSpent", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], TriggerContextualHelpDto.prototype, "recentErrors", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TriggerContextualHelpDto.prototype, "userLevel", void 0);
class RecordHelpInteractionDto {
}
exports.RecordHelpInteractionDto = RecordHelpInteractionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RecordHelpInteractionDto.prototype, "helpId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['shown', 'dismissed', 'clicked', 'completed', 'auto_hidden']),
    __metadata("design:type", typeof (_e = typeof contextual_help_interaction_entity_1.InteractionAction !== "undefined" && contextual_help_interaction_entity_1.InteractionAction) === "function" ? _e : Object)
], RecordHelpInteractionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RecordHelpInteractionDto.prototype, "viewDuration", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordHelpInteractionDto.prototype, "actionTaken", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], RecordHelpInteractionDto.prototype, "context", void 0);


/***/ }),

/***/ "./src/tutorial/dto/index.ts":
/*!***********************************!*\
  !*** ./src/tutorial/dto/index.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
__exportStar(__webpack_require__(/*! ./tutorial.dto */ "./src/tutorial/dto/tutorial.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./progress.dto */ "./src/tutorial/dto/progress.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./contextual-help.dto */ "./src/tutorial/dto/contextual-help.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./analytics.dto */ "./src/tutorial/dto/analytics.dto.ts"), exports);


/***/ }),

/***/ "./src/tutorial/dto/progress.dto.ts":
/*!******************************************!*\
  !*** ./src/tutorial/dto/progress.dto.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserProgressFilterDto = exports.CompleteTutorialDto = exports.SaveCheckpointDto = exports.ResumeTutorialDto = exports.SkipStepDto = exports.SkipTutorialDto = exports.UpdateStepProgressDto = exports.StartTutorialDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const user_tutorial_progress_entity_1 = __webpack_require__(/*! ../entities/user-tutorial-progress.entity */ "./src/tutorial/entities/user-tutorial-progress.entity.ts");
class StartTutorialDto {
}
exports.StartTutorialDto = StartTutorialDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StartTutorialDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StartTutorialDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], StartTutorialDto.prototype, "resumeFromCheckpoint", void 0);
class UpdateStepProgressDto {
}
exports.UpdateStepProgressDto = UpdateStepProgressDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateStepProgressDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateStepProgressDto.prototype, "stepId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['in_progress', 'completed', 'skipped', 'failed']),
    __metadata("design:type", typeof (_a = typeof user_tutorial_progress_entity_1.StepProgressStatus !== "undefined" && user_tutorial_progress_entity_1.StepProgressStatus) === "function" ? _a : Object)
], UpdateStepProgressDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateStepProgressDto.prototype, "timeSpent", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateStepProgressDto.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateStepProgressDto.prototype, "hintsUsed", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateStepProgressDto.prototype, "errors", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateStepProgressDto.prototype, "interactiveResult", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateStepProgressDto.prototype, "saveState", void 0);
class SkipTutorialDto {
}
exports.SkipTutorialDto = SkipTutorialDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SkipTutorialDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SkipTutorialDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SkipTutorialDto.prototype, "confirmSkip", void 0);
class SkipStepDto {
}
exports.SkipStepDto = SkipStepDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SkipStepDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SkipStepDto.prototype, "stepId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SkipStepDto.prototype, "reason", void 0);
class ResumeTutorialDto {
}
exports.ResumeTutorialDto = ResumeTutorialDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ResumeTutorialDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ResumeTutorialDto.prototype, "fromStepId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ResumeTutorialDto.prototype, "fromCheckpoint", void 0);
class SaveCheckpointDto {
}
exports.SaveCheckpointDto = SaveCheckpointDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SaveCheckpointDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SaveCheckpointDto.prototype, "stepId", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SaveCheckpointDto.prototype, "state", void 0);
class CompleteTutorialDto {
}
exports.CompleteTutorialDto = CompleteTutorialDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CompleteTutorialDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CompleteTutorialDto.prototype, "finalScore", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CompleteTutorialDto.prototype, "feedback", void 0);
class UserProgressFilterDto {
}
exports.UserProgressFilterDto = UserProgressFilterDto;
__decorate([
    (0, class_validator_1.IsEnum)(['not_started', 'in_progress', 'completed', 'skipped', 'abandoned']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserProgressFilterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserProgressFilterDto.prototype, "tutorialId", void 0);


/***/ }),

/***/ "./src/tutorial/dto/tutorial.dto.ts":
/*!******************************************!*\
  !*** ./src/tutorial/dto/tutorial.dto.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReorderStepsDto = exports.StepOrderDto = exports.UpdateTutorialStepDto = exports.CreateTutorialStepDto = exports.StepAccessibilityDto = exports.AdaptivePacingDto = exports.CompletionCriteriaDto = exports.InteractiveConfigDto = exports.StepContentDto = exports.TutorialFilterDto = exports.UpdateTutorialDto = exports.CreateTutorialDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const tutorial_entity_1 = __webpack_require__(/*! ../entities/tutorial.entity */ "./src/tutorial/entities/tutorial.entity.ts");
const tutorial_step_entity_1 = __webpack_require__(/*! ../entities/tutorial-step.entity */ "./src/tutorial/entities/tutorial-step.entity.ts");
class CreateTutorialDto {
}
exports.CreateTutorialDto = CreateTutorialDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateTutorialDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], CreateTutorialDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['onboarding', 'mechanic', 'advanced', 'refresher']),
    __metadata("design:type", typeof (_a = typeof tutorial_entity_1.TutorialType !== "undefined" && tutorial_entity_1.TutorialType) === "function" ? _a : Object)
], CreateTutorialDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateTutorialDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['beginner', 'easy', 'medium', 'hard', 'expert']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof tutorial_entity_1.DifficultyLevel !== "undefined" && tutorial_entity_1.DifficultyLevel) === "function" ? _b : Object)
], CreateTutorialDto.prototype, "difficultyLevel", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTutorialDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTutorialDto.prototype, "estimatedDurationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(4, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTutorialDto.prototype, "prerequisites", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTutorialDto.prototype, "targetMechanics", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateTutorialDto.prototype, "isSkippable", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateTutorialDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_c = typeof tutorial_entity_1.TutorialMetadata !== "undefined" && tutorial_entity_1.TutorialMetadata) === "function" ? _c : Object)
], CreateTutorialDto.prototype, "metadata", void 0);
class UpdateTutorialDto extends (0, mapped_types_1.PartialType)(CreateTutorialDto) {
}
exports.UpdateTutorialDto = UpdateTutorialDto;
class TutorialFilterDto {
}
exports.TutorialFilterDto = TutorialFilterDto;
__decorate([
    (0, class_validator_1.IsEnum)(['onboarding', 'mechanic', 'advanced', 'refresher']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_d = typeof tutorial_entity_1.TutorialType !== "undefined" && tutorial_entity_1.TutorialType) === "function" ? _d : Object)
], TutorialFilterDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TutorialFilterDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['beginner', 'easy', 'medium', 'hard', 'expert']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_e = typeof tutorial_entity_1.DifficultyLevel !== "undefined" && tutorial_entity_1.DifficultyLevel) === "function" ? _e : Object)
], TutorialFilterDto.prototype, "difficultyLevel", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TutorialFilterDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TutorialFilterDto.prototype, "targetMechanic", void 0);
class StepContentDto {
}
exports.StepContentDto = StepContentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], StepContentDto.prototype, "instructions", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], StepContentDto.prototype, "richContent", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], StepContentDto.prototype, "media", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_f = typeof Array !== "undefined" && Array) === "function" ? _f : Object)
], StepContentDto.prototype, "highlights", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_g = typeof Array !== "undefined" && Array) === "function" ? _g : Object)
], StepContentDto.prototype, "tooltips", void 0);
class InteractiveConfigDto {
}
exports.InteractiveConfigDto = InteractiveConfigDto;
__decorate([
    (0, class_validator_1.IsEnum)(['drag-drop', 'click-sequence', 'input', 'selection', 'puzzle-mini']),
    __metadata("design:type", String)
], InteractiveConfigDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", typeof (_h = typeof Record !== "undefined" && Record) === "function" ? _h : Object)
], InteractiveConfigDto.prototype, "config", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], InteractiveConfigDto.prototype, "expectedOutcome", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], InteractiveConfigDto.prototype, "hints", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InteractiveConfigDto.prototype, "maxAttempts", void 0);
class CompletionCriteriaDto {
}
exports.CompletionCriteriaDto = CompletionCriteriaDto;
__decorate([
    (0, class_validator_1.IsEnum)(['auto', 'action', 'quiz', 'time', 'manual']),
    __metadata("design:type", String)
], CompletionCriteriaDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_j = typeof Array !== "undefined" && Array) === "function" ? _j : Object)
], CompletionCriteriaDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CompletionCriteriaDto.prototype, "minimumScore", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CompletionCriteriaDto.prototype, "requiredActions", void 0);
class AdaptivePacingDto {
}
exports.AdaptivePacingDto = AdaptivePacingDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdaptivePacingDto.prototype, "minTimeOnStep", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AdaptivePacingDto.prototype, "skipIfProficient", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdaptivePacingDto.prototype, "proficiencyThreshold", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdaptivePacingDto.prototype, "repeatIfStrugglingThreshold", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AdaptivePacingDto.prototype, "adaptiveHints", void 0);
class StepAccessibilityDto {
}
exports.StepAccessibilityDto = StepAccessibilityDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StepAccessibilityDto.prototype, "ariaLabel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StepAccessibilityDto.prototype, "screenReaderText", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_k = typeof Record !== "undefined" && Record) === "function" ? _k : Object)
], StepAccessibilityDto.prototype, "keyboardShortcuts", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], StepAccessibilityDto.prototype, "reducedMotionAlternative", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], StepAccessibilityDto.prototype, "highContrastSupport", void 0);
class CreateTutorialStepDto {
}
exports.CreateTutorialStepDto = CreateTutorialStepDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTutorialStepDto.prototype, "tutorialId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateTutorialStepDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateTutorialStepDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['instruction', 'interactive', 'practice', 'quiz', 'demonstration', 'checkpoint']),
    __metadata("design:type", typeof (_l = typeof tutorial_step_entity_1.StepType !== "undefined" && tutorial_step_entity_1.StepType) === "function" ? _l : Object)
], CreateTutorialStepDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StepContentDto),
    __metadata("design:type", StepContentDto)
], CreateTutorialStepDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InteractiveConfigDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", InteractiveConfigDto)
], CreateTutorialStepDto.prototype, "interactive", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CompletionCriteriaDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CompletionCriteriaDto)
], CreateTutorialStepDto.prototype, "completionCriteria", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AdaptivePacingDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", AdaptivePacingDto)
], CreateTutorialStepDto.prototype, "adaptivePacing", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StepAccessibilityDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", StepAccessibilityDto)
], CreateTutorialStepDto.prototype, "accessibility", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateTutorialStepDto.prototype, "isOptional", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateTutorialStepDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTutorialStepDto.prototype, "timeLimit", void 0);
class UpdateTutorialStepDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(CreateTutorialStepDto, ['tutorialId'])) {
}
exports.UpdateTutorialStepDto = UpdateTutorialStepDto;
class StepOrderDto {
}
exports.StepOrderDto = StepOrderDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StepOrderDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], StepOrderDto.prototype, "order", void 0);
class ReorderStepsDto {
}
exports.ReorderStepsDto = ReorderStepsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StepOrderDto),
    __metadata("design:type", Array)
], ReorderStepsDto.prototype, "orders", void 0);


/***/ }),

/***/ "./src/tutorial/entities/contextual-help-interaction.entity.ts":
/*!*********************************************************************!*\
  !*** ./src/tutorial/entities/contextual-help-interaction.entity.ts ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ContextualHelpInteraction = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const contextual_help_entity_1 = __webpack_require__(/*! ./contextual-help.entity */ "./src/tutorial/entities/contextual-help.entity.ts");
let ContextualHelpInteraction = class ContextualHelpInteraction {
};
exports.ContextualHelpInteraction = ContextualHelpInteraction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContextualHelpInteraction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ContextualHelpInteraction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ContextualHelpInteraction.prototype, "helpId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ContextualHelpInteraction.prototype, "triggerContext", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], ContextualHelpInteraction.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ContextualHelpInteraction.prototype, "viewDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ContextualHelpInteraction.prototype, "actionTaken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ContextualHelpInteraction.prototype, "context", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], ContextualHelpInteraction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => contextual_help_entity_1.ContextualHelp, (help) => help.interactions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'helpId' }),
    __metadata("design:type", typeof (_b = typeof contextual_help_entity_1.ContextualHelp !== "undefined" && contextual_help_entity_1.ContextualHelp) === "function" ? _b : Object)
], ContextualHelpInteraction.prototype, "help", void 0);
exports.ContextualHelpInteraction = ContextualHelpInteraction = __decorate([
    (0, typeorm_1.Entity)('contextual_help_interactions'),
    (0, typeorm_1.Index)(['userId', 'helpId']),
    (0, typeorm_1.Index)(['userId', 'triggerContext']),
    (0, typeorm_1.Index)(['helpId', 'action'])
], ContextualHelpInteraction);


/***/ }),

/***/ "./src/tutorial/entities/contextual-help.entity.ts":
/*!*********************************************************!*\
  !*** ./src/tutorial/entities/contextual-help.entity.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ContextualHelp = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const contextual_help_interaction_entity_1 = __webpack_require__(/*! ./contextual-help-interaction.entity */ "./src/tutorial/entities/contextual-help-interaction.entity.ts");
let ContextualHelp = class ContextualHelp {
};
exports.ContextualHelp = ContextualHelp;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContextualHelp.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ContextualHelp.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ContextualHelp.prototype, "triggerContext", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ContextualHelp.prototype, "targetFeature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ContextualHelp.prototype, "targetPuzzleType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ContextualHelp.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ContextualHelp.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], ContextualHelp.prototype, "triggerConditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], ContextualHelp.prototype, "displayRules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], ContextualHelp.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], ContextualHelp.prototype, "localization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], ContextualHelp.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], ContextualHelp.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], ContextualHelp.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => contextual_help_interaction_entity_1.ContextualHelpInteraction, (interaction) => interaction.help),
    __metadata("design:type", Array)
], ContextualHelp.prototype, "interactions", void 0);
exports.ContextualHelp = ContextualHelp = __decorate([
    (0, typeorm_1.Entity)('contextual_help'),
    (0, typeorm_1.Index)(['triggerContext', 'isActive']),
    (0, typeorm_1.Index)(['targetFeature']),
    (0, typeorm_1.Index)(['targetPuzzleType'])
], ContextualHelp);


/***/ }),

/***/ "./src/tutorial/entities/index.ts":
/*!****************************************!*\
  !*** ./src/tutorial/entities/index.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
__exportStar(__webpack_require__(/*! ./tutorial.entity */ "./src/tutorial/entities/tutorial.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./tutorial-step.entity */ "./src/tutorial/entities/tutorial-step.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./user-tutorial-progress.entity */ "./src/tutorial/entities/user-tutorial-progress.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./contextual-help.entity */ "./src/tutorial/entities/contextual-help.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./contextual-help-interaction.entity */ "./src/tutorial/entities/contextual-help-interaction.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./tutorial-analytics-event.entity */ "./src/tutorial/entities/tutorial-analytics-event.entity.ts"), exports);


/***/ }),

/***/ "./src/tutorial/entities/tutorial-analytics-event.entity.ts":
/*!******************************************************************!*\
  !*** ./src/tutorial/entities/tutorial-analytics-event.entity.ts ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialAnalyticsEvent = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let TutorialAnalyticsEvent = class TutorialAnalyticsEvent {
};
exports.TutorialAnalyticsEvent = TutorialAnalyticsEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TutorialAnalyticsEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TutorialAnalyticsEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TutorialAnalyticsEvent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TutorialAnalyticsEvent.prototype, "tutorialId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TutorialAnalyticsEvent.prototype, "stepId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TutorialAnalyticsEvent.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], TutorialAnalyticsEvent.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TutorialAnalyticsEvent.prototype, "createdAt", void 0);
exports.TutorialAnalyticsEvent = TutorialAnalyticsEvent = __decorate([
    (0, typeorm_1.Entity)('tutorial_analytics_events'),
    (0, typeorm_1.Index)(['eventType', 'createdAt']),
    (0, typeorm_1.Index)(['userId', 'tutorialId']),
    (0, typeorm_1.Index)(['tutorialId', 'stepId']),
    (0, typeorm_1.Index)(['sessionId'])
], TutorialAnalyticsEvent);


/***/ }),

/***/ "./src/tutorial/entities/tutorial-step.entity.ts":
/*!*******************************************************!*\
  !*** ./src/tutorial/entities/tutorial-step.entity.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialStep = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const tutorial_entity_1 = __webpack_require__(/*! ./tutorial.entity */ "./src/tutorial/entities/tutorial.entity.ts");
let TutorialStep = class TutorialStep {
};
exports.TutorialStep = TutorialStep;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TutorialStep.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TutorialStep.prototype, "tutorialId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TutorialStep.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TutorialStep.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], TutorialStep.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TutorialStep.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TutorialStep.prototype, "isOptional", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], TutorialStep.prototype, "timeLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], TutorialStep.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TutorialStep.prototype, "interactive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TutorialStep.prototype, "completionCriteria", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TutorialStep.prototype, "adaptivePacing", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TutorialStep.prototype, "localization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TutorialStep.prototype, "accessibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], TutorialStep.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TutorialStep.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TutorialStep.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tutorial_entity_1.Tutorial, (tutorial) => tutorial.steps, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tutorialId' }),
    __metadata("design:type", typeof (_c = typeof tutorial_entity_1.Tutorial !== "undefined" && tutorial_entity_1.Tutorial) === "function" ? _c : Object)
], TutorialStep.prototype, "tutorial", void 0);
exports.TutorialStep = TutorialStep = __decorate([
    (0, typeorm_1.Entity)('tutorial_steps'),
    (0, typeorm_1.Index)(['tutorialId', 'order']),
    (0, typeorm_1.Index)(['type', 'isActive'])
], TutorialStep);


/***/ }),

/***/ "./src/tutorial/entities/tutorial.entity.ts":
/*!**************************************************!*\
  !*** ./src/tutorial/entities/tutorial.entity.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Tutorial = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const tutorial_step_entity_1 = __webpack_require__(/*! ./tutorial-step.entity */ "./src/tutorial/entities/tutorial-step.entity.ts");
const user_tutorial_progress_entity_1 = __webpack_require__(/*! ./user-tutorial-progress.entity */ "./src/tutorial/entities/user-tutorial-progress.entity.ts");
let Tutorial = class Tutorial {
};
exports.Tutorial = Tutorial;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Tutorial.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Tutorial.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Tutorial.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'onboarding' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Tutorial.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Tutorial.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'easy' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Tutorial.prototype, "difficultyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Tutorial.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Tutorial.prototype, "estimatedDurationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: '' }),
    __metadata("design:type", Array)
], Tutorial.prototype, "prerequisites", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: '' }),
    __metadata("design:type", Array)
], Tutorial.prototype, "targetMechanics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], Tutorial.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Tutorial.prototype, "isSkippable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Tutorial.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Tutorial.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Tutorial.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Tutorial.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Tutorial.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => tutorial_step_entity_1.TutorialStep, (step) => step.tutorial),
    __metadata("design:type", Array)
], Tutorial.prototype, "steps", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_tutorial_progress_entity_1.UserTutorialProgress, (progress) => progress.tutorial),
    __metadata("design:type", Array)
], Tutorial.prototype, "userProgress", void 0);
exports.Tutorial = Tutorial = __decorate([
    (0, typeorm_1.Entity)('tutorials'),
    (0, typeorm_1.Index)(['type', 'isActive']),
    (0, typeorm_1.Index)(['difficultyLevel', 'order']),
    (0, typeorm_1.Index)(['category'])
], Tutorial);


/***/ }),

/***/ "./src/tutorial/entities/user-tutorial-progress.entity.ts":
/*!****************************************************************!*\
  !*** ./src/tutorial/entities/user-tutorial-progress.entity.ts ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserTutorialProgress = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const tutorial_entity_1 = __webpack_require__(/*! ./tutorial.entity */ "./src/tutorial/entities/tutorial.entity.ts");
let UserTutorialProgress = class UserTutorialProgress {
};
exports.UserTutorialProgress = UserTutorialProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserTutorialProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserTutorialProgress.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserTutorialProgress.prototype, "tutorialId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'not_started' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserTutorialProgress.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserTutorialProgress.prototype, "currentStepOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], UserTutorialProgress.prototype, "currentStepId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserTutorialProgress.prototype, "completedSteps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserTutorialProgress.prototype, "totalSteps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], UserTutorialProgress.prototype, "progressPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserTutorialProgress.prototype, "totalTimeSpent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], UserTutorialProgress.prototype, "overallScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], UserTutorialProgress.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], UserTutorialProgress.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], UserTutorialProgress.prototype, "lastActivityAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], UserTutorialProgress.prototype, "stepProgress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: { learningSpeed: 'normal', proficiencyLevel: 0 } }),
    __metadata("design:type", Object)
], UserTutorialProgress.prototype, "adaptiveState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserTutorialProgress.prototype, "sessionData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], UserTutorialProgress.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], UserTutorialProgress.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], UserTutorialProgress.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tutorial_entity_1.Tutorial, (tutorial) => tutorial.userProgress, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tutorialId' }),
    __metadata("design:type", typeof (_f = typeof tutorial_entity_1.Tutorial !== "undefined" && tutorial_entity_1.Tutorial) === "function" ? _f : Object)
], UserTutorialProgress.prototype, "tutorial", void 0);
exports.UserTutorialProgress = UserTutorialProgress = __decorate([
    (0, typeorm_1.Entity)('user_tutorial_progress'),
    (0, typeorm_1.Index)(['userId', 'tutorialId'], { unique: true }),
    (0, typeorm_1.Index)(['userId', 'status']),
    (0, typeorm_1.Index)(['tutorialId', 'status'])
], UserTutorialProgress);


/***/ }),

/***/ "./src/tutorial/services/contextual-help.service.ts":
/*!**********************************************************!*\
  !*** ./src/tutorial/services/contextual-help.service.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ContextualHelpService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ContextualHelpService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const contextual_help_entity_1 = __webpack_require__(/*! ../entities/contextual-help.entity */ "./src/tutorial/entities/contextual-help.entity.ts");
const contextual_help_interaction_entity_1 = __webpack_require__(/*! ../entities/contextual-help-interaction.entity */ "./src/tutorial/entities/contextual-help-interaction.entity.ts");
let ContextualHelpService = ContextualHelpService_1 = class ContextualHelpService {
    constructor(helpRepo, interactionRepo) {
        this.helpRepo = helpRepo;
        this.interactionRepo = interactionRepo;
        this.logger = new common_1.Logger(ContextualHelpService_1.name);
    }
    async create(dto) {
        const help = this.helpRepo.create({
            ...dto,
            triggerConditions: dto.triggerConditions || {},
            displayRules: dto.displayRules || {},
            localization: {},
            analytics: {},
        });
        const saved = await this.helpRepo.save(help);
        this.logger.log(`Created contextual help: ${saved.id} - ${saved.name}`);
        return saved;
    }
    async findById(id) {
        const help = await this.helpRepo.findOne({ where: { id } });
        if (!help) {
            throw new common_1.NotFoundException(`Contextual help not found: ${id}`);
        }
        return help;
    }
    async findAll(filters) {
        const query = this.helpRepo.createQueryBuilder('help');
        if (filters?.triggerContext) {
            query.andWhere('help.triggerContext = :triggerContext', {
                triggerContext: filters.triggerContext,
            });
        }
        if (filters?.targetFeature) {
            query.andWhere('help.targetFeature = :targetFeature', {
                targetFeature: filters.targetFeature,
            });
        }
        if (filters?.targetPuzzleType) {
            query.andWhere('help.targetPuzzleType = :targetPuzzleType', {
                targetPuzzleType: filters.targetPuzzleType,
            });
        }
        if (filters?.isActive !== undefined) {
            query.andWhere('help.isActive = :isActive', { isActive: filters.isActive });
        }
        query.orderBy('help.priority', 'DESC');
        return query.getMany();
    }
    async update(id, dto) {
        const help = await this.findById(id);
        Object.assign(help, dto);
        const updated = await this.helpRepo.save(help);
        this.logger.log(`Updated contextual help: ${id}`);
        return updated;
    }
    async delete(id) {
        const help = await this.findById(id);
        await this.helpRepo.remove(help);
        this.logger.log(`Deleted contextual help: ${id}`);
    }
    async triggerHelp(userId, dto) {
        const applicable = await this.getApplicableHelp(userId, dto);
        if (applicable.length === 0) {
            return null;
        }
        for (const help of applicable) {
            if (await this.shouldShowHelp(userId, help.id)) {
                await this.recordInteraction(userId, {
                    helpId: help.id,
                    action: 'shown',
                    context: {
                        puzzleId: dto.puzzleId,
                    },
                });
                await this.updateHelpAnalytics(help.id, 'shown');
                return help;
            }
        }
        return null;
    }
    async getApplicableHelp(userId, dto) {
        const query = this.helpRepo
            .createQueryBuilder('help')
            .where('help.isActive = true')
            .andWhere('help.triggerContext = :context', { context: dto.context });
        if (dto.feature) {
            query.andWhere('(help.targetFeature IS NULL OR help.targetFeature = :feature)', {
                feature: dto.feature,
            });
        }
        if (dto.puzzleType) {
            query.andWhere('(help.targetPuzzleType IS NULL OR help.targetPuzzleType = :puzzleType)', {
                puzzleType: dto.puzzleType,
            });
        }
        const candidates = await query.orderBy('help.priority', 'DESC').getMany();
        const filtered = candidates.filter((help) => this.checkTriggerConditions(help, dto));
        return filtered;
    }
    async shouldShowHelp(userId, helpId) {
        const help = await this.findById(helpId);
        const rules = help.displayRules;
        if (rules.showOnce) {
            const shown = await this.interactionRepo.findOne({
                where: { userId, helpId, action: 'shown' },
            });
            if (shown)
                return false;
        }
        if (rules.maxShowCount) {
            const showCount = await this.getShowCount(userId, helpId);
            if (showCount >= rules.maxShowCount)
                return false;
        }
        if (rules.cooldownSeconds) {
            const lastShown = await this.getLastShownTime(userId, helpId);
            if (lastShown) {
                const cooldownEnd = new Date(lastShown.getTime() + rules.cooldownSeconds * 1000);
                if (new Date() < cooldownEnd)
                    return false;
            }
        }
        return true;
    }
    checkTriggerConditions(help, dto) {
        const conditions = help.triggerConditions;
        if (conditions.minAttempts !== undefined && dto.attempts !== undefined) {
            if (dto.attempts < conditions.minAttempts)
                return false;
        }
        if (conditions.maxAttempts !== undefined && dto.attempts !== undefined) {
            if (dto.attempts > conditions.maxAttempts)
                return false;
        }
        if (conditions.timeThreshold !== undefined && dto.timeSpent !== undefined) {
            if (dto.timeSpent < conditions.timeThreshold)
                return false;
        }
        if (conditions.userLevel && dto.userLevel !== undefined) {
            if (conditions.userLevel.min !== undefined && dto.userLevel < conditions.userLevel.min) {
                return false;
            }
            if (conditions.userLevel.max !== undefined && dto.userLevel > conditions.userLevel.max) {
                return false;
            }
        }
        if (conditions.errorPatterns && dto.recentErrors) {
            const hasMatchingError = conditions.errorPatterns.some((pattern) => dto.recentErrors.some((error) => error.includes(pattern)));
            if (!hasMatchingError)
                return false;
        }
        return true;
    }
    async recordInteraction(userId, dto) {
        const help = await this.findById(dto.helpId);
        const interaction = this.interactionRepo.create({
            userId,
            helpId: dto.helpId,
            triggerContext: help.triggerContext,
            action: dto.action,
            viewDuration: dto.viewDuration,
            actionTaken: dto.actionTaken,
            context: dto.context,
        });
        await this.interactionRepo.save(interaction);
        await this.updateHelpAnalytics(dto.helpId, dto.action);
    }
    async getUserHelpHistory(userId, helpId) {
        const where = { userId };
        if (helpId) {
            where.helpId = helpId;
        }
        return this.interactionRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    async getShowCount(userId, helpId) {
        return this.interactionRepo.count({
            where: { userId, helpId, action: 'shown' },
        });
    }
    async getLastShownTime(userId, helpId) {
        const interaction = await this.interactionRepo.findOne({
            where: { userId, helpId, action: 'shown' },
            order: { createdAt: 'DESC' },
        });
        return interaction?.createdAt || null;
    }
    async getHelpForPuzzleStart(userId, puzzleType) {
        return this.triggerHelp(userId, {
            context: 'puzzle_start',
            puzzleType,
        });
    }
    async getHelpForRepeatedFailure(userId, puzzleId, attempts) {
        return this.triggerHelp(userId, {
            context: 'repeated_failure',
            puzzleId,
            attempts,
        });
    }
    async getHelpForFeature(userId, feature) {
        return this.triggerHelp(userId, {
            context: 'feature_discovery',
            feature,
        });
    }
    async updateHelpAnalytics(helpId, action) {
        const help = await this.findById(helpId);
        const analytics = help.analytics || {};
        if (action === 'shown') {
            analytics.totalShown = (analytics.totalShown || 0) + 1;
        }
        if (action === 'dismissed') {
            const totalShown = analytics.totalShown || 1;
            const dismissed = await this.interactionRepo.count({
                where: { helpId, action: 'dismissed' },
            });
            analytics.dismissRate = dismissed / totalShown;
        }
        if (action === 'clicked' || action === 'completed') {
            const totalShown = analytics.totalShown || 1;
            const actioned = await this.interactionRepo.count({
                where: { helpId, action: 'clicked' },
            });
            analytics.actionTakenRate = actioned / totalShown;
        }
        await this.helpRepo.update(helpId, { analytics });
    }
};
exports.ContextualHelpService = ContextualHelpService;
exports.ContextualHelpService = ContextualHelpService = ContextualHelpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contextual_help_entity_1.ContextualHelp)),
    __param(1, (0, typeorm_1.InjectRepository)(contextual_help_interaction_entity_1.ContextualHelpInteraction)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], ContextualHelpService);


/***/ }),

/***/ "./src/tutorial/services/index.ts":
/*!****************************************!*\
  !*** ./src/tutorial/services/index.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
__exportStar(__webpack_require__(/*! ./tutorial.service */ "./src/tutorial/services/tutorial.service.ts"), exports);
__exportStar(__webpack_require__(/*! ./tutorial-progress.service */ "./src/tutorial/services/tutorial-progress.service.ts"), exports);
__exportStar(__webpack_require__(/*! ./contextual-help.service */ "./src/tutorial/services/contextual-help.service.ts"), exports);
__exportStar(__webpack_require__(/*! ./tutorial-analytics.service */ "./src/tutorial/services/tutorial-analytics.service.ts"), exports);
__exportStar(__webpack_require__(/*! ./localization.service */ "./src/tutorial/services/localization.service.ts"), exports);


/***/ }),

/***/ "./src/tutorial/services/localization.service.ts":
/*!*******************************************************!*\
  !*** ./src/tutorial/services/localization.service.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var LocalizationService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LocalizationService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let LocalizationService = LocalizationService_1 = class LocalizationService {
    constructor() {
        this.logger = new common_1.Logger(LocalizationService_1.name);
        this.translations = new Map();
        this.supportedLocales = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'pt', 'ru', 'ar'];
        this.defaultLocale = 'en';
        this.translations.set('en', new Map());
    }
    async getTranslation(key, locale, params) {
        const localeTranslations = this.translations.get(locale);
        let translation = localeTranslations?.get(key);
        if (!translation && locale !== this.defaultLocale) {
            const defaultTranslations = this.translations.get(this.defaultLocale);
            translation = defaultTranslations?.get(key);
        }
        if (!translation) {
            this.logger.warn(`Missing translation for key: ${key} in locale: ${locale}`);
            return key;
        }
        if (params) {
            Object.entries(params).forEach(([param, value]) => {
                translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
            });
        }
        return translation;
    }
    async setTranslation(key, locale, value) {
        if (!this.translations.has(locale)) {
            this.translations.set(locale, new Map());
        }
        this.translations.get(locale).set(key, value);
    }
    async getTranslationsForLocale(locale) {
        const localeTranslations = this.translations.get(locale);
        if (!localeTranslations) {
            return {};
        }
        return Object.fromEntries(localeTranslations);
    }
    async importTranslations(locale, translations) {
        if (!this.translations.has(locale)) {
            this.translations.set(locale, new Map());
        }
        const localeMap = this.translations.get(locale);
        Object.entries(translations).forEach(([key, value]) => {
            localeMap.set(key, value);
        });
        this.logger.log(`Imported ${Object.keys(translations).length} translations for locale: ${locale}`);
    }
    async exportTranslations(locale) {
        return this.getTranslationsForLocale(locale);
    }
    async getSupportedLocales() {
        return this.supportedLocales;
    }
    async addLocale(locale) {
        if (!this.supportedLocales.includes(locale)) {
            this.supportedLocales.push(locale);
            this.translations.set(locale, new Map());
            this.logger.log(`Added new locale: ${locale}`);
        }
    }
    async setDefaultLocale(locale) {
        if (!this.supportedLocales.includes(locale)) {
            throw new Error(`Locale ${locale} is not supported`);
        }
        this.defaultLocale = locale;
    }
    async detectUserLocale(userId) {
        return this.defaultLocale;
    }
    async localizeTutorial(tutorial, locale) {
        const nameKey = `tutorial.${tutorial.id}.name`;
        const descriptionKey = `tutorial.${tutorial.id}.description`;
        const localizedName = await this.getTranslation(nameKey, locale);
        const localizedDescription = await this.getTranslation(descriptionKey, locale);
        return {
            ...tutorial,
            name: localizedName !== nameKey ? localizedName : tutorial.name,
            description: localizedDescription !== descriptionKey ? localizedDescription : tutorial.description,
            locale,
        };
    }
    async localizeStep(step, locale) {
        const titleKey = step.localization?.titleKey || `tutorial.step.${step.id}.title`;
        const instructionsKey = step.localization?.instructionsKey || `tutorial.step.${step.id}.instructions`;
        const localizedTitle = await this.getTranslation(titleKey, locale);
        const localizedInstructions = await this.getTranslation(instructionsKey, locale);
        const localizedContent = { ...step.content };
        localizedContent.instructions =
            localizedInstructions !== instructionsKey ? localizedInstructions : step.content.instructions;
        if (step.localization?.contentKeys) {
            for (const [field, key] of Object.entries(step.localization.contentKeys)) {
                const localizedValue = await this.getTranslation(key, locale);
                if (localizedValue !== key) {
                    localizedContent[field] = localizedValue;
                }
            }
        }
        return {
            ...step,
            title: localizedTitle !== titleKey ? localizedTitle : step.title,
            content: localizedContent,
            locale,
        };
    }
    async localizeHelp(help, locale) {
        const titleKey = help.localization?.titleKey || `contextual_help.${help.id}.title`;
        const bodyKey = help.localization?.bodyKey || `contextual_help.${help.id}.body`;
        const localizedTitle = await this.getTranslation(titleKey, locale);
        const localizedBody = await this.getTranslation(bodyKey, locale);
        const localizedContent = {
            ...help.content,
            title: localizedTitle !== titleKey ? localizedTitle : help.content.title,
            body: localizedBody !== bodyKey ? localizedBody : help.content.body,
        };
        if (help.content.actions && help.localization?.actionsKeys) {
            localizedContent.actions = await Promise.all(help.content.actions.map(async (action, index) => {
                const labelKey = help.localization?.actionsKeys?.[`action_${index}_label`];
                if (labelKey) {
                    const localizedLabel = await this.getTranslation(labelKey, locale);
                    return {
                        ...action,
                        label: localizedLabel !== labelKey ? localizedLabel : action.label,
                    };
                }
                return action;
            }));
        }
        return {
            ...help,
            content: localizedContent,
            locale,
        };
    }
    async getMissingTranslations(locale) {
        const defaultKeys = Array.from(this.translations.get(this.defaultLocale)?.keys() || []);
        const localeKeys = Array.from(this.translations.get(locale)?.keys() || []);
        const localeKeySet = new Set(localeKeys);
        return defaultKeys.filter((key) => !localeKeySet.has(key));
    }
    async validateTranslations(locale) {
        const missingKeys = await this.getMissingTranslations(locale);
        const totalKeys = this.translations.get(this.defaultLocale)?.size || 0;
        return {
            locale,
            totalKeys,
            missingKeys,
            isComplete: missingKeys.length === 0,
        };
    }
    generateTutorialKeys(tutorialId) {
        return [
            `tutorial.${tutorialId}.name`,
            `tutorial.${tutorialId}.description`,
        ];
    }
    generateStepKeys(stepId) {
        return [
            `tutorial.step.${stepId}.title`,
            `tutorial.step.${stepId}.instructions`,
        ];
    }
    generateHelpKeys(helpId) {
        return [
            `contextual_help.${helpId}.title`,
            `contextual_help.${helpId}.body`,
        ];
    }
};
exports.LocalizationService = LocalizationService;
exports.LocalizationService = LocalizationService = LocalizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LocalizationService);


/***/ }),

/***/ "./src/tutorial/services/tutorial-analytics.service.ts":
/*!*************************************************************!*\
  !*** ./src/tutorial/services/tutorial-analytics.service.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TutorialAnalyticsService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialAnalyticsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const tutorial_entity_1 = __webpack_require__(/*! ../entities/tutorial.entity */ "./src/tutorial/entities/tutorial.entity.ts");
const tutorial_step_entity_1 = __webpack_require__(/*! ../entities/tutorial-step.entity */ "./src/tutorial/entities/tutorial-step.entity.ts");
const user_tutorial_progress_entity_1 = __webpack_require__(/*! ../entities/user-tutorial-progress.entity */ "./src/tutorial/entities/user-tutorial-progress.entity.ts");
const tutorial_analytics_event_entity_1 = __webpack_require__(/*! ../entities/tutorial-analytics-event.entity */ "./src/tutorial/entities/tutorial-analytics-event.entity.ts");
let TutorialAnalyticsService = TutorialAnalyticsService_1 = class TutorialAnalyticsService {
    constructor(eventRepo, progressRepo, tutorialRepo, stepRepo) {
        this.eventRepo = eventRepo;
        this.progressRepo = progressRepo;
        this.tutorialRepo = tutorialRepo;
        this.stepRepo = stepRepo;
        this.logger = new common_1.Logger(TutorialAnalyticsService_1.name);
    }
    async trackEvent(event) {
        const analyticsEvent = this.eventRepo.create({
            eventType: event.eventType,
            userId: event.userId,
            tutorialId: event.tutorialId,
            stepId: event.stepId,
            sessionId: event.sessionId,
            payload: event.payload,
        });
        await this.eventRepo.save(analyticsEvent);
    }
    async getTutorialCompletionRate(tutorialId, dateRange) {
        const whereClause = { tutorialId };
        if (dateRange?.startDate) {
            whereClause.createdAt = (0, typeorm_2.MoreThanOrEqual)(dateRange.startDate);
        }
        const total = await this.progressRepo.count({ where: whereClause });
        const completed = await this.progressRepo.count({
            where: { ...whereClause, status: 'completed' },
        });
        return total > 0 ? (completed / total) * 100 : 0;
    }
    async getStepCompletionRates(tutorialId) {
        const steps = await this.stepRepo.find({
            where: { tutorialId, isActive: true },
            order: { order: 'ASC' },
        });
        const progress = await this.progressRepo.find({
            where: { tutorialId },
        });
        return steps.map((step) => {
            const stepProgressData = progress.flatMap((p) => p.stepProgress.filter((sp) => sp.stepId === step.id));
            const completed = stepProgressData.filter((sp) => sp.status === 'completed').length;
            const total = stepProgressData.length || 1;
            const skipped = stepProgressData.filter((sp) => sp.status === 'skipped').length;
            const attempts = stepProgressData.map((sp) => sp.attempts);
            const times = stepProgressData.map((sp) => sp.timeSpent);
            const hints = stepProgressData.map((sp) => sp.hintsUsed);
            const errors = {};
            stepProgressData.forEach((sp) => {
                (sp.errors || []).forEach((error) => {
                    errors[error] = (errors[error] || 0) + 1;
                });
            });
            return {
                stepId: step.id,
                stepTitle: step.title,
                completionRate: (completed / total) * 100,
                averageAttempts: attempts.length > 0 ? attempts.reduce((a, b) => a + b, 0) / attempts.length : 0,
                averageTimeSpent: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
                hintUsageRate: hints.length > 0 ? hints.filter((h) => h > 0).length / hints.length : 0,
                commonErrors: Object.entries(errors)
                    .map(([error, count]) => ({ error, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5),
                skipRate: (skipped / total) * 100,
            };
        });
    }
    async getOverallCompletionRate(dateRange) {
        const whereClause = {};
        if (dateRange?.startDate && dateRange?.endDate) {
            whereClause.createdAt = (0, typeorm_2.Between)(dateRange.startDate, dateRange.endDate);
        }
        const total = await this.progressRepo.count({ where: whereClause });
        const completed = await this.progressRepo.count({
            where: { ...whereClause, status: 'completed' },
        });
        return total > 0 ? (completed / total) * 100 : 0;
    }
    async getDropOffAnalysis(tutorialId) {
        const tutorial = await this.tutorialRepo.findOne({ where: { id: tutorialId } });
        const steps = await this.stepRepo.find({
            where: { tutorialId, isActive: true },
            order: { order: 'ASC' },
        });
        const progress = await this.progressRepo.find({
            where: { tutorialId },
        });
        const totalStarted = progress.length;
        const dropOffPoints = steps.map((step) => {
            const usersReached = progress.filter((p) => p.stepProgress.some((sp) => sp.stepId === step.id)).length;
            const usersCompleted = progress.filter((p) => p.stepProgress.some((sp) => sp.stepId === step.id && sp.status === 'completed')).length;
            const usersDropped = usersReached - usersCompleted;
            const timesBeforeDrop = progress
                .filter((p) => p.status !== 'completed' &&
                p.stepProgress.some((sp) => sp.stepId === step.id && sp.status !== 'completed'))
                .map((p) => p.stepProgress.find((sp) => sp.stepId === step.id)?.timeSpent || 0);
            return {
                stepId: step.id,
                stepTitle: step.title,
                stepOrder: step.order,
                usersReached,
                usersDropped,
                dropOffRate: usersReached > 0 ? (usersDropped / usersReached) * 100 : 0,
                averageTimeBeforeDropOff: timesBeforeDrop.length > 0
                    ? timesBeforeDrop.reduce((a, b) => a + b, 0) / timesBeforeDrop.length
                    : 0,
            };
        });
        const totalCompleted = progress.filter((p) => p.status === 'completed').length;
        const overallDropOffRate = totalStarted > 0 ? ((totalStarted - totalCompleted) / totalStarted) * 100 : 0;
        return {
            tutorialId,
            tutorialName: tutorial?.name || '',
            totalStarted,
            dropOffPoints,
            overallDropOffRate,
        };
    }
    async getCommonDropOffPoints() {
        const tutorials = await this.tutorialRepo.find({ where: { isActive: true } });
        const allDropOffs = [];
        for (const tutorial of tutorials) {
            const analysis = await this.getDropOffAnalysis(tutorial.id);
            analysis.dropOffPoints.forEach((point) => {
                if (point.dropOffRate > 20) {
                    allDropOffs.push({
                        stepId: point.stepId,
                        tutorialId: tutorial.id,
                        dropOffRate: point.dropOffRate,
                    });
                }
            });
        }
        return allDropOffs.sort((a, b) => b.dropOffRate - a.dropOffRate).slice(0, 10);
    }
    async getTutorialEffectivenessReport(tutorialId, filters) {
        const tutorial = await this.tutorialRepo.findOne({ where: { id: tutorialId } });
        if (!tutorial) {
            throw new Error(`Tutorial not found: ${tutorialId}`);
        }
        const whereClause = { tutorialId };
        if (filters?.startDate && filters?.endDate) {
            whereClause.createdAt = (0, typeorm_2.Between)(filters.startDate, filters.endDate);
        }
        const progress = await this.progressRepo.find({ where: whereClause });
        const completed = progress.filter((p) => p.status === 'completed');
        const scores = completed.filter((p) => p.overallScore).map((p) => Number(p.overallScore));
        const times = completed.filter((p) => p.totalTimeSpent > 0).map((p) => p.totalTimeSpent);
        const metrics = {
            completionRate: progress.length > 0 ? (completed.length / progress.length) * 100 : 0,
            averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
            averageCompletionTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
            totalUsers: progress.length,
            activeUsers: progress.filter((p) => p.lastActivityAt && new Date().getTime() - p.lastActivityAt.getTime() < 7 * 24 * 60 * 60 * 1000).length,
        };
        const report = {
            tutorialId,
            tutorialName: tutorial.name,
            period: {
                startDate: filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: filters?.endDate || new Date(),
            },
            metrics,
            trends: [],
        };
        if (filters?.includeStepBreakdown) {
            report.stepBreakdown = await this.getStepCompletionRates(tutorialId);
        }
        if (filters?.includeDropOffAnalysis) {
            report.dropOffAnalysis = await this.getDropOffAnalysis(tutorialId);
        }
        return report;
    }
    async getUserLearningProfile(userId) {
        const progress = await this.progressRepo.find({
            where: { userId },
            relations: ['tutorial'],
        });
        const completed = progress.filter((p) => p.status === 'completed');
        const speeds = progress.map((p) => p.adaptiveState.learningSpeed);
        const speedCounts = { slow: 0, normal: 0, fast: 0 };
        speeds.forEach((s) => (speedCounts[s] = (speedCounts[s] || 0) + 1));
        const averageSpeed = Object.entries(speedCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const strongAreas = new Set();
        const improvementAreas = new Set();
        progress.forEach((p) => {
            (p.adaptiveState.strongAreas || []).forEach((area) => strongAreas.add(area));
            (p.adaptiveState.strugglingAreas || []).forEach((area) => improvementAreas.add(area));
        });
        const totalTimeSpent = progress.reduce((sum, p) => sum + p.totalTimeSpent, 0);
        return {
            userId,
            totalTutorialsStarted: progress.length,
            totalTutorialsCompleted: completed.length,
            overallCompletionRate: progress.length > 0 ? (completed.length / progress.length) * 100 : 0,
            averageLearningSpeed: averageSpeed || 'normal',
            strongAreas: Array.from(strongAreas),
            improvementAreas: Array.from(improvementAreas),
            preferredContentTypes: [],
            totalTimeSpent,
            recentActivity: progress
                .sort((a, b) => (b.lastActivityAt?.getTime() || 0) - (a.lastActivityAt?.getTime() || 0))
                .slice(0, 5)
                .map((p) => ({
                tutorialId: p.tutorialId,
                tutorialName: p.tutorial?.name || '',
                status: p.status,
                lastActivityAt: p.lastActivityAt || p.updatedAt,
            })),
        };
    }
    async generateDashboardReport(dateRange) {
        const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = dateRange?.endDate || new Date();
        const tutorials = await this.tutorialRepo.find({ where: { isActive: true } });
        const progress = await this.progressRepo.find({
            where: { createdAt: (0, typeorm_2.Between)(startDate, endDate) },
            relations: ['tutorial'],
        });
        const completed = progress.filter((p) => p.status === 'completed');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeToday = progress.filter((p) => p.lastActivityAt && p.lastActivityAt >= today).length;
        const tutorialStats = await Promise.all(tutorials.slice(0, 10).map(async (t) => {
            const rate = await this.getTutorialCompletionRate(t.id, dateRange);
            const completions = progress.filter((p) => p.tutorialId === t.id && p.status === 'completed').length;
            return {
                tutorialId: t.id,
                tutorialName: t.name,
                completionRate: rate,
                totalCompletions: completions,
            };
        }));
        const needsAttention = tutorialStats
            .filter((t) => t.completionRate < 50 && t.totalCompletions > 0)
            .map((t) => ({
            tutorialId: t.tutorialId,
            tutorialName: t.tutorialName,
            issue: 'Low completion rate',
            metric: t.completionRate,
        }));
        return {
            period: { startDate, endDate },
            overview: {
                totalTutorials: tutorials.length,
                activeTutorials: tutorials.filter((t) => t.isActive).length,
                totalUsersOnboarded: completed.length,
                averageCompletionRate: await this.getOverallCompletionRate(dateRange),
                activeUsersToday: activeToday,
            },
            topTutorials: tutorialStats.sort((a, b) => b.completionRate - a.completionRate).slice(0, 5),
            needsAttention,
            recentCompletions: completed
                .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
                .slice(0, 10)
                .map((p) => ({
                userId: p.userId,
                tutorialId: p.tutorialId,
                tutorialName: p.tutorial?.name || '',
                completedAt: p.completedAt || p.updatedAt,
                score: Number(p.overallScore) || 0,
            })),
            trends: [],
        };
    }
    async getActiveUsers() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return this.progressRepo.count({
            where: {
                status: 'in_progress',
                lastActivityAt: (0, typeorm_2.MoreThanOrEqual)(oneHourAgo),
            },
        });
    }
    async getCurrentCompletions(interval) {
        const since = interval === 'hour'
            ? new Date(Date.now() - 60 * 60 * 1000)
            : new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.progressRepo.count({
            where: {
                status: 'completed',
                completedAt: (0, typeorm_2.MoreThanOrEqual)(since),
            },
        });
    }
};
exports.TutorialAnalyticsService = TutorialAnalyticsService;
exports.TutorialAnalyticsService = TutorialAnalyticsService = TutorialAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tutorial_analytics_event_entity_1.TutorialAnalyticsEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(user_tutorial_progress_entity_1.UserTutorialProgress)),
    __param(2, (0, typeorm_1.InjectRepository)(tutorial_entity_1.Tutorial)),
    __param(3, (0, typeorm_1.InjectRepository)(tutorial_step_entity_1.TutorialStep)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _d : Object])
], TutorialAnalyticsService);


/***/ }),

/***/ "./src/tutorial/services/tutorial-progress.service.ts":
/*!************************************************************!*\
  !*** ./src/tutorial/services/tutorial-progress.service.ts ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TutorialProgressService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialProgressService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const tutorial_step_entity_1 = __webpack_require__(/*! ../entities/tutorial-step.entity */ "./src/tutorial/entities/tutorial-step.entity.ts");
const user_tutorial_progress_entity_1 = __webpack_require__(/*! ../entities/user-tutorial-progress.entity */ "./src/tutorial/entities/user-tutorial-progress.entity.ts");
const tutorial_service_1 = __webpack_require__(/*! ./tutorial.service */ "./src/tutorial/services/tutorial.service.ts");
const tutorial_analytics_service_1 = __webpack_require__(/*! ./tutorial-analytics.service */ "./src/tutorial/services/tutorial-analytics.service.ts");
let TutorialProgressService = TutorialProgressService_1 = class TutorialProgressService {
    constructor(progressRepo, stepRepo, tutorialService, analyticsService) {
        this.progressRepo = progressRepo;
        this.stepRepo = stepRepo;
        this.tutorialService = tutorialService;
        this.analyticsService = analyticsService;
        this.logger = new common_1.Logger(TutorialProgressService_1.name);
    }
    async startTutorial(userId, dto) {
        const tutorial = await this.tutorialService.findById(dto.tutorialId);
        const { valid, missing } = await this.tutorialService.validatePrerequisites(userId, dto.tutorialId);
        if (!valid) {
            throw new common_1.ForbiddenException(`Prerequisites not met. Missing tutorials: ${missing.join(', ')}`);
        }
        let progress = await this.progressRepo.findOne({
            where: { userId, tutorialId: dto.tutorialId },
        });
        if (progress) {
            if (progress.status === 'completed') {
                progress.status = 'in_progress';
                progress.currentStepOrder = 0;
                progress.currentStepId = undefined;
                progress.completedSteps = 0;
                progress.progressPercentage = 0;
                progress.totalTimeSpent = 0;
                progress.stepProgress = [];
                progress.startedAt = new Date();
                progress.completedAt = undefined;
            }
            else if (dto.resumeFromCheckpoint && progress.sessionData?.checkpoints?.length) {
                progress.lastActivityAt = new Date();
                return this.progressRepo.save(progress);
            }
        }
        else {
            const steps = await this.tutorialService.getStepsByTutorial(dto.tutorialId);
            progress = this.progressRepo.create({
                userId,
                tutorialId: dto.tutorialId,
                status: 'in_progress',
                currentStepOrder: 0,
                totalSteps: steps.length,
                completedSteps: 0,
                progressPercentage: 0,
                totalTimeSpent: 0,
                stepProgress: [],
                adaptiveState: { learningSpeed: 'normal', proficiencyLevel: 0 },
                sessionData: { lastSessionId: dto.sessionId },
                startedAt: new Date(),
                lastActivityAt: new Date(),
            });
        }
        const saved = await this.progressRepo.save(progress);
        await this.analyticsService.trackEvent({
            eventType: 'tutorial_started',
            userId,
            tutorialId: dto.tutorialId,
            payload: { sessionId: dto.sessionId },
        });
        this.logger.log(`User ${userId} started tutorial: ${dto.tutorialId}`);
        return saved;
    }
    async updateStepProgress(userId, dto) {
        const progress = await this.getOrCreateProgress(userId, dto.tutorialId);
        const step = await this.tutorialService.getStepById(dto.stepId);
        let stepProgress = progress.stepProgress.find((sp) => sp.stepId === dto.stepId);
        if (!stepProgress) {
            stepProgress = {
                stepId: dto.stepId,
                stepOrder: step.order,
                status: 'pending',
                attempts: 0,
                timeSpent: 0,
                hintsUsed: 0,
            };
            progress.stepProgress.push(stepProgress);
        }
        stepProgress.status = dto.status;
        stepProgress.attempts += 1;
        stepProgress.timeSpent += dto.timeSpent || 0;
        stepProgress.score = dto.score;
        stepProgress.hintsUsed += dto.hintsUsed || 0;
        if (dto.errors) {
            stepProgress.errors = [...(stepProgress.errors || []), ...dto.errors];
        }
        if (dto.status === 'completed') {
            stepProgress.completedAt = new Date();
            progress.completedSteps = progress.stepProgress.filter((sp) => sp.status === 'completed').length;
            await this.analyticsService.trackEvent({
                eventType: 'step_completed',
                userId,
                tutorialId: dto.tutorialId,
                stepId: dto.stepId,
                payload: {
                    timeSpent: dto.timeSpent,
                    score: dto.score,
                    attempts: stepProgress.attempts,
                    hintsUsed: stepProgress.hintsUsed,
                },
            });
        }
        const nextStep = await this.getNextStep(userId, dto.tutorialId);
        if (nextStep) {
            progress.currentStepId = nextStep.id;
            progress.currentStepOrder = nextStep.order;
        }
        progress.progressPercentage =
            progress.totalSteps > 0
                ? Math.round((progress.completedSteps / progress.totalSteps) * 100)
                : 0;
        progress.totalTimeSpent += dto.timeSpent || 0;
        progress.lastActivityAt = new Date();
        if (dto.saveState) {
            await this.saveCheckpoint(userId, {
                tutorialId: dto.tutorialId,
                stepId: dto.stepId,
                state: dto.saveState,
            });
        }
        await this.adjustAdaptivePacing(progress, stepProgress);
        const saved = await this.progressRepo.save(progress);
        if (progress.completedSteps >= progress.totalSteps) {
            await this.completeTutorial(userId, dto.tutorialId);
        }
        return saved;
    }
    async completeTutorial(userId, tutorialId) {
        const progress = await this.getUserProgress(userId, tutorialId);
        progress.status = 'completed';
        progress.completedAt = new Date();
        progress.progressPercentage = 100;
        const scores = progress.stepProgress
            .filter((sp) => sp.score !== undefined)
            .map((sp) => sp.score);
        if (scores.length > 0) {
            progress.overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        }
        const saved = await this.progressRepo.save(progress);
        await this.analyticsService.trackEvent({
            eventType: 'tutorial_completed',
            userId,
            tutorialId,
            payload: {
                completionSummary: {
                    totalTime: progress.totalTimeSpent,
                    totalSteps: progress.totalSteps,
                    completedSteps: progress.completedSteps,
                    overallScore: progress.overallScore || 0,
                },
            },
        });
        await this.tutorialService.updateTutorialAnalytics(tutorialId);
        this.logger.log(`User ${userId} completed tutorial: ${tutorialId}`);
        return saved;
    }
    async getUserProgress(userId, tutorialId) {
        const progress = await this.progressRepo.findOne({
            where: { userId, tutorialId },
            relations: ['tutorial'],
        });
        if (!progress) {
            throw new common_1.NotFoundException(`Progress not found for user ${userId} on tutorial ${tutorialId}`);
        }
        return progress;
    }
    async getAllUserProgress(userId) {
        return this.progressRepo.find({
            where: { userId },
            relations: ['tutorial'],
            order: { lastActivityAt: 'DESC' },
        });
    }
    async skipTutorial(userId, dto) {
        const tutorial = await this.tutorialService.findById(dto.tutorialId);
        if (!tutorial.isSkippable && !dto.confirmSkip) {
            throw new common_1.BadRequestException('This tutorial is not skippable. Set confirmSkip to true to force skip.');
        }
        let progress = await this.progressRepo.findOne({
            where: { userId, tutorialId: dto.tutorialId },
        });
        if (!progress) {
            const steps = await this.tutorialService.getStepsByTutorial(dto.tutorialId);
            progress = this.progressRepo.create({
                userId,
                tutorialId: dto.tutorialId,
                totalSteps: steps.length,
                adaptiveState: { learningSpeed: 'normal', proficiencyLevel: 0 },
                sessionData: {},
            });
        }
        progress.status = 'skipped';
        progress.lastActivityAt = new Date();
        const saved = await this.progressRepo.save(progress);
        await this.analyticsService.trackEvent({
            eventType: 'tutorial_skipped',
            userId,
            tutorialId: dto.tutorialId,
            payload: { skipReason: dto.reason },
        });
        this.logger.log(`User ${userId} skipped tutorial: ${dto.tutorialId}`);
        return saved;
    }
    async skipStep(userId, dto) {
        const progress = await this.getUserProgress(userId, dto.tutorialId);
        const step = await this.tutorialService.getStepById(dto.stepId);
        if (!step.isOptional) {
            throw new common_1.BadRequestException('This step is not optional and cannot be skipped.');
        }
        let stepProgress = progress.stepProgress.find((sp) => sp.stepId === dto.stepId);
        if (!stepProgress) {
            stepProgress = {
                stepId: dto.stepId,
                stepOrder: step.order,
                status: 'skipped',
                attempts: 0,
                timeSpent: 0,
                hintsUsed: 0,
            };
            progress.stepProgress.push(stepProgress);
        }
        else {
            stepProgress.status = 'skipped';
        }
        progress.lastActivityAt = new Date();
        const nextStep = await this.getNextStep(userId, dto.tutorialId);
        if (nextStep) {
            progress.currentStepId = nextStep.id;
            progress.currentStepOrder = nextStep.order;
        }
        return this.progressRepo.save(progress);
    }
    async resumeTutorial(userId, dto) {
        const progress = await this.getUserProgress(userId, dto.tutorialId);
        if (progress.status === 'completed') {
            throw new common_1.BadRequestException('Tutorial already completed. Start again to restart.');
        }
        progress.status = 'in_progress';
        progress.lastActivityAt = new Date();
        let nextStep = null;
        let checkpoint = undefined;
        if (dto.fromStepId) {
            nextStep = await this.tutorialService.getStepById(dto.fromStepId);
            progress.currentStepId = dto.fromStepId;
            progress.currentStepOrder = nextStep.order;
        }
        else if (dto.fromCheckpoint && progress.sessionData?.checkpoints?.length) {
            const latestCheckpoint = progress.sessionData.checkpoints[progress.sessionData.checkpoints.length - 1];
            nextStep = await this.tutorialService.getStepById(latestCheckpoint.stepId);
            checkpoint = latestCheckpoint.state;
            progress.currentStepId = latestCheckpoint.stepId;
        }
        else {
            nextStep = await this.getNextStep(userId, dto.tutorialId);
        }
        await this.progressRepo.save(progress);
        return { progress, nextStep, checkpoint };
    }
    async saveCheckpoint(userId, dto) {
        const progress = await this.getUserProgress(userId, dto.tutorialId);
        const checkpoints = progress.sessionData?.checkpoints || [];
        checkpoints.push({
            stepId: dto.stepId,
            state: dto.state,
            savedAt: new Date(),
        });
        if (checkpoints.length > 5) {
            checkpoints.shift();
        }
        progress.sessionData = {
            ...progress.sessionData,
            checkpoints,
        };
        await this.progressRepo.save(progress);
        await this.analyticsService.trackEvent({
            eventType: 'checkpoint_saved',
            userId,
            tutorialId: dto.tutorialId,
            stepId: dto.stepId,
            payload: {},
        });
    }
    async getNextStep(userId, tutorialId) {
        const progress = await this.progressRepo.findOne({
            where: { userId, tutorialId },
        });
        const completedStepIds = new Set(progress?.stepProgress
            .filter((sp) => sp.status === 'completed' || sp.status === 'skipped')
            .map((sp) => sp.stepId) || []);
        const steps = await this.tutorialService.getStepsByTutorial(tutorialId);
        const nextStep = steps.find((step) => step.isActive && !completedStepIds.has(step.id));
        if (!nextStep)
            return null;
        if (progress && await this.shouldSkipStep(progress, nextStep)) {
            await this.updateStepProgress(userId, {
                tutorialId,
                stepId: nextStep.id,
                status: 'skipped',
            });
            return this.getNextStep(userId, tutorialId);
        }
        return nextStep;
    }
    async getAdaptiveState(userId, tutorialId) {
        const progress = await this.getUserProgress(userId, tutorialId);
        return progress.adaptiveState;
    }
    async shouldSkipStep(progress, step) {
        if (!step.adaptivePacing?.skipIfProficient)
            return false;
        const threshold = step.adaptivePacing.proficiencyThreshold || 0.8;
        return progress.adaptiveState.proficiencyLevel >= threshold;
    }
    async adjustAdaptivePacing(progress, stepProgress) {
        const state = progress.adaptiveState;
        const avgStepTime = progress.totalTimeSpent / (progress.completedSteps || 1);
        if (stepProgress.timeSpent < avgStepTime * 0.5) {
            state.learningSpeed = 'fast';
        }
        else if (stepProgress.timeSpent > avgStepTime * 1.5) {
            state.learningSpeed = 'slow';
        }
        else {
            state.learningSpeed = 'normal';
        }
        if (stepProgress.score !== undefined) {
            const performanceScore = (stepProgress.score / 100) * (1 / stepProgress.attempts);
            state.proficiencyLevel = (state.proficiencyLevel + performanceScore) / 2;
        }
        if (stepProgress.errors && stepProgress.errors.length > 2) {
            state.strugglingAreas = state.strugglingAreas || [];
            state.strugglingAreas.push(stepProgress.stepId);
        }
        if (stepProgress.score && stepProgress.score >= 90 && stepProgress.attempts === 1) {
            state.strongAreas = state.strongAreas || [];
            state.strongAreas.push(stepProgress.stepId);
        }
        progress.adaptiveState = state;
    }
    async getOrCreateProgress(userId, tutorialId) {
        let progress = await this.progressRepo.findOne({
            where: { userId, tutorialId },
        });
        if (!progress) {
            const steps = await this.tutorialService.getStepsByTutorial(tutorialId);
            progress = this.progressRepo.create({
                userId,
                tutorialId,
                status: 'in_progress',
                totalSteps: steps.length,
                completedSteps: 0,
                progressPercentage: 0,
                totalTimeSpent: 0,
                stepProgress: [],
                adaptiveState: { learningSpeed: 'normal', proficiencyLevel: 0 },
                sessionData: {},
                startedAt: new Date(),
                lastActivityAt: new Date(),
            });
            progress = await this.progressRepo.save(progress);
        }
        return progress;
    }
    async getCompletedTutorials(userId) {
        const progress = await this.progressRepo.find({
            where: { userId, status: 'completed' },
            select: ['tutorialId'],
        });
        return progress.map((p) => p.tutorialId);
    }
};
exports.TutorialProgressService = TutorialProgressService;
exports.TutorialProgressService = TutorialProgressService = TutorialProgressService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_tutorial_progress_entity_1.UserTutorialProgress)),
    __param(1, (0, typeorm_1.InjectRepository)(tutorial_step_entity_1.TutorialStep)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof tutorial_service_1.TutorialService !== "undefined" && tutorial_service_1.TutorialService) === "function" ? _c : Object, typeof (_d = typeof tutorial_analytics_service_1.TutorialAnalyticsService !== "undefined" && tutorial_analytics_service_1.TutorialAnalyticsService) === "function" ? _d : Object])
], TutorialProgressService);


/***/ }),

/***/ "./src/tutorial/services/tutorial.service.ts":
/*!***************************************************!*\
  !*** ./src/tutorial/services/tutorial.service.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TutorialService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const tutorial_entity_1 = __webpack_require__(/*! ../entities/tutorial.entity */ "./src/tutorial/entities/tutorial.entity.ts");
const tutorial_step_entity_1 = __webpack_require__(/*! ../entities/tutorial-step.entity */ "./src/tutorial/entities/tutorial-step.entity.ts");
const user_tutorial_progress_entity_1 = __webpack_require__(/*! ../entities/user-tutorial-progress.entity */ "./src/tutorial/entities/user-tutorial-progress.entity.ts");
let TutorialService = TutorialService_1 = class TutorialService {
    constructor(tutorialRepo, stepRepo, progressRepo) {
        this.tutorialRepo = tutorialRepo;
        this.stepRepo = stepRepo;
        this.progressRepo = progressRepo;
        this.logger = new common_1.Logger(TutorialService_1.name);
    }
    async create(dto) {
        const tutorial = this.tutorialRepo.create({
            ...dto,
            prerequisites: dto.prerequisites || [],
            targetMechanics: dto.targetMechanics || [],
            metadata: dto.metadata || {},
            analytics: {},
        });
        const saved = await this.tutorialRepo.save(tutorial);
        this.logger.log(`Created tutorial: ${saved.id} - ${saved.name}`);
        return saved;
    }
    async findById(id) {
        const tutorial = await this.tutorialRepo.findOne({
            where: { id },
            relations: ['steps'],
        });
        if (!tutorial) {
            throw new common_1.NotFoundException(`Tutorial not found: ${id}`);
        }
        return tutorial;
    }
    async findAll(filters) {
        const query = this.tutorialRepo.createQueryBuilder('tutorial');
        if (filters?.type) {
            query.andWhere('tutorial.type = :type', { type: filters.type });
        }
        if (filters?.category) {
            query.andWhere('tutorial.category = :category', { category: filters.category });
        }
        if (filters?.difficultyLevel) {
            query.andWhere('tutorial.difficultyLevel = :difficultyLevel', {
                difficultyLevel: filters.difficultyLevel,
            });
        }
        if (filters?.isActive !== undefined) {
            query.andWhere('tutorial.isActive = :isActive', { isActive: filters.isActive });
        }
        if (filters?.targetMechanic) {
            query.andWhere(':mechanic = ANY(tutorial.targetMechanics)', {
                mechanic: filters.targetMechanic,
            });
        }
        query.orderBy('tutorial.order', 'ASC');
        return query.getMany();
    }
    async update(id, dto) {
        const tutorial = await this.findById(id);
        Object.assign(tutorial, dto);
        const updated = await this.tutorialRepo.save(tutorial);
        this.logger.log(`Updated tutorial: ${id}`);
        return updated;
    }
    async delete(id) {
        const tutorial = await this.findById(id);
        await this.tutorialRepo.softRemove(tutorial);
        this.logger.log(`Soft deleted tutorial: ${id}`);
    }
    async getOnboardingCurriculum() {
        return this.tutorialRepo.find({
            where: { type: 'onboarding', isActive: true },
            relations: ['steps'],
            order: { order: 'ASC' },
        });
    }
    async getTutorialsByMechanic(mechanic) {
        return this.tutorialRepo
            .createQueryBuilder('tutorial')
            .where('tutorial.isActive = true')
            .andWhere(':mechanic = ANY(tutorial.targetMechanics)', { mechanic })
            .orderBy('tutorial.difficultyLevel', 'ASC')
            .addOrderBy('tutorial.order', 'ASC')
            .getMany();
    }
    async getRecommendedTutorials(userId) {
        const userProgress = await this.progressRepo.find({
            where: { userId, status: 'completed' },
            select: ['tutorialId'],
        });
        const completedIds = userProgress.map((p) => p.tutorialId);
        const inProgress = await this.progressRepo.find({
            where: { userId, status: 'in_progress' },
            relations: ['tutorial'],
        });
        const query = this.tutorialRepo
            .createQueryBuilder('tutorial')
            .where('tutorial.isActive = true');
        if (completedIds.length > 0) {
            query.andWhere('tutorial.id NOT IN (:...completedIds)', { completedIds });
        }
        const available = await query.orderBy('tutorial.order', 'ASC').getMany();
        const recommended = available.filter((t) => {
            if (!t.prerequisites || t.prerequisites.length === 0)
                return true;
            return t.prerequisites.every((prereq) => completedIds.includes(prereq));
        });
        const inProgressTutorials = inProgress.map((p) => p.tutorial).filter(Boolean);
        const notStarted = recommended.filter((t) => !inProgressTutorials.some((ip) => ip?.id === t.id));
        return [...inProgressTutorials, ...notStarted].slice(0, 10);
    }
    async validatePrerequisites(userId, tutorialId) {
        const tutorial = await this.findById(tutorialId);
        if (!tutorial.prerequisites || tutorial.prerequisites.length === 0) {
            return { valid: true, missing: [] };
        }
        const completedProgress = await this.progressRepo.find({
            where: {
                userId,
                tutorialId: (0, typeorm_2.In)(tutorial.prerequisites),
                status: 'completed',
            },
        });
        const completedIds = new Set(completedProgress.map((p) => p.tutorialId));
        const missing = tutorial.prerequisites.filter((prereq) => !completedIds.has(prereq));
        return {
            valid: missing.length === 0,
            missing,
        };
    }
    async createStep(dto) {
        await this.findById(dto.tutorialId);
        const step = this.stepRepo.create({
            ...dto,
            completionCriteria: dto.completionCriteria || { type: 'auto' },
            adaptivePacing: dto.adaptivePacing || {},
            accessibility: dto.accessibility || {},
            analytics: {},
            localization: {},
        });
        const saved = await this.stepRepo.save(step);
        this.logger.log(`Created step: ${saved.id} for tutorial: ${dto.tutorialId}`);
        return saved;
    }
    async getStepsByTutorial(tutorialId) {
        return this.stepRepo.find({
            where: { tutorialId, isActive: true },
            order: { order: 'ASC' },
        });
    }
    async getStepById(stepId) {
        const step = await this.stepRepo.findOne({ where: { id: stepId } });
        if (!step) {
            throw new common_1.NotFoundException(`Step not found: ${stepId}`);
        }
        return step;
    }
    async updateStep(stepId, dto) {
        const step = await this.getStepById(stepId);
        Object.assign(step, dto);
        const updated = await this.stepRepo.save(step);
        this.logger.log(`Updated step: ${stepId}`);
        return updated;
    }
    async deleteStep(stepId) {
        const step = await this.getStepById(stepId);
        await this.stepRepo.remove(step);
        this.logger.log(`Deleted step: ${stepId}`);
    }
    async reorderSteps(tutorialId, orders) {
        await this.findById(tutorialId);
        const updates = orders.map((order) => this.stepRepo.update(order.id, { order: order.order }));
        await Promise.all(updates);
        this.logger.log(`Reordered ${orders.length} steps for tutorial: ${tutorialId}`);
    }
    async updateTutorialAnalytics(tutorialId) {
        const progress = await this.progressRepo.find({
            where: { tutorialId },
        });
        const totalStarted = progress.length;
        const completed = progress.filter((p) => p.status === 'completed');
        const totalCompleted = completed.length;
        const completionTimes = completed
            .filter((p) => p.totalTimeSpent > 0)
            .map((p) => p.totalTimeSpent);
        const averageCompletionTime = completionTimes.length > 0
            ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
            : 0;
        const dropOffRate = totalStarted > 0 ? (totalStarted - totalCompleted) / totalStarted : 0;
        await this.tutorialRepo.update(tutorialId, {
            analytics: {
                totalStarted,
                totalCompleted,
                averageCompletionTime,
                dropOffRate,
                lastCalculatedAt: new Date(),
            },
        });
    }
};
exports.TutorialService = TutorialService;
exports.TutorialService = TutorialService = TutorialService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tutorial_entity_1.Tutorial)),
    __param(1, (0, typeorm_1.InjectRepository)(tutorial_step_entity_1.TutorialStep)),
    __param(2, (0, typeorm_1.InjectRepository)(user_tutorial_progress_entity_1.UserTutorialProgress)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object])
], TutorialService);


/***/ }),

/***/ "./src/tutorial/tutorial.module.ts":
/*!*****************************************!*\
  !*** ./src/tutorial/tutorial.module.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const entities_1 = __webpack_require__(/*! ./entities */ "./src/tutorial/entities/index.ts");
const services_1 = __webpack_require__(/*! ./services */ "./src/tutorial/services/index.ts");
const controllers_1 = __webpack_require__(/*! ./controllers */ "./src/tutorial/controllers/index.ts");
const users_module_1 = __webpack_require__(/*! ../users/users.module */ "./src/users/users.module.ts");
const notifications_module_1 = __webpack_require__(/*! ../notifications/notifications.module */ "./src/notifications/notifications.module.ts");
let TutorialModule = class TutorialModule {
};
exports.TutorialModule = TutorialModule;
exports.TutorialModule = TutorialModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.Tutorial,
                entities_1.TutorialStep,
                entities_1.UserTutorialProgress,
                entities_1.ContextualHelp,
                entities_1.ContextualHelpInteraction,
                entities_1.TutorialAnalyticsEvent,
            ]),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            (0, common_1.forwardRef)(() => notifications_module_1.NotificationsModule),
        ],
        controllers: [
            controllers_1.TutorialController,
            controllers_1.TutorialProgressController,
            controllers_1.ContextualHelpController,
            controllers_1.TutorialAnalyticsController,
        ],
        providers: [
            services_1.TutorialService,
            services_1.TutorialProgressService,
            services_1.ContextualHelpService,
            services_1.TutorialAnalyticsService,
            services_1.LocalizationService,
        ],
        exports: [
            services_1.TutorialService,
            services_1.TutorialProgressService,
            services_1.ContextualHelpService,
            services_1.TutorialAnalyticsService,
            services_1.LocalizationService,
        ],
    })
], TutorialModule);


/***/ }),

/***/ "./src/user-progress/entities/user-collection-progress.entity.ts":
/*!***********************************************************************!*\
  !*** ./src/user-progress/entities/user-collection-progress.entity.ts ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserCollectionProgress = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const collection_entity_1 = __webpack_require__(/*! ../../puzzles/entities/collection.entity */ "./src/puzzles/entities/collection.entity.ts");
const puzzle_entity_1 = __webpack_require__(/*! ../../puzzles/entities/puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
let UserCollectionProgress = class UserCollectionProgress {
};
exports.UserCollectionProgress = UserCollectionProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserCollectionProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.collectionProgress),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], UserCollectionProgress.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], UserCollectionProgress.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => collection_entity_1.Collection, (collection) => collection.userProgress),
    (0, typeorm_1.JoinColumn)({ name: 'collectionId' }),
    __metadata("design:type", typeof (_b = typeof collection_entity_1.Collection !== "undefined" && collection_entity_1.Collection) === "function" ? _b : Object)
], UserCollectionProgress.prototype, "collection", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], UserCollectionProgress.prototype, "collectionId", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => puzzle_entity_1.Puzzle),
    (0, typeorm_1.JoinTable)({ name: 'user_collection_progress_completed_puzzles' }),
    __metadata("design:type", Array)
], UserCollectionProgress.prototype, "completedPuzzles", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserCollectionProgress.prototype, "percentageComplete", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserCollectionProgress.prototype, "isCompleted", void 0);
exports.UserCollectionProgress = UserCollectionProgress = __decorate([
    (0, typeorm_1.Entity)('user_collection_progress')
], UserCollectionProgress);


/***/ }),

/***/ "./src/users/dto/create-user.dto.ts":
/*!******************************************!*\
  !*** ./src/users/dto/create-user.dto.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateUserDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_user_dto_1 = __webpack_require__(/*! ./create-user.dto */ "./src/users/dto/create-user.dto.ts");
class UpdateUserDto extends (0, mapped_types_1.PartialType)(create_user_dto_1.CreateUserDto) {
}
exports.UpdateUserDto = UpdateUserDto;


/***/ }),

/***/ "./src/users/entities/user-puzzle-completion.entity.ts":
/*!*************************************************************!*\
  !*** ./src/users/entities/user-puzzle-completion.entity.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserPuzzleCompletion = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ../../users/entities/user.entity */ "./src/users/entities/user.entity.ts");
const puzzle_entity_1 = __webpack_require__(/*! ../../puzzles/entities/puzzle.entity */ "./src/puzzles/entities/puzzle.entity.ts");
let UserPuzzleCompletion = class UserPuzzleCompletion {
};
exports.UserPuzzleCompletion = UserPuzzleCompletion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserPuzzleCompletion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.puzzleCompletions, { onDelete: 'CASCADE' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], UserPuzzleCompletion.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => puzzle_entity_1.Puzzle, (puzzle) => puzzle.completions, { onDelete: 'CASCADE' }),
    __metadata("design:type", typeof (_b = typeof puzzle_entity_1.Puzzle !== "undefined" && puzzle_entity_1.Puzzle) === "function" ? _b : Object)
], UserPuzzleCompletion.prototype, "puzzle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], UserPuzzleCompletion.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], UserPuzzleCompletion.prototype, "comboMultiplier", void 0);
exports.UserPuzzleCompletion = UserPuzzleCompletion = __decorate([
    (0, typeorm_1.Entity)('user_puzzle_completions')
], UserPuzzleCompletion);


/***/ }),

/***/ "./src/users/entities/user-stats.entity.ts":
/*!*************************************************!*\
  !*** ./src/users/entities/user-stats.entity.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

/***/ "./src/users/entities/user-streak.entity.ts":
/*!**************************************************!*\
  !*** ./src/users/entities/user-streak.entity.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserStreak = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ./user.entity */ "./src/users/entities/user.entity.ts");
let UserStreak = class UserStreak {
};
exports.UserStreak = UserStreak;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserStreak.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.streak, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], UserStreak.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], UserStreak.prototype, "currentStreak", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], UserStreak.prototype, "lastPuzzleCompletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], UserStreak.prototype, "streakStartDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], UserStreak.prototype, "streakRecoveryGracePeriodEnd", void 0);
exports.UserStreak = UserStreak = __decorate([
    (0, typeorm_1.Entity)('user_streaks')
], UserStreak);


/***/ }),

/***/ "./src/users/entities/user.entity.ts":
/*!*******************************************!*\
  !*** ./src/users/entities/user.entity.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.User = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_achievement_entity_1 = __webpack_require__(/*! ../../achievements/entities/user-achievement.entity */ "./src/achievements/entities/user-achievement.entity.ts");
const game_session_entity_1 = __webpack_require__(/*! ../../game-engine/entities/game-session.entity */ "./src/game-engine/entities/game-session.entity.ts");
const user_streak_entity_1 = __webpack_require__(/*! ./user-streak.entity */ "./src/users/entities/user-streak.entity.ts");
const user_puzzle_completion_entity_1 = __webpack_require__(/*! ./user-puzzle-completion.entity */ "./src/users/entities/user-puzzle-completion.entity.ts");
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
__decorate([
    (0, typeorm_1.OneToOne)(() => user_streak_entity_1.UserStreak, (streak) => streak.user, { cascade: true }),
    __metadata("design:type", typeof (_d = typeof user_streak_entity_1.UserStreak !== "undefined" && user_streak_entity_1.UserStreak) === "function" ? _d : Object)
], User.prototype, "streak", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_puzzle_completion_entity_1.UserPuzzleCompletion, (completion) => completion.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "puzzleCompletions", void 0);
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

"use strict";

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

"use strict";

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

/***/ "./src/wallet/dto/connect-wallet.dto.ts":
/*!**********************************************!*\
  !*** ./src/wallet/dto/connect-wallet.dto.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConnectWalletDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class ConnectWalletDto {
}
exports.ConnectWalletDto = ConnectWalletDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectWalletDto.prototype, "publicKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectWalletDto.prototype, "network", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectWalletDto.prototype, "signature", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectWalletDto.prototype, "nonce", void 0);


/***/ }),

/***/ "./src/wallet/dto/record-transaction.dto.ts":
/*!**************************************************!*\
  !*** ./src/wallet/dto/record-transaction.dto.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RecordTransactionDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class RecordTransactionDto {
}
exports.RecordTransactionDto = RecordTransactionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordTransactionDto.prototype, "assetCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordTransactionDto.prototype, "issuer", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordTransactionDto.prototype, "transactionHash", void 0);


/***/ }),

/***/ "./src/wallet/guards/wallet-session.guard.ts":
/*!***************************************************!*\
  !*** ./src/wallet/guards/wallet-session.guard.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WalletSessionGuard = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const wallet_service_1 = __webpack_require__(/*! ../wallet.service */ "./src/wallet/wallet.service.ts");
let WalletSessionGuard = class WalletSessionGuard {
    constructor(walletService) {
        this.walletService = walletService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractSessionToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException('Wallet session token is required');
        }
        const session = this.walletService.getSession(token);
        request.walletSession = session;
        return true;
    }
    extractSessionToken(request) {
        const headerToken = request.headers['x-wallet-session'];
        if (typeof headerToken === 'string' && headerToken.trim()) {
            return headerToken.trim();
        }
        const authHeader = request.headers['authorization'];
        if (typeof authHeader === 'string') {
            const [scheme, credentials] = authHeader.split(' ');
            if (scheme === 'Wallet' && credentials) {
                return credentials.trim();
            }
        }
        return null;
    }
};
exports.WalletSessionGuard = WalletSessionGuard;
exports.WalletSessionGuard = WalletSessionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof wallet_service_1.WalletService !== "undefined" && wallet_service_1.WalletService) === "function" ? _a : Object])
], WalletSessionGuard);


/***/ }),

/***/ "./src/wallet/utils/stellar.ts":
/*!*************************************!*\
  !*** ./src/wallet/utils/stellar.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isValidStellarPublicKey = isValidStellarPublicKey;
exports.decodeStellarPublicKey = decodeStellarPublicKey;
exports.verifyEd25519Signature = verifyEd25519Signature;
exports.parseAmountToInt = parseAmountToInt;
exports.normalizeAsset = normalizeAsset;
exports.getAssetKey = getAssetKey;
exports.getDefaultTokenMetadata = getDefaultTokenMetadata;
const crypto_1 = __webpack_require__(/*! crypto */ "crypto");
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const VERSION_BYTE_ED25519_PUBLIC_KEY = 6 << 3;
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
function isValidStellarPublicKey(publicKey) {
    try {
        decodeStellarPublicKey(publicKey);
        return true;
    }
    catch {
        return false;
    }
}
function decodeStellarPublicKey(publicKey) {
    const decoded = base32Decode(publicKey);
    if (decoded.length !== 35) {
        throw new Error('Invalid public key length');
    }
    const payload = decoded.subarray(0, decoded.length - 2);
    const checksum = decoded.subarray(decoded.length - 2);
    const expectedChecksum = crc16Xmodem(payload);
    const expectedBytes = Buffer.from([
        expectedChecksum & 0xff,
        (expectedChecksum >> 8) & 0xff,
    ]);
    if (checksum[0] !== expectedBytes[0] || checksum[1] !== expectedBytes[1]) {
        throw new Error('Invalid public key checksum');
    }
    if (payload[0] !== VERSION_BYTE_ED25519_PUBLIC_KEY) {
        throw new Error('Invalid public key version');
    }
    return Buffer.from(payload.subarray(1));
}
function verifyEd25519Signature(publicKey, message, signature) {
    const rawKey = decodeStellarPublicKey(publicKey);
    const keyDer = Buffer.concat([ED25519_SPKI_PREFIX, rawKey]);
    const keyObject = (0, crypto_1.createPublicKey)({ key: keyDer, format: 'der', type: 'spki' });
    const signatureBuffer = decodeSignature(signature);
    return (0, crypto_1.verify)(null, Buffer.from(message, 'utf8'), keyObject, signatureBuffer);
}
function parseAmountToInt(amount, decimals = 7) {
    if (typeof amount !== 'string') {
        throw new Error('Amount must be a string');
    }
    const normalized = amount.trim();
    if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) {
        throw new Error('Invalid amount format');
    }
    const parts = normalized.split('.');
    const whole = parts[0] || '0';
    const fraction = parts[1] || '';
    if (fraction.length > decimals) {
        throw new Error('Amount exceeds allowed decimals');
    }
    const paddedFraction = fraction.padEnd(decimals, '0');
    const base = BigInt(whole) * 10n ** BigInt(decimals);
    const fractionValue = paddedFraction ? BigInt(paddedFraction) : 0n;
    return base + fractionValue;
}
function normalizeAsset(assetCode, issuer) {
    const code = assetCode.trim();
    if (!code) {
        throw new Error('Asset code is required');
    }
    if (code.toUpperCase() === 'XLM' || code.toLowerCase() === 'native') {
        return { type: 'native', code: 'XLM' };
    }
    if (!issuer) {
        throw new Error('Asset issuer is required for custom assets');
    }
    if (code.length < 1 || code.length > 12) {
        throw new Error('Asset code must be between 1 and 12 characters');
    }
    if (!isValidStellarPublicKey(issuer)) {
        throw new Error('Invalid asset issuer');
    }
    const type = code.length <= 4 ? 'credit_alphanum4' : 'credit_alphanum12';
    return { type, code, issuer };
}
function getAssetKey(asset) {
    if (asset.type === 'native') {
        return 'XLM';
    }
    return `${asset.code}:${asset.issuer}`;
}
function getDefaultTokenMetadata(asset) {
    if (asset.type === 'native') {
        return {
            code: 'XLM',
            name: 'Stellar Lumens',
            symbol: 'XLM',
            decimals: 7,
        };
    }
    return {
        code: asset.code,
        issuer: asset.issuer,
        name: asset.code,
        symbol: asset.code,
        decimals: 7,
    };
}
function decodeSignature(signature) {
    const trimmed = signature.trim();
    if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length === 128) {
        return Buffer.from(trimmed, 'hex');
    }
    return Buffer.from(trimmed, 'base64');
}
function base32Decode(input) {
    const normalized = input.trim().toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const bytes = [];
    for (const char of normalized) {
        const index = BASE32_ALPHABET.indexOf(char);
        if (index === -1) {
            throw new Error('Invalid base32 character');
        }
        value = (value << 5) | index;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Buffer.from(bytes);
}
function crc16Xmodem(payload) {
    let crc = 0x0000;
    for (const byte of payload) {
        crc ^= byte << 8;
        for (let i = 0; i < 8; i += 1) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            }
            else {
                crc <<= 1;
            }
            crc &= 0xffff;
        }
    }
    return crc;
}


/***/ }),

/***/ "./src/wallet/wallet.controller.ts":
/*!*****************************************!*\
  !*** ./src/wallet/wallet.controller.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WalletController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const connect_wallet_dto_1 = __webpack_require__(/*! ./dto/connect-wallet.dto */ "./src/wallet/dto/connect-wallet.dto.ts");
const record_transaction_dto_1 = __webpack_require__(/*! ./dto/record-transaction.dto */ "./src/wallet/dto/record-transaction.dto.ts");
const wallet_session_guard_1 = __webpack_require__(/*! ./guards/wallet-session.guard */ "./src/wallet/guards/wallet-session.guard.ts");
const wallet_service_1 = __webpack_require__(/*! ./wallet.service */ "./src/wallet/wallet.service.ts");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    connect(body) {
        if ((body.signature && !body.nonce) || (!body.signature && body.nonce)) {
            return {
                status: 'error',
                message: 'Signature and nonce must be provided together',
            };
        }
        if (!body.signature || !body.nonce) {
            return this.walletService.createChallenge(body.publicKey, body.network);
        }
        return this.walletService.verifyChallenge(body.publicKey, body.network, body.nonce, body.signature);
    }
    getSession(req) {
        const session = req.walletSession;
        return {
            publicKey: session.publicKey,
            network: session.network,
            expiresAt: session.expiresAt.toISOString(),
        };
    }
    disconnect(req) {
        const session = req.walletSession;
        return this.walletService.disconnect(session.sessionToken);
    }
    getBalances(req) {
        return this.walletService.getBalances(req.walletSession);
    }
    getTransactions(req, limit, cursor) {
        const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
        const safeLimit = parsedLimit !== undefined && !Number.isNaN(parsedLimit)
            ? parsedLimit
            : undefined;
        return this.walletService.getTransactionHistory(req.walletSession, safeLimit, cursor);
    }
    recordPurchase(req, body) {
        return this.walletService.recordPurchase(req.walletSession, body);
    }
    recordSpend(req, body) {
        return this.walletService.recordSpend(req.walletSession, body);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Post)('connect'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof connect_wallet_dto_1.ConnectWalletDto !== "undefined" && connect_wallet_dto_1.ConnectWalletDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "connect", null);
__decorate([
    (0, common_1.Get)('session'),
    (0, common_1.UseGuards)(wallet_session_guard_1.WalletSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    (0, common_1.UseGuards)(wallet_session_guard_1.WalletSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Get)('balances'),
    (0, common_1.UseGuards)(wallet_session_guard_1.WalletSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getBalances", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, common_1.UseGuards)(wallet_session_guard_1.WalletSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('purchase'),
    (0, common_1.UseGuards)(wallet_session_guard_1.WalletSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_c = typeof record_transaction_dto_1.RecordTransactionDto !== "undefined" && record_transaction_dto_1.RecordTransactionDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "recordPurchase", null);
__decorate([
    (0, common_1.Post)('spend'),
    (0, common_1.UseGuards)(wallet_session_guard_1.WalletSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_d = typeof record_transaction_dto_1.RecordTransactionDto !== "undefined" && record_transaction_dto_1.RecordTransactionDto) === "function" ? _d : Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "recordSpend", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [typeof (_a = typeof wallet_service_1.WalletService !== "undefined" && wallet_service_1.WalletService) === "function" ? _a : Object])
], WalletController);


/***/ }),

/***/ "./src/wallet/wallet.module.ts":
/*!*************************************!*\
  !*** ./src/wallet/wallet.module.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WalletModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const wallet_controller_1 = __webpack_require__(/*! ./wallet.controller */ "./src/wallet/wallet.controller.ts");
const wallet_service_1 = __webpack_require__(/*! ./wallet.service */ "./src/wallet/wallet.service.ts");
const wallet_session_guard_1 = __webpack_require__(/*! ./guards/wallet-session.guard */ "./src/wallet/guards/wallet-session.guard.ts");
let WalletModule = class WalletModule {
};
exports.WalletModule = WalletModule;
exports.WalletModule = WalletModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [wallet_controller_1.WalletController],
        providers: [wallet_service_1.WalletService, wallet_session_guard_1.WalletSessionGuard],
        exports: [wallet_service_1.WalletService],
    })
], WalletModule);


/***/ }),

/***/ "./src/wallet/wallet.service.ts":
/*!**************************************!*\
  !*** ./src/wallet/wallet.service.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WalletService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const crypto_1 = __webpack_require__(/*! crypto */ "crypto");
const stellar_1 = __webpack_require__(/*! ./utils/stellar */ "./src/wallet/utils/stellar.ts");
let WalletService = class WalletService {
    constructor(configService) {
        this.configService = configService;
        this.challenges = new Map();
        this.sessions = new Map();
        this.recordedTransactions = new Map();
        this.challengeTtlMs = this.readNumber('WALLET_CHALLENGE_TTL_MS', 5 * 60 * 1000);
        this.sessionTtlMs = this.readNumber('WALLET_SESSION_TTL_MS', 24 * 60 * 60 * 1000);
        this.maxRecordedTransactions = this.readNumber('WALLET_MAX_RECORDED_TRANSACTIONS', 1000);
        this.allowedNetworks = this.parseAllowedNetworks();
        this.tokenMetadata = this.loadTokenMetadata();
    }
    createChallenge(publicKey, network) {
        this.ensureValidPublicKey(publicKey);
        const normalizedNetwork = this.normalizeNetwork(network);
        this.ensureAllowedNetwork(normalizedNetwork);
        const nonce = (0, crypto_1.randomBytes)(16).toString('hex');
        const issuedAt = new Date();
        const message = [
            'LogiQuest Wallet Authentication',
            `Public Key: ${publicKey}`,
            `Nonce: ${nonce}`,
            `Network: ${normalizedNetwork}`,
            `Issued At: ${issuedAt.toISOString()}`,
        ].join('\n');
        const expiresAt = new Date(issuedAt.getTime() + this.challengeTtlMs);
        this.challenges.set(nonce, {
            nonce,
            publicKey,
            network: normalizedNetwork,
            message,
            expiresAt,
        });
        return {
            status: 'challenge',
            nonce,
            message,
            expiresAt: expiresAt.toISOString(),
        };
    }
    verifyChallenge(publicKey, network, nonce, signature) {
        this.ensureValidPublicKey(publicKey);
        const normalizedNetwork = this.normalizeNetwork(network);
        this.ensureAllowedNetwork(normalizedNetwork);
        const challenge = this.challenges.get(nonce);
        if (!challenge) {
            throw new common_1.UnauthorizedException('Challenge not found or already used');
        }
        if (challenge.publicKey !== publicKey || challenge.network !== normalizedNetwork) {
            throw new common_1.UnauthorizedException('Challenge does not match wallet');
        }
        if (challenge.expiresAt.getTime() < Date.now()) {
            this.challenges.delete(nonce);
            throw new common_1.UnauthorizedException('Challenge expired');
        }
        const isValid = (0, stellar_1.verifyEd25519Signature)(publicKey, challenge.message, signature);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid wallet signature');
        }
        this.challenges.delete(nonce);
        const sessionToken = (0, crypto_1.randomUUID)();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.sessionTtlMs);
        const session = {
            sessionToken,
            publicKey,
            network: normalizedNetwork,
            createdAt: now,
            expiresAt,
            lastUsedAt: now,
        };
        this.sessions.set(sessionToken, session);
        return {
            status: 'connected',
            sessionToken,
            publicKey,
            network: normalizedNetwork,
            expiresAt: expiresAt.toISOString(),
        };
    }
    getSession(sessionToken) {
        const session = this.sessions.get(sessionToken);
        if (!session) {
            throw new common_1.UnauthorizedException('Wallet session not found');
        }
        if (session.expiresAt.getTime() < Date.now()) {
            this.sessions.delete(sessionToken);
            throw new common_1.UnauthorizedException('Wallet session expired');
        }
        session.lastUsedAt = new Date();
        return session;
    }
    disconnect(sessionToken) {
        if (!this.sessions.has(sessionToken)) {
            throw new common_1.UnauthorizedException('Wallet session not found');
        }
        this.sessions.delete(sessionToken);
        return { status: 'disconnected' };
    }
    async getBalances(session) {
        const account = await this.fetchAccount(session.publicKey, session.network);
        const balances = account?.balances ?? [];
        const mappedBalances = balances.map((balance) => {
            const asset = this.mapBalanceToAsset(balance);
            const metadata = this.tokenMetadata.get((0, stellar_1.getAssetKey)(asset)) ||
                (0, stellar_1.getDefaultTokenMetadata)(asset);
            return {
                asset,
                balance: balance.balance,
                decimals: metadata.decimals ?? 7,
                symbol: metadata.symbol || metadata.code,
                name: metadata.name || metadata.code,
            };
        });
        if (!mappedBalances.some((balance) => balance.asset.type === 'native')) {
            const asset = { type: 'native', code: 'XLM' };
            const metadata = (0, stellar_1.getDefaultTokenMetadata)(asset);
            mappedBalances.unshift({
                asset,
                balance: '0',
                decimals: metadata.decimals ?? 7,
                symbol: metadata.symbol || metadata.code,
                name: metadata.name || metadata.code,
            });
        }
        return { balances: mappedBalances };
    }
    async getTransactionHistory(session, limit = 20, cursor) {
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const onChain = await this.fetchOnChainOperations(session.publicKey, session.network, safeLimit, cursor);
        const recorded = this.getRecordedTransactions(session.publicKey).map((transaction) => ({
            id: transaction.id,
            source: 'recorded',
            type: transaction.type,
            status: transaction.status,
            asset: transaction.asset,
            amount: transaction.amount,
            transactionHash: transaction.transactionHash,
            createdAt: transaction.createdAt.toISOString(),
        }));
        const combined = [...recorded, ...onChain];
        combined.sort((a, b) => {
            const left = new Date(a.createdAt).getTime();
            const right = new Date(b.createdAt).getTime();
            return right - left;
        });
        return { transactions: combined };
    }
    async recordPurchase(session, payload) {
        return this.recordTransaction(session, payload, 'purchase');
    }
    async recordSpend(session, payload) {
        return this.recordTransaction(session, payload, 'spend');
    }
    async recordTransaction(session, payload, type) {
        const asset = this.ensureValidAsset(payload.assetCode, payload.issuer);
        const amountInt = this.ensureValidAmount(payload.amount);
        const transactionHash = this.ensureValidTransactionHash(payload.transactionHash);
        const existing = this.findRecordedTransaction(session.publicKey, transactionHash, type);
        if (existing) {
            return existing;
        }
        const matches = await this.verifyPaymentOnChain(session.publicKey, session.network, transactionHash, asset, amountInt, type);
        if (!matches) {
            throw new common_1.BadRequestException('Transaction does not match requested transfer');
        }
        const transaction = {
            id: (0, crypto_1.randomUUID)(),
            publicKey: session.publicKey,
            network: session.network,
            type,
            status: 'confirmed',
            asset,
            amount: payload.amount,
            transactionHash,
            createdAt: new Date(),
        };
        const list = this.getRecordedTransactions(session.publicKey);
        list.unshift(transaction);
        if (list.length > this.maxRecordedTransactions) {
            list.splice(this.maxRecordedTransactions);
        }
        this.recordedTransactions.set(session.publicKey, list);
        return transaction;
    }
    ensureValidPublicKey(publicKey) {
        if (!(0, stellar_1.isValidStellarPublicKey)(publicKey)) {
            throw new common_1.BadRequestException('Invalid Stellar public key');
        }
    }
    ensureValidAsset(assetCode, issuer) {
        try {
            return (0, stellar_1.normalizeAsset)(assetCode, issuer);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    ensureValidAmount(amount) {
        try {
            const value = (0, stellar_1.parseAmountToInt)(amount, 7);
            if (value <= 0n) {
                throw new Error('Amount must be greater than zero');
            }
            return value;
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    ensureValidTransactionHash(transactionHash) {
        const normalized = transactionHash.trim().toLowerCase();
        if (!/^[0-9a-f]{64}$/.test(normalized)) {
            throw new common_1.BadRequestException('Invalid transaction hash');
        }
        return normalized;
    }
    normalizeNetwork(network) {
        const normalized = network.trim().toLowerCase();
        if (!normalized) {
            throw new common_1.BadRequestException('Network is required');
        }
        return normalized;
    }
    ensureAllowedNetwork(network) {
        if (!this.allowedNetworks.includes(network)) {
            throw new common_1.BadRequestException('Unsupported Stellar network');
        }
    }
    parseAllowedNetworks() {
        const raw = this.configService.get('STELLAR_ALLOWED_NETWORKS') || process.env.STELLAR_ALLOWED_NETWORKS;
        const value = typeof raw === 'string' && raw.trim() ? raw : 'testnet';
        return value
            .split(',')
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean);
    }
    loadTokenMetadata() {
        const raw = this.configService.get('STELLAR_TOKEN_LIST') || process.env.STELLAR_TOKEN_LIST;
        if (typeof raw !== 'string' || !raw.trim()) {
            return new Map();
        }
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return new Map();
            }
            const map = new Map();
            for (const entry of parsed) {
                if (!entry || typeof entry.code !== 'string') {
                    continue;
                }
                const asset = entry.code.toUpperCase() === 'XLM'
                    ? { type: 'native', code: 'XLM' }
                    : (0, stellar_1.normalizeAsset)(entry.code, entry.issuer);
                map.set((0, stellar_1.getAssetKey)(asset), {
                    code: entry.code,
                    issuer: entry.issuer,
                    name: entry.name,
                    symbol: entry.symbol,
                    decimals: typeof entry.decimals === 'number' ? entry.decimals : 7,
                });
            }
            return map;
        }
        catch {
            return new Map();
        }
    }
    async fetchAccount(publicKey, network) {
        const url = `${this.getHorizonUrl(network)}/accounts/${publicKey}`;
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to fetch Stellar account');
        }
        return response.json();
    }
    mapBalanceToAsset(balance) {
        if (balance.asset_type === 'native') {
            return { type: 'native', code: 'XLM' };
        }
        return {
            type: balance.asset_type,
            code: balance.asset_code || 'UNKNOWN',
            issuer: balance.asset_issuer,
        };
    }
    async fetchOnChainOperations(publicKey, network, limit, cursor) {
        const params = new URLSearchParams({
            limit: limit.toString(),
            order: 'desc',
        });
        if (cursor) {
            params.set('cursor', cursor);
        }
        const url = `${this.getHorizonUrl(network)}/accounts/${publicKey}/operations?${params.toString()}`;
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to fetch transaction history');
        }
        const data = (await response.json());
        const records = data._embedded?.records ?? [];
        return records
            .map((record) => this.mapOperationToHistory(record))
            .filter((entry) => entry !== null);
    }
    mapOperationToHistory(record) {
        const type = record.type;
        const createdAt = record.created_at || new Date().toISOString();
        if (type === 'payment' || type?.startsWith('path_payment')) {
            const asset = record.asset_type === 'native'
                ? { type: 'native', code: 'XLM' }
                : {
                    type: record.asset_type,
                    code: record.asset_code,
                    issuer: record.asset_issuer,
                };
            return {
                id: record.id,
                source: 'chain',
                type: record.type,
                status: record.transaction_successful ? 'confirmed' : 'failed',
                asset,
                amount: record.amount,
                from: record.from,
                to: record.to,
                transactionHash: record.transaction_hash,
                createdAt,
            };
        }
        if (type === 'create_account') {
            return {
                id: record.id,
                source: 'chain',
                type: record.type,
                status: record.transaction_successful ? 'confirmed' : 'failed',
                asset: { type: 'native', code: 'XLM' },
                amount: record.starting_balance,
                from: record.funder,
                to: record.account,
                transactionHash: record.transaction_hash,
                createdAt,
            };
        }
        return null;
    }
    async verifyPaymentOnChain(publicKey, network, transactionHash, asset, amount, type) {
        const baseUrl = this.getHorizonUrl(network);
        const transactionUrl = `${baseUrl}/transactions/${transactionHash}`;
        const transactionResponse = await fetch(transactionUrl, {
            headers: { Accept: 'application/json' },
        });
        if (transactionResponse.status === 404) {
            throw new common_1.NotFoundException('Transaction not found on network');
        }
        if (!transactionResponse.ok) {
            throw new common_1.BadRequestException('Failed to verify transaction');
        }
        const transaction = await transactionResponse.json();
        if (!transaction.successful) {
            throw new common_1.BadRequestException('Transaction was not successful');
        }
        const operationsUrl = `${baseUrl}/transactions/${transactionHash}/operations?limit=200`;
        const operationsResponse = await fetch(operationsUrl, {
            headers: { Accept: 'application/json' },
        });
        if (!operationsResponse.ok) {
            throw new common_1.BadRequestException('Failed to load transaction operations');
        }
        const operations = (await operationsResponse.json());
        const records = operations._embedded?.records ?? [];
        for (const record of records) {
            if (record.type !== 'payment' && !record.type?.startsWith('path_payment')) {
                continue;
            }
            const from = record.from || record.source_account;
            const to = record.to;
            if (type === 'purchase' && to !== publicKey) {
                continue;
            }
            if (type === 'spend' && from !== publicKey) {
                continue;
            }
            if (!this.assetMatchesRecord(asset, record)) {
                continue;
            }
            try {
                const opAmount = (0, stellar_1.parseAmountToInt)(record.amount, 7);
                if (opAmount !== amount) {
                    continue;
                }
            }
            catch {
                continue;
            }
            return true;
        }
        return false;
    }
    assetMatchesRecord(asset, record) {
        if (asset.type === 'native') {
            return record.asset_type === 'native';
        }
        return (record.asset_type === asset.type &&
            record.asset_code === asset.code &&
            record.asset_issuer === asset.issuer);
    }
    getRecordedTransactions(publicKey) {
        return this.recordedTransactions.get(publicKey) || [];
    }
    findRecordedTransaction(publicKey, transactionHash, type) {
        const transactions = this.getRecordedTransactions(publicKey);
        return transactions.find((transaction) => transaction.transactionHash === transactionHash && transaction.type === type);
    }
    getHorizonUrl(network) {
        const override = this.configService.get('STELLAR_HORIZON_URL') || process.env.STELLAR_HORIZON_URL;
        if (override) {
            return override;
        }
        if (network === 'public') {
            return (this.configService.get('STELLAR_HORIZON_URL_PUBLIC') ||
                process.env.STELLAR_HORIZON_URL_PUBLIC ||
                'https://horizon.stellar.org');
        }
        if (network === 'testnet') {
            return (this.configService.get('STELLAR_HORIZON_URL_TESTNET') ||
                process.env.STELLAR_HORIZON_URL_TESTNET ||
                'https://horizon-testnet.stellar.org');
        }
        const custom = this.configService.get(`STELLAR_HORIZON_URL_${network.toUpperCase()}`);
        if (custom) {
            return custom;
        }
        throw new common_1.BadRequestException('Horizon URL not configured for network');
    }
    readNumber(key, fallback) {
        const value = this.configService.get(key) || process.env[key];
        if (typeof value === 'string' && value.trim()) {
            const parsed = Number.parseInt(value, 10);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
        if (typeof value === 'number') {
            return value;
        }
        return fallback;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], WalletService);


/***/ }),

/***/ "@nestjs/common":
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/common");

/***/ }),

/***/ "@nestjs/config":
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/config");

/***/ }),

/***/ "@nestjs/core":
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/core");

/***/ }),

/***/ "@nestjs/mapped-types":
/*!***************************************!*\
  !*** external "@nestjs/mapped-types" ***!
  \***************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/mapped-types");

/***/ }),

/***/ "@nestjs/microservices":
/*!****************************************!*\
  !*** external "@nestjs/microservices" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/microservices");

/***/ }),

/***/ "@nestjs/passport":
/*!***********************************!*\
  !*** external "@nestjs/passport" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/passport");

/***/ }),

/***/ "@nestjs/platform-express":
/*!*******************************************!*\
  !*** external "@nestjs/platform-express" ***!
  \*******************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/platform-express");

/***/ }),

/***/ "@nestjs/schedule":
/*!***********************************!*\
  !*** external "@nestjs/schedule" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/schedule");

/***/ }),

/***/ "@nestjs/swagger":
/*!**********************************!*\
  !*** external "@nestjs/swagger" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/swagger");

/***/ }),

/***/ "@nestjs/terminus":
/*!***********************************!*\
  !*** external "@nestjs/terminus" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/terminus");

/***/ }),

/***/ "@nestjs/throttler":
/*!************************************!*\
  !*** external "@nestjs/throttler" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/throttler");

/***/ }),

/***/ "@nestjs/typeorm":
/*!**********************************!*\
  !*** external "@nestjs/typeorm" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/typeorm");

/***/ }),

/***/ "@sentry/node":
/*!*******************************!*\
  !*** external "@sentry/node" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = require("@sentry/node");

/***/ }),

/***/ "@stellar/stellar-sdk":
/*!***************************************!*\
  !*** external "@stellar/stellar-sdk" ***!
  \***************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@stellar/stellar-sdk");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "class-transformer":
/*!************************************!*\
  !*** external "class-transformer" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("class-transformer");

/***/ }),

/***/ "class-validator":
/*!**********************************!*\
  !*** external "class-validator" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("class-validator");

/***/ }),

/***/ "dotenv":
/*!*************************!*\
  !*** external "dotenv" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("dotenv");

/***/ }),

/***/ "helmet":
/*!*************************!*\
  !*** external "helmet" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("helmet");

/***/ }),

/***/ "nest-winston":
/*!*******************************!*\
  !*** external "nest-winston" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = require("nest-winston");

/***/ }),

/***/ "nodemailer":
/*!*****************************!*\
  !*** external "nodemailer" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("nodemailer");

/***/ }),

/***/ "rxjs/operators":
/*!*********************************!*\
  !*** external "rxjs/operators" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("rxjs/operators");

/***/ }),

/***/ "typeorm":
/*!**************************!*\
  !*** external "typeorm" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("typeorm");

/***/ }),

/***/ "winston":
/*!**************************!*\
  !*** external "winston" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("winston");

/***/ }),

/***/ "xss":
/*!**********************!*\
  !*** external "xss" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("xss");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

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