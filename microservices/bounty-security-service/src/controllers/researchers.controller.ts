import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResearchersService } from '../services/researchers.service';
import { RewardsService } from '../services/rewards.service';
import { RegisterResearcherDto, BlockResearcherDto } from '../dto/researcher.dto';

@ApiTags('researchers')
@Controller('researchers')
export class ResearchersController {
  constructor(
    private readonly researchersService: ResearchersService,
    private readonly rewardsService: RewardsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new researcher' })
  async register(@Body() dto: RegisterResearcherDto) {
    return this.researchersService.register(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List researchers, sorted by reputation' })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.researchersService.list(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a researcher by id' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.researchersService.findById(id);
  }

  @Get('by-handle/:handle')
  @ApiOperation({ summary: 'Get a researcher by handle' })
  async getByHandle(@Param('handle') handle: string) {
    return this.researchersService.findByHandle(handle);
  }

  @Post('block')
  @ApiOperation({ summary: 'Block a researcher from submitting reports (target resolved from dto)' })
  async block(@Body() dto: BlockResearcherDto) {
    return this.researchersService.block(dto);
  }

  @Patch(':id/unblock')
  @ApiOperation({ summary: 'Unblock a previously blocked researcher' })
  async unblock(@Param('id', ParseUUIDPipe) id: string) {
    return this.researchersService.unblock(id);
  }

  @Get(':id/rewards')
  @ApiOperation({ summary: 'List rewards earned by a researcher' })
  async rewards(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.rewardsService.list({
      researcherId: id,
      page: Number(page),
      limit: Number(limit),
    });
  }
}
