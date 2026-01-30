import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate, TemplateCategory } from './entities/email-template.entity';
import { TemplateEngineService } from './template-engine.service';
import { CreateTemplateDto, UpdateTemplateDto, RenderTemplateDto } from './dto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepository: Repository<EmailTemplate>,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  async create(dto: CreateTemplateDto): Promise<EmailTemplate> {
    const validation = this.templateEngine.validateTemplate(dto.htmlBody);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.error}`);
    }

    const template = this.templateRepository.create({
      ...dto,
      requiredVariables: this.templateEngine.extractVariables(dto.htmlBody),
    });

    return this.templateRepository.save(template);
  }

  async findAll(category?: TemplateCategory): Promise<EmailTemplate[]> {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    return this.templateRepository.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async findByName(name: string): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({ where: { name, isActive: true } });
    if (!template) {
      throw new NotFoundException(`Template with name ${name} not found`);
    }
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<EmailTemplate> {
    const template = await this.findOne(id);

    if (dto.htmlBody) {
      const validation = this.templateEngine.validateTemplate(dto.htmlBody);
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.error}`);
      }
      dto['requiredVariables'] = this.templateEngine.extractVariables(dto.htmlBody);
      this.templateEngine.clearCache(template.name);
    }

    Object.assign(template, dto);
    template.version += 1;

    return this.templateRepository.save(template);
  }

  async delete(id: string): Promise<void> {
    const template = await this.findOne(id);
    template.isActive = false;
    await this.templateRepository.save(template);
    this.templateEngine.clearCache(template.name);
  }

  async render(dto: RenderTemplateDto): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.findByName(dto.templateName);

    const variables = {
      ...template.defaultVariables,
      ...dto.variables,
    };

    return {
      subject: this.templateEngine.renderCached(
        `${template.name}:subject`,
        template.subject,
        variables,
      ),
      html: this.templateEngine.renderCached(
        `${template.name}:html`,
        template.htmlBody,
        variables,
      ),
      text: template.textBody
        ? this.templateEngine.renderCached(
            `${template.name}:text`,
            template.textBody,
            variables,
          )
        : undefined,
    };
  }

  async preview(id: string, variables: Record<string, any>): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.findOne(id);

    const mergedVariables = {
      ...template.defaultVariables,
      ...variables,
    };

    return {
      subject: this.templateEngine.render(template.subject, mergedVariables),
      html: this.templateEngine.render(template.htmlBody, mergedVariables),
      text: template.textBody
        ? this.templateEngine.render(template.textBody, mergedVariables)
        : undefined,
    };
  }

  async duplicate(id: string, newName: string): Promise<EmailTemplate> {
    const original = await this.findOne(id);

    const duplicate = this.templateRepository.create({
      ...original,
      id: undefined,
      name: newName,
      version: 1,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.templateRepository.save(duplicate);
  }
}
