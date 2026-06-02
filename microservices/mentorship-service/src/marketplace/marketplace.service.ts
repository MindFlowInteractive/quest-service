import { Injectable } from '@nestjs/common';
import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class MarketplaceService {
  constructor(private readonly profilesService: ProfilesService) {}

  async getAvailableMentors() {
    return this.profilesService.findAllAvailableMentors();
  }

  async searchMentors(specialty: string) {
    const mentors = await this.profilesService.findAllAvailableMentors();
    if (!specialty) return mentors;
    return mentors.filter((m) =>
      m.specialties?.some((s) => s.toLowerCase().includes(specialty.toLowerCase())),
    );
  }
}
