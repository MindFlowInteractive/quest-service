import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mentorship, MentorshipStatus } from './entities/mentorship.entity';
import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class MentorshipsService {
  constructor(
    @InjectRepository(Mentorship)
    private mentorshipRepository: Repository<Mentorship>,
    private profilesService: ProfilesService,
  ) {}

  async requestMentorship(mentorId: string, studentId: string, goal: string) {
    const mentor = await this.profilesService.getMentorProfile(mentorId);
    if (!mentor || !mentor.isAvailable) {
      throw new BadRequestException('Mentor is not available');
    }

    const student = await this.profilesService.getStudentProfile(studentId);
    if (!student) {
      throw new BadRequestException('Student profile not found');
    }

    const existing = await this.mentorshipRepository.findOne({
      where: { mentorId, studentId, status: MentorshipStatus.ACTIVE },
    });
    if (existing) {
      throw new BadRequestException('Mentorship already active');
    }

    const mentorship = this.mentorshipRepository.create({
      mentorId,
      studentId,
      goal,
      status: MentorshipStatus.PENDING,
    });

    return this.mentorshipRepository.save(mentorship);
  }

  async acceptMentorship(id: number) {
    const mentorship = await this.mentorshipRepository.findOne({ where: { id } });
    if (!mentorship) throw new NotFoundException('Mentorship not found');
    if (mentorship.status !== MentorshipStatus.PENDING) {
      throw new BadRequestException('Mentorship is not pending');
    }

    mentorship.status = MentorshipStatus.ACTIVE;
    return this.mentorshipRepository.save(mentorship);
  }

  async completeMentorship(id: number) {
    const mentorship = await this.mentorshipRepository.findOne({ where: { id } });
    if (!mentorship) throw new NotFoundException('Mentorship not found');
    
    mentorship.status = MentorshipStatus.COMPLETED;
    mentorship.completedAt = new Date();
    return this.mentorshipRepository.save(mentorship);
  }

  async findByMentor(mentorId: string) {
    return this.mentorshipRepository.find({ where: { mentorId } });
  }

  async findByStudent(studentId: string) {
    return this.mentorshipRepository.find({ where: { studentId } });
  }

  async findOne(id: number) {
    const mentorship = await this.mentorshipRepository.findOne({
      where: { id },
      relations: ['sessions', 'milestones'],
    });
    if (!mentorship) throw new NotFoundException('Mentorship not found');
    return mentorship;
  }
}
