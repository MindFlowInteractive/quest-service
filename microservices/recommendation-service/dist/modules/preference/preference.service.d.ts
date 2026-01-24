import { Repository } from 'typeorm';
import { Preference } from './entities/preference.entity';
export declare class PreferenceService {
    private preferenceRepository;
    constructor(preferenceRepository: Repository<Preference>);
    getPreference(playerId: string): Promise<Preference | null>;
    updatePreference(playerId: string, data: Partial<Preference>): Promise<Preference>;
}
