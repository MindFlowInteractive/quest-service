import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test, TestCategory, TestDifficulty } from './entities/test.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
  ) {}

  async create(createTestDto: CreateTestDto): Promise<Test> {
    const test = this.testRepository.create(createTestDto);
    return this.testRepository.save(test);
  }

  async findAll(): Promise<Test[]> {
    return this.testRepository.find();
  }

  async findOne(id: string): Promise<Test> {
    const test = await this.testRepository.findOne({ where: { id } });
    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }
    return test;
  }

  async findByCategory(category: TestCategory): Promise<Test[]> {
    return this.testRepository.find({ where: { category, isActive: true } });
  }

  async findByDifficulty(difficulty: TestDifficulty): Promise<Test[]> {
    return this.testRepository.find({ where: { difficulty, isActive: true } });
  }

  async findByCategoryAndDifficulty(category: TestCategory, difficulty: TestDifficulty): Promise<Test[]> {
    return this.testRepository.find({ where: { category, difficulty, isActive: true } });
  }

  async getAdaptiveTest(category: TestCategory, currentDifficulty: number): Promise<Test> {
    const difficulty = this.mapDifficultyToEnum(currentDifficulty);
    const tests = await this.findByCategoryAndDifficulty(category, difficulty);
    
    if (tests.length === 0) {
      // Fallback to nearest difficulty
      const allTests = await this.findByCategory(category);
      if (allTests.length === 0) {
        throw new NotFoundException(`No tests available for category ${category}`);
      }
      return allTests[0];
    }
    
    // Return a random test from the available tests
    const randomIndex = Math.floor(Math.random() * tests.length);
    return tests[randomIndex];
  }

  private mapDifficultyToEnum(level: number): TestDifficulty {
    if (level >= 5) return TestDifficulty.MASTER;
    if (level >= 4) return TestDifficulty.EXPERT;
    if (level >= 3) return TestDifficulty.HARD;
    if (level >= 2) return TestDifficulty.MEDIUM;
    return TestDifficulty.EASY;
  }

  async update(id: string, updateTestDto: UpdateTestDto): Promise<Test> {
    const test = await this.findOne(id);
    Object.assign(test, updateTestDto);
    return this.testRepository.save(test);
  }

  async remove(id: string): Promise<void> {
    const test = await this.findOne(id);
    await this.testRepository.remove(test);
  }

  async deactivate(id: string): Promise<Test> {
    const test = await this.findOne(id);
    test.isActive = false;
    return this.testRepository.save(test);
  }

  async activate(id: string): Promise<Test> {
    const test = await this.findOne(id);
    test.isActive = true;
    return this.testRepository.save(test);
  }
}
