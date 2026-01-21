import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { RegisterTournamentDto } from './dto/register-tournament.dto';
import { QueryTournamentsDto } from './dto/query-tournaments.dto';
import { SubmitMatchResultDto } from './dto/submit-match-result.dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTournamentDto: CreateTournamentDto,
    @Request() req?: any,
  ) {
    try {
      const createdBy = req?.user?.id;
      const tournament = await this.tournamentsService.create(
        createTournamentDto,
        createdBy,
      );
      return {
        success: true,
        message: 'Tournament created successfully',
        data: tournament,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  async findAll(@Query() query: QueryTournamentsDto) {
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
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('completed')
  async getCompletedTournaments(@Query('limit') limit?: number) {
    try {
      const tournaments = await this.tournamentsService.getCompletedTournaments(
        limit || 10,
      );
      return {
        success: true,
        data: tournaments,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const tournament = await this.tournamentsService.findOne(id);
      if (!tournament) {
        throw new NotFoundException('Tournament not found');
      }
      return {
        success: true,
        data: tournament,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/bracket')
  async getBracket(@Param('id') id: string) {
    try {
      const bracket = await this.tournamentsService.getBracket(id);
      return {
        success: true,
        data: bracket,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/standings')
  async getStandings(@Param('id') id: string) {
    try {
      const standings = await this.tournamentsService.getStandings(id);
      return {
        success: true,
        data: standings,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/history')
  async getTournamentHistory(@Param('id') id: string) {
    try {
      const history = await this.tournamentsService.getTournamentHistory(id);
      return {
        success: true,
        data: history,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/spectators')
  async getSpectators(@Param('id') id: string) {
    try {
      const spectators =
        await this.tournamentsService.getTournamentSpectators(id);
      return {
        success: true,
        data: spectators,
        count: spectators.length,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    try {
      const tournament = await this.tournamentsService.update(
        id,
        updateTournamentDto,
      );
      return {
        success: true,
        message: 'Tournament updated successfully',
        data: tournament,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    try {
      await this.tournamentsService.remove(id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req?.user?.id || 'test-user-id'; // For testing
      const username = req?.user?.username || 'TestUser';

      const participant = await this.tournamentsService.registerParticipant(
        id,
        userId,
        username,
      );

      return {
        success: true,
        message: 'Successfully registered for tournament',
        data: participant,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  async withdraw(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req?.user?.id || 'test-user-id';

      await this.tournamentsService.withdrawParticipant(id, userId);

      return {
        success: true,
        message: 'Successfully withdrawn from tournament',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/generate-bracket')
  @HttpCode(HttpStatus.CREATED)
  async generateBracket(@Param('id') id: string) {
    try {
      const bracket = await this.tournamentsService.generateBracket(id);
      return {
        success: true,
        message: 'Tournament bracket generated successfully',
        data: bracket,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('matches/:matchId/result')
  @HttpCode(HttpStatus.OK)
  async submitMatchResult(
    @Param('matchId') matchId: string,
    @Body() submitMatchResultDto: SubmitMatchResultDto,
  ) {
    try {
      await this.tournamentsService.submitMatchResult(
        matchId,
        submitMatchResultDto.winnerId,
        submitMatchResultDto.player1Score,
        submitMatchResultDto.player2Score,
        submitMatchResultDto.puzzleResults,
      );

      return {
        success: true,
        message: 'Match result submitted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/spectate')
  @HttpCode(HttpStatus.CREATED)
  async joinAsSpectator(
    @Param('id') id: string,
    @Request() req: any,
    @Query('matchId') matchId?: string,
  ) {
    try {
      const userId = req?.user?.id || 'spectator-' + Date.now();
      const username = req?.user?.username || 'Spectator';

      const spectator = await this.tournamentsService.joinAsSpectator(
        id,
        userId,
        username,
        matchId,
      );

      return {
        success: true,
        message: 'Joined as spectator',
        data: spectator,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('spectators/:spectatorId/leave')
  @HttpCode(HttpStatus.OK)
  async leaveAsSpectator(@Param('spectatorId') spectatorId: string) {
    try {
      await this.tournamentsService.leaveAsSpectator(spectatorId);

      return {
        success: true,
        message: 'Left spectator mode',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
