import { Module } from '@nestjs/common';
import { ProfileModule } from './profile/profile.module';

@Module({ imports: [ProfileModule] })
export class AppModule {}
