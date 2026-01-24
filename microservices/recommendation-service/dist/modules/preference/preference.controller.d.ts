import { PreferenceService } from './preference.service';
export declare class PreferenceController {
    private readonly preferenceService;
    constructor(preferenceService: PreferenceService);
    getPreference(playerId: string): Promise<import("./entities/preference.entity").Preference | null>;
    updatePreference(playerId: string, data: any): Promise<import("./entities/preference.entity").Preference>;
}
