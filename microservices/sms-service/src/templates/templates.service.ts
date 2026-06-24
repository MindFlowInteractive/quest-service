import { Injectable, NotFoundException } from '@nestjs/common';
import * as Handlebars from 'handlebars';

type TemplateDefinition = {
  body: string;
};

@Injectable()
export class TemplatesService {
  private readonly templates = new Map<string, TemplateDefinition>([
    [
      'otp',
      {
        body: 'Your Quest verification code is {{code}}. It expires in {{minutes}} minutes.',
      },
    ],
    ['alert', { body: '{{title}}: {{message}}' }],
    ['time-sensitive', { body: '{{message}} Reply STOP to opt out.' }],
  ]);

  render(templateName: string, variables: Record<string, any> = {}): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new NotFoundException(`SMS template "${templateName}" not found`);
    }

    return Handlebars.compile(template.body)(variables);
  }

  list(): Array<{ name: string; body: string }> {
    return Array.from(this.templates.entries()).map(([name, template]) => ({
      name,
      body: template.body,
    }));
  }
}
