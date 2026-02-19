import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';

@UseGuards(AuthGuard('jwt'))
@Controller('profile')
export class ProfileController {
  constructor(private service: ProfileService) {}

  @Get('me')
  get(@Req() req) {
    return this.service.findOne(req.user.userId);
  }

  @Patch('me')
  update(@Req() req, @Body() body) {
    return this.service.update(req.user.userId, body);
  }
}
