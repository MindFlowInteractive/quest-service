import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TournamentEventsService } from './tournament-events.service';
import { CreateTournamentEventDto } from './dto/create-tournament-event.dto';
import { QueryTournamentEventsDto } from './dto/query-tournament-events.dto';

@Controller('tournament-events')
export class TournamentEventsController {
  constructor(private readonly tournamentEventsService: TournamentEventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTournamentEventDto: CreateTournamentEventDto,
    @Request() req?: any,
  ) {
    try {
      const createdBy = req?.user?.id;
      const tournamentEvent = await this.tournamentEventsService.create(
        createTournamentEventDto,
        createdBy,
      );
      return {
        success: true,
        message: 'Tournament event created successfully',
        data: tournamentEvent,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  async findAll(@Query() query: QueryTournamentEventsDto) {
    try {
      const result = await this.tournamentEventsService.findAll(query);
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const tournamentEvent = await this.tournamentEventsService.findOne(id);
      return {
        success: true,
        data: tournamentEvent,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req?.user?.id || 'test-user-id'; // For testing
      const username = req?.user?.username || 'TestUser';

      const participant = await this.tournamentEventsService.registerParticipant(
        id,
        userId,
        username,
      );

      return {
        success: true,
        message: 'Successfully registered for tournament event',
        data: participant,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/standings')
  async getStandings(@Param('id') id: string) {
    try {
      const result = await this.tournamentEventsService.getStandings(id);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/results')
  async getResults(@Param('id') id: string) {
    try {
      const result = await this.tournamentEventsService.getResults(id);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}