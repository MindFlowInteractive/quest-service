import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateEngineService } from './template-engine.service';
import {
  CreateSmsTemplateDto,
  RenderSmsTemplateDto,
  UpdateSmsTemplateDto,
} from './dto';
import { SmsTemplate } from './entities/sms-template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(SmsTemplate)
    private readonly templateRepository: Repository<SmsTemplate>,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  async create(dto: CreateSmsTemplateDto): Promise<SmsTemplate> {
    const validation = this.templateEngine.validateTemplate(dto.body);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const template = this.templateRepository.create({
      ...dto,
      variables: dto.variables?.length
        ? dto.variables
        : this.templateEngine.extractVariables(dto.body),
    });

    return this.templateRepository.save(template);
  }

  findAll(): Promise<SmsTemplate[]> {
    return this.templateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SmsTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async findByName(name: string): Promise<SmsTemplate> {
    const template = await this.templateRepository.findOne({ where: { name } });
    if (!template) {
      throw new NotFoundException(`Template ${name} not found`);
    }
    return template;
  }

  findByNameOrNull(name: string): Promise<SmsTemplate | null> {
    return this.templateRepository.findOne({ where: { name } });
  }

  async update(id: string, dto: UpdateSmsTemplateDto): Promise<SmsTemplate> {
    const template = await this.findOne(id);

    if (dto.body) {
      const validation = this.templateEngine.validateTemplate(dto.body);
      if (!validation.valid) {
        throw new BadRequestException(validation.error);
      }
    }

    const merged = this.templateRepository.merge(template, dto);
    if (dto.body) {
      merged.version += 1;
      merged.variables =
        dto.variables?.length || dto.variables === undefined
          ? dto.variables || this.templateEngine.extractVariables(dto.body)
          : [];
    }

    return this.templateRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }

  async render(dto: RenderSmsTemplateDto): Promise<{ body: string }> {
    const template = await this.findByName(dto.templateName);
    return {
      body: this.templateEngine.render(template.body, dto.variables, template.name),
    };
  }

  async preview(id: string, variables: Record<string, any>) {
    const template = await this.findOne(id);
    return {
      body: this.templateEngine.render(template.body, variables, template.name),
    };
  }
}
