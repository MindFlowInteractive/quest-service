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
    Handlebars.registerHelper('formatDate', (date: Date | string, format?: string) => {
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      }
      if (format === 'long') {
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return d.toISOString();
    });

    Handlebars.registerHelper('formatCurrency', (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    });

    Handlebars.registerHelper('uppercase', (str: string) => {
      return str?.toUpperCase();
    });

    Handlebars.registerHelper('lowercase', (str: string) => {
      return str?.toLowerCase();
    });

    Handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (!str || str.length <= length) return str;
      return str.substring(0, length) + '...';
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    Handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    Handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

    Handlebars.registerHelper('and', (...args) => {
      args.pop();
      return args.every(Boolean);
    });

    Handlebars.registerHelper('or', (...args) => {
      args.pop();
      return args.some(Boolean);
    });

    Handlebars.registerHelper('pluralize', (count: number, singular: string, plural?: string) => {
      return count === 1 ? singular : plural || `${singular}s`;
    });

    Handlebars.registerHelper('json', (obj: any) => {
      return new Handlebars.SafeString(JSON.stringify(obj, null, 2));
    });

    Handlebars.registerHelper('safeUrl', (url: string) => {
      return encodeURIComponent(url);
    });

    Handlebars.registerHelper('currentYear', () => {
      return new Date().getFullYear();
    });
  }

  render(template: string, data: Record<string, any>): string {
    try {
      const compiled = Handlebars.compile(template);
      return compiled(data);
    } catch (error) {
      this.logger.error(`Error rendering template: ${error.message}`);
      throw error;
    }
  }

  renderCached(templateKey: string, template: string, data: Record<string, any>): string {
    try {
      let compiled = this.compiledTemplates.get(templateKey);

      if (!compiled) {
        compiled = Handlebars.compile(template);
        this.compiledTemplates.set(templateKey, compiled);
      }

      return compiled(data);
    } catch (error) {
      this.logger.error(`Error rendering cached template ${templateKey}: ${error.message}`);
      throw error;
    }
  }

  clearCache(templateKey?: string) {
    if (templateKey) {
      this.compiledTemplates.delete(templateKey);
    } else {
      this.compiledTemplates.clear();
    }
  }

  validateTemplate(template: string): { valid: boolean; error?: string } {
    try {
      Handlebars.compile(template);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(template)) !== null) {
      const variable = match[1].trim();
      if (!variable.startsWith('#') && !variable.startsWith('/') && !variable.startsWith('!')) {
        const cleanVar = variable.split(' ')[0].replace(/^\./, '');
        if (cleanVar && !cleanVar.includes('(')) {
          variables.add(cleanVar);
        }
      }
    }

    return Array.from(variables);
  }
}
