import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Email } from './entities/email.entity';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { QueueModule } from '../queue/queue.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Email]),
    forwardRef(() => QueueModule),
    TemplatesModule,
  ],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService, TypeOrmModule],
})
export class EmailsModule {}
