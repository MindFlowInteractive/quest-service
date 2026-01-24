import { Controller, Get, Param, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { UserCollectionProgressService } from './user-collection-progress.service';
import { UserCollectionProgress } from './entities/user-collection-progress.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming auth guards are in place
import { Request } from 'express';

@Controller('user/collections/progress')
@UseGuards(JwtAuthGuard) // Protect endpoints requiring user authentication
export class UserCollectionProgressController {
  constructor(private readonly userCollectionProgressService: UserCollectionProgressService) {}

  // Get progress for all collections for the current user
  @Get()
  async findAllForUser(@Req() req: Request): Promise<UserCollectionProgress[]> {
    const userId = req.user.id; // Assuming user object is attached by JwtAuthGuard
    return this.userCollectionProgressService.findAllForUser(userId);
  }

  // Get progress for a specific collection for the current user
  @Get(':collectionId')
  async findOneForUser(
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Req() req: Request,
  ): Promise<UserCollectionProgress> {
    const userId = req.user.id;
    return this.userCollectionProgressService.findOneForUser(userId, collectionId);
  }

  // Note: Direct POST/PATCH/DELETE for UserCollectionProgress might not be needed
  // as progress is typically updated automatically when puzzles are completed.
  // If manual updates or specific actions are required, they can be added.
}
