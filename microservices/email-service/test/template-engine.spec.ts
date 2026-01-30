import { Test, TestingModule } from '@nestjs/testing';
import { TemplateEngineService } from '../src/templates/template-engine.service';

describe('TemplateEngineService', () => {
  let service: TemplateEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateEngineService],
    }).compile();

    service = module.get<TemplateEngineService>(TemplateEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('render', () => {
    it('should render a simple template', () => {
      const template = 'Hello, {{name}}!';
      const data = { name: 'John' };
      const result = service.render(template, data);
      expect(result).toBe('Hello, John!');
    });

    it('should render template with multiple variables', () => {
      const template = 'Hi {{firstName}} {{lastName}}, welcome to {{company}}!';
      const data = { firstName: 'John', lastName: 'Doe', company: 'Quest Service' };
      const result = service.render(template, data);
      expect(result).toBe('Hi John Doe, welcome to Quest Service!');
    });

    it('should handle nested objects', () => {
      const template = 'User: {{user.name}}, Email: {{user.email}}';
      const data = { user: { name: 'John', email: 'john@example.com' } };
      const result = service.render(template, data);
      expect(result).toBe('User: John, Email: john@example.com');
    });
  });

  describe('helpers', () => {
    it('should format date with short format', () => {
      const template = 'Date: {{formatDate date "short"}}';
      const data = { date: new Date('2025-01-30') };
      const result = service.render(template, data);
      expect(result).toContain('Date:');
    });

    it('should format currency', () => {
      const template = 'Price: {{formatCurrency amount "USD"}}';
      const data = { amount: 99.99 };
      const result = service.render(template, data);
      expect(result).toBe('Price: $99.99');
    });

    it('should uppercase text', () => {
      const template = '{{uppercase name}}';
      const data = { name: 'john' };
      const result = service.render(template, data);
      expect(result).toBe('JOHN');
    });

    it('should capitalize text', () => {
      const template = '{{capitalize name}}';
      const data = { name: 'john' };
      const result = service.render(template, data);
      expect(result).toBe('John');
    });

    it('should truncate text', () => {
      const template = '{{truncate text 10}}';
      const data = { text: 'This is a very long text that should be truncated' };
      const result = service.render(template, data);
      expect(result).toBe('This is a ...');
    });

    it('should handle pluralize helper', () => {
      const template = 'You have {{count}} {{pluralize count "item"}}';
      expect(service.render(template, { count: 1 })).toBe('You have 1 item');
      expect(service.render(template, { count: 5 })).toBe('You have 5 items');
    });

    it('should get current year', () => {
      const template = '© {{currentYear}} Quest Service';
      const result = service.render(template, {});
      expect(result).toBe(`© ${new Date().getFullYear()} Quest Service`);
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template', () => {
      const template = 'Hello, {{name}}!';
      const result = service.validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('should invalidate incorrect template', () => {
      const template = 'Hello, {{#if name}!';
      const result = service.validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('extractVariables', () => {
    it('should extract simple variables', () => {
      const template = 'Hello, {{name}}! Your email is {{email}}.';
      const variables = service.extractVariables(template);
      expect(variables).toContain('name');
      expect(variables).toContain('email');
    });

    it('should extract nested variables', () => {
      const template = 'User: {{user.name}}, Company: {{user.company.name}}';
      const variables = service.extractVariables(template);
      expect(variables).toContain('user.name');
      expect(variables).toContain('user.company.name');
    });
  });

  describe('renderCached', () => {
    it('should cache compiled templates', () => {
      const template = 'Hello, {{name}}!';
      const key = 'test-template';

      const result1 = service.renderCached(key, template, { name: 'John' });
      const result2 = service.renderCached(key, template, { name: 'Jane' });

      expect(result1).toBe('Hello, John!');
      expect(result2).toBe('Hello, Jane!');
    });

    it('should clear cache', () => {
      const template = 'Hello, {{name}}!';
      const key = 'test-template';

      service.renderCached(key, template, { name: 'John' });
      service.clearCache(key);

      const result = service.renderCached(key, template, { name: 'Jane' });
      expect(result).toBe('Hello, Jane!');
    });
  });
});
