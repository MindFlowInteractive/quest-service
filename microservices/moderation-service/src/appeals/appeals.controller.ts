import { Controller, Post, Body } from '@nestjs/common';
import { AppealsService } from './appeals.service';

@Controller('appeals')
export class AppealsController {
    constructor(private readonly appealsService: AppealsService) { }

    @Post()
    async lodgeAppeal(@Body() body: { userId: string; violationId: string; reason: string }) {
        return this.appealsService.consolidateAppeal(body);
    }
}
