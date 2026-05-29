import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly svc: ProfileService) {}

  @Post()
  create(@Body('userId') userId: string, @Body('displayName') dn: string) {
    return this.svc.create(userId, dn);
  }

  @Get(':userId')
  findOne(@Param('userId') userId: string) { return this.svc.findByUserId(userId); }

  @Patch(':userId')
  update(@Param('userId') userId: string, @Body() body: Record<string, string>) {
    return this.svc.update(userId, body);
  }
}
