import { Injectable, NotFoundException } from '@nestjs/common';

export interface Profile { id: string; userId: string; displayName: string; bio: string; avatarUrl: string; }

@Injectable()
export class ProfileService {
  private readonly profiles: Profile[] = [];

  create(userId: string, displayName: string): Profile {
    const p: Profile = { id: Date.now().toString(), userId, displayName, bio: '', avatarUrl: '' };
    this.profiles.push(p);
    return p;
  }

  findByUserId(userId: string): Profile {
    const p = this.profiles.find((x) => x.userId === userId);
    if (!p) throw new NotFoundException(`Profile not found for user ${userId}`);
    return p;
  }

  update(userId: string, data: Partial<Pick<Profile, 'displayName' | 'bio' | 'avatarUrl'>>): Profile {
    return Object.assign(this.findByUserId(userId), data);
  }
}
