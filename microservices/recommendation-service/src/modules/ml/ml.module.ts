import { Module } from '@nestjs/common';
import { MLService } from './ml.service';

@Module({
    providers: [MLService],
    exports: [MLService],
})
export class MLModule { }
