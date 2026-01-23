import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppealsService {
    private readonly logger = new Logger(AppealsService.name);

    async consolidateAppeal(data: { userId: string; violationId: string; reason: string }) {
        this.logger.log(`Received appeal from ${data.userId} for violation ${data.violationId}`);
        return {
            status: 'RECEIVED',
            message: 'Appeal has been received and will be reviewed.',
        };
    }
}
