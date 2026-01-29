import { Injectable, Logger } from '@nestjs/common';
import * as handlebars from 'handlebars';

@Injectable()
export class TemplateEngineService {
    private readonly logger = new Logger(TemplateEngineService.name);

    render(template: string, data: any): string {
        try {
            const compiledTemplate = handlebars.compile(template);
            return compiledTemplate(data);
        } catch (error) {
            this.logger.error(`Error rendering template: ${error.message}`);
            throw error;
        }
    }
}
