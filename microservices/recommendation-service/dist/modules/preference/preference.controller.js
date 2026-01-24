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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceController = void 0;
const common_1 = require("@nestjs/common");
const preference_service_1 = require("./preference.service");
let PreferenceController = class PreferenceController {
    constructor(preferenceService) {
        this.preferenceService = preferenceService;
    }
    async getPreference(playerId) {
        return this.preferenceService.getPreference(playerId);
    }
    async updatePreference(playerId, data) {
        return this.preferenceService.updatePreference(playerId, data);
    }
};
exports.PreferenceController = PreferenceController;
__decorate([
    (0, common_1.Get)(':playerId'),
    __param(0, (0, common_1.Param)('playerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PreferenceController.prototype, "getPreference", null);
__decorate([
    (0, common_1.Post)(':playerId'),
    __param(0, (0, common_1.Param)('playerId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PreferenceController.prototype, "updatePreference", null);
exports.PreferenceController = PreferenceController = __decorate([
    (0, common_1.Controller)('preferences'),
    __metadata("design:paramtypes", [preference_service_1.PreferenceService])
], PreferenceController);
//# sourceMappingURL=preference.controller.js.map