import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSessionDto) {
    const session = await this.sessionService.create(dto);
    return {
      message: 'Session created successfully',
      session,
    };
  }

  @Get(':sessionId')
  async findById(@Param('sessionId') sessionId: string) {
    const session = await this.sessionService.findById(sessionId);
    return {
      message: 'Session retrieved successfully',
      session,
    };
  }

  @Get('user/:userId')
  async findByUserId(
    @Param('userId') userId: string,
    @Query('status') status?: string,
  ) {
    const sessions = await this.sessionService.findByUserId(
      userId,
      status as any,
    );
    return {
      message: 'Sessions retrieved successfully',
      sessions,
      count: sessions.length,
    };
  }

  @Get('user/:userId/active')
  async getActiveSession(@Param('userId') userId: string) {
    const session = await this.sessionService.getActiveSession(userId);
    return {
      message: 'Active session retrieved successfully',
      session,
    };
  }

  @Patch(':sessionId')
  async update(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    const session = await this.sessionService.update(sessionId, dto);
    return {
      message: 'Session updated successfully',
      session,
    };
  }

  @Patch(':sessionId/active')
  async updateLastActive(@Param('sessionId') sessionId: string) {
    await this.sessionService.updateLastActive(sessionId);
    return {
      message: 'Last active time updated successfully',
    };
  }

  @Post(':sessionId/pause')
  async pause(@Param('sessionId') sessionId: string) {
    const session = await this.sessionService.pause(sessionId);
    return {
      message: 'Session paused successfully',
      session,
    };
  }

  @Post(':sessionId/resume')
  async resume(@Param('sessionId') sessionId: string) {
    const session = await this.sessionService.resume(sessionId);
    return {
      message: 'Session resumed successfully',
      session,
    };
  }

  @Post(':sessionId/complete')
  async complete(@Param('sessionId') sessionId: string) {
    const session = await this.sessionService.complete(sessionId);
    return {
      message: 'Session completed successfully',
      session,
    };
  }

  @Post(':sessionId/abandon')
  async abandon(@Param('sessionId') sessionId: string) {
    const session = await this.sessionService.abandon(sessionId);
    return {
      message: 'Session abandoned successfully',
      session,
    };
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('sessionId') sessionId: string) {
    await this.sessionService.delete(sessionId);
  }
}
