import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { QuestChainsService } from './quest-chains.service';
import { CreateQuestChainDto } from './dto/create-quest-chain.dto';
import { UserRole } from '../auth/constants';

// Guards / RBAC (adjust paths based on your project structure)
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('quest-chains')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestChainsController {
  constructor(private readonly service: QuestChainsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async createChain(@Body() dto: CreateQuestChainDto) {
    return this.service.createChain(dto);
  }

  @Get()
  async listChains(@Req() req: Request & { user: { id: string } }) {
    return this.service.listChains(req.user.id);
  }

  @Get(':id')
  async getChainDetail(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.service.getChainDetail(id, req.user.id);
  }

  @Post(':id/entries/:entryId/complete')
  async completeEntry(
    @Param('id') chainId: string,
    @Param('entryId') entryId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.service.markEntryCompleted(req.user.id, chainId, entryId);
  }
}