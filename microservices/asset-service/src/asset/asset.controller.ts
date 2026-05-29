import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AssetService } from './asset.service';

@Controller('assets')
export class AssetController {
  constructor(private readonly service: AssetService) {}

  @Get('owner/:ownerId')
  findByOwner(@Param('ownerId') ownerId: string) {
    return this.service.findByOwner(ownerId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  register(@Body() body: { ownerId: string; filename: string; mimeType: string; sizeBytes: number }) {
    return this.service.register(body.ownerId, body.filename, body.mimeType, body.sizeBytes);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}