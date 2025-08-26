import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HintsService } from '../src/hints/hints.service';
import { Hint } from '../src/hints/entities/hint.entity';
import { HintUsage } from '../src/hints/entities/hint-usage.entity';
import { HintTemplate } from '../src/hints/entities/hint-template.entity';

describe('HintsService', () => {
  it('bootstraps service (smoke)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [Hint, HintUsage, HintTemplate],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Hint, HintUsage, HintTemplate]),
      ],
      providers: [HintsService],
    }).compile();

    const service = moduleRef.get(HintsService);
    expect(service).toBeDefined();
  });
});


