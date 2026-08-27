import { Controller, Get, Headers, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CdnService } from './cdn.service';

@Controller('assets')
export class CdnController {
  constructor(private readonly cdnService: CdnService) {}

  @Get('*')
  redirectToCdn(
    @Param('0') key: string,
    @Query('v') version = 'latest',
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res() response: Response,
  ) {
    const asset = this.cdnService.resolveAsset(key, version);
    this.cdnService.recordRequest(ifNoneMatch === asset.etag);

    if (ifNoneMatch === asset.etag) {
      response.status(304).setHeader('ETag', asset.etag).send();
      return;
    }

    response
      .status(302)
      .setHeader('Cache-Control', asset.cacheControl)
      .setHeader('ETag', asset.etag)
      .redirect(asset.url);
  }
}
