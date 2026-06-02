import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorProfile } from './entities/mentor-profile.entity';
import { StudentProfile } from './entities/student-profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(MentorProfile)
    private mentorRepository: Repository<MentorProfile>,
    @InjectRepository(StudentProfile)
    private studentRepository: Repository<StudentProfile>,
  ) {}

  async createMentorProfile(userId: string, specialties: string[]) {
    let profile = await this.mentorRepository.findOne({ where: { userId } });
    if (!profile) {
      profile = this.mentorRepository.create({ userId, specialties });
    } else {
      profile.specialties = specialties;
    }
    return this.mentorRepository.save(profile);
  }

  async createStudentProfile(userId: string, interests: string[]) {
    let profile = await this.studentRepository.findOne({ where: { userId } });
    if (!profile) {
      profile = this.studentRepository.create({ userId, interests });
    } else {
      profile.interests = interests;
    }
    return this.studentRepository.save(profile);
  }

  async getMentorProfile(userId: string) {
    return this.mentorRepository.findOne({ where: { userId } });
  }

  async getStudentProfile(userId: string) {
    return this.studentRepository.findOne({ where: { userId } });
  }

  async updateMentorAvailability(userId: string, isAvailable: boolean) {
    await this.mentorRepository.update({ userId }, { isAvailable });
    return this.getMentorProfile(userId);
  }

  async findAllAvailableMentors() {
    return this.mentorRepository.find({ where: { isAvailable: true } });
  }
}
