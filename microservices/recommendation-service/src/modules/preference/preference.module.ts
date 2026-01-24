import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferenceService } from './preference.service';
import { PreferenceController } from './preference.controller';
import { Preference } from './entities/preference.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Preference]),
    ],
    providers: [PreferenceService],
    controllers: [PreferenceController],
    exports: [PreferenceService],
})
export class PreferenceModule { }
