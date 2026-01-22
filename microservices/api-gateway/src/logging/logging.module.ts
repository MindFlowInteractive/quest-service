import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './winston.config';
import { LoggingInterceptor } from './logging.interceptor';

@Global()
@Module({
    imports: [WinstonModule.forRoot(winstonConfig)],
    providers: [LoggingInterceptor],
    exports: [LoggingInterceptor],
})
export class LoggingModule { }
