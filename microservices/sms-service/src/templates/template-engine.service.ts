import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';

@Injectable()
export class TemplateEngineService {
  private readonly logger = new Logger(TemplateEngineService.name);
  private readonly compiledTemplates = new Map<string, HandlebarsTemplateDelegate>();

  constructor() {
    this.registerHelpers();
  }

  private registerHelpers() {
    Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
    Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('currentYear', () => new Date().getFullYear());
  }

  render(template: string, data: Record<string, any>, cacheKey?: string): string {
    try {
      const compiled = cacheKey
        ? this.getCompiledTemplate(cacheKey, template)
        : Handlebars.compile(template);
      return compiled(data);
    } catch (error) {
      this.logger.error(`Failed to render template: ${error.message}`);
      throw error;
    }
  }

  validateTemplate(template: string): { valid: boolean; error?: string } {
    try {
      Handlebars.compile(template);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(template)) !== null) {
      const raw = match[1].trim();
      if (!raw.startsWith('#') && !raw.startsWith('/')) {
        const token = raw.split(' ')[0];
        if (token && !token.includes('(')) {
          variables.add(token.replace(/^\./, ''));
        }
      }
    }

    return Array.from(variables);
  }

  private getCompiledTemplate(
    cacheKey: string,
    template: string,
  ): HandlebarsTemplateDelegate {
    let compiled = this.compiledTemplates.get(cacheKey);

    if (!compiled) {
      compiled = Handlebars.compile(template);
      this.compiledTemplates.set(cacheKey, compiled);
    }

    return compiled;
  }
}
