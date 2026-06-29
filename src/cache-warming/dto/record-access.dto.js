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
exports.RecordAccessDto = void 0;
const class_validator_1 = require("class-validator");
const preload_data_entity_1 = require("../entities/preload-data.entity");
class RecordAccessDto {
}
exports.RecordAccessDto = RecordAccessDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordAccessDto.prototype, "cacheKey", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RecordAccessDto.prototype, "hit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(preload_data_entity_1.PreloadSourceType),
    __metadata("design:type", String)
], RecordAccessDto.prototype, "sourceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RecordAccessDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(30),
    __metadata("design:type", Number)
], RecordAccessDto.prototype, "ttlSeconds", void 0);
//# sourceMappingURL=record-access.dto.js.map