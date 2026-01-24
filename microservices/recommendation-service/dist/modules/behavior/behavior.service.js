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
exports.BehaviorService = void 0;
const common_1 = require("@nestjs/common");
const history_service_1 = require("../history/history.service");
const ss = require("simple-statistics");
let BehaviorService = class BehaviorService {
    constructor(historyService) {
        this.historyService = historyService;
    }
    async analyzeSkillLevel(playerId) {
        const history = await this.historyService.getPlayerHistory(playerId);
        const completions = history.filter(h => h.action === 'complete');
        if (completions.length === 0)
            return 0.1;
        const times = completions.map(c => c.timeSpent).filter(t => t !== null);
        if (times.length === 0)
            return 0.5;
        const meanTime = ss.mean(times);
        return Math.min(1, 100 / meanTime);
    }
    async getRecentInterests(playerId) {
        const history = await this.historyService.getPlayerHistory(playerId);
        const recent = history.slice(0, 20);
        const categories = recent
            .map(h => h.metadata?.category)
            .filter(Boolean);
        return [...new Set(categories)];
    }
};
exports.BehaviorService = BehaviorService;
exports.BehaviorService = BehaviorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [history_service_1.HistoryService])
], BehaviorService);
//# sourceMappingURL=behavior.service.js.map