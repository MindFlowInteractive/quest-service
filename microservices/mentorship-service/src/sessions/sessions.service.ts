import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorshipSession } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(MentorshipSession)
    private sessionRepository: Repository<MentorshipSession>,
  ) {}

  async createSession(mentorshipId: number, title: string, scheduledAt: Date, notes?: string) {
    const session = this.sessionRepository.create({
      mentorship: { id: mentorshipId } as any,
      title,
      scheduledAt,
      notes,
    });
    return this.sessionRepository.save(session);
  }

  async verifySession(id: number) {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');

    session.isVerified = true;
    session.completedAt = new Date();
    return this.sessionRepository.save(session);
  }

  async getSessionsByMentorship(mentorshipId: number) {
    return this.sessionRepository.find({
      where: { mentorship: { id: mentorshipId } as any },
      order: { scheduledAt: 'ASC' },
    });
  }
}
