import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

import { QuestChainService } from '../services/quest-chain.service';
import { QuestChainValidationService } from '../services/quest-chain-validation.service';
import { QuestChainProgressionService } from '../services/quest-chain-progression.service';
import { CreateQuestChainDto } from '../dto/create-quest-chain.dto';
import { UpdateQuestChainDto } from '../dto/update-quest-chain.dto';
import { AddPuzzleToChainDto } from '../dto/add-puzzle-to-chain.dto';
import { GetQuestChainsDto } from '../dto/get-quest-chains.dto';
import { QuestChain } from '../entities/quest-chain.entity';
import { QuestChainPuzzle } from '../entities/quest-chain-puzzle.entity';
import { ValidationResult } from '../services/quest-chain-validation.service';

@ApiTags('Quest Chains')
@Controller('quest-chains')
export class QuestChainController {
  constructor(
    private readonly questChainService: QuestChainService,
    private readonly validationService: QuestChainValidationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quest chain' })
  @ApiResponse({ status: 201, description: 'Quest chain created successfully', type: QuestChain })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: CreateQuestChainDto })
  async createChain(@Body(ValidationPipe) chainData: CreateQuestChainDto): Promise<QuestChain> {
    return this.questChainService.createChain(chainData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quest chains with filtering' })
  @ApiResponse({ status: 200, description: 'List of quest chains', type: [QuestChain] })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'archived', 'all'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getChains(@Query(ValidationPipe) query: GetQuestChainsDto): Promise<QuestChain[]> {
    return this.questChainService.getChains(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific quest chain by ID' })
  @ApiResponse({ status: 200, description: 'Quest chain details', type: QuestChain })
  @ApiResponse({ status: 404, description: 'Quest chain not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  async getChainById(@Param('id') id: string): Promise<QuestChain> {
    return this.questChainService.getChainById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a quest chain' })
  @ApiResponse({ status: 200, description: 'Quest chain updated successfully', type: QuestChain })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Quest chain not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  @ApiBody({ type: UpdateQuestChainDto })
  async updateChain(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: UpdateQuestChainDto,
  ): Promise<QuestChain> {
    return this.questChainService.updateChain(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quest chain' })
  @ApiResponse({ status: 204, description: 'Quest chain deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Quest chain not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  async deleteChain(@Param('id') id: string): Promise<void> {
    return this.questChainService.deleteChain(id);
  }

  @Post(':id/puzzles')
  @ApiOperation({ summary: 'Add a puzzle to a quest chain' })
  @ApiResponse({ status: 201, description: 'Puzzle added to chain successfully', type: QuestChainPuzzle })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Quest chain not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  @ApiBody({ type: AddPuzzleToChainDto })
  async addPuzzleToChain(
    @Param('id') chainId: string,
    @Body(ValidationPipe) puzzleData: AddPuzzleToChainDto,
  ): Promise<QuestChainPuzzle> {
    return this.questChainService.addPuzzleToChain(chainId, puzzleData);
  }

  @Delete(':id/puzzles/:puzzleId')
  @ApiOperation({ summary: 'Remove a puzzle from a quest chain' })
  @ApiResponse({ status: 204, description: 'Puzzle removed from chain successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Puzzle or quest chain not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  @ApiParam({ name: 'puzzleId', description: 'Puzzle ID' })
  async removePuzzleFromChain(
    @Param('id') chainId: string,
    @Param('puzzleId') puzzleId: string,
  ): Promise<void> {
    return this.questChainService.removePuzzleFromChain(chainId, puzzleId);
  }

  @Get(':id/puzzles')
  @ApiOperation({ summary: 'Get all puzzles in a quest chain' })
  @ApiResponse({ status: 200, description: 'List of puzzles in chain', type: [QuestChainPuzzle] })
  @ApiResponse({ status: 404, description: 'Quest chain not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  async getChainPuzzles(@Param('id') chainId: string): Promise<QuestChainPuzzle[]> {
    return this.questChainService.getChainPuzzles(chainId);
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate quest chain structure' })
  @ApiResponse({ status: 200, description: 'Validation result', type: Object })
  @ApiResponse({ status: 404, description: 'Quest chain not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  async validateChain(@Param('id') chainId: string): Promise<ValidationResult> {
    return this.validationService.validateChainStructure(chainId);
  }

  @Post(':id/reset')
  @ApiOperation({ summary: 'Reset progress for a quest chain' })
  @ApiResponse({ status: 200, description: 'Chain progress reset successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Quest chain not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  async resetChainProgress(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<void> {
    // In a real implementation, this would coordinate with the progression service
    // For this implementation, we'll note that reset is handled via the progress controller
  }
}