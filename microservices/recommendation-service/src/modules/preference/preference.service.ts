import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preference } from './entities/preference.entity';

@Injectable()
export class PreferenceService {
    constructor(
        @InjectRepository(Preference)
        private preferenceRepository: Repository<Preference>,
    ) { }

    async getPreference(playerId: string): Promise<Preference | null> {
        return this.preferenceRepository.findOne({ where: { playerId } });
    }

    async updatePreference(playerId: string, data: Partial<Preference>): Promise<Preference> {
        let preference = await this.getPreference(playerId);
        if (!preference) {
            preference = this.preferenceRepository.create({ playerId, ...data });
        } else {
            Object.assign(preference, data);
        }
        return this.preferenceRepository.save(preference);
    }
}
