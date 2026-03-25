import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HintsService } from '../src/hints/hints.service';
import { Hint } from '../src/hints/entities/hint.entity';
import { HintUsage } from '../src/hints/entities/hint-usage.entity';
import { HintTemplate } from '../src/hints/entities/hint-template.entity';
import { PlayerEventsService } from '../src/player-events/player-events.service';

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
      providers: [
        HintsService,
        {
          provide: PlayerEventsService,
          useValue: { emitPlayerEvent: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    const service = moduleRef.get(HintsService);
    expect(service).toBeDefined();
  });

  it('emits hint.used event when requesting a hint', async () => {
    const playerEventsMock = { emitPlayerEvent: jest.fn().mockResolvedValue(undefined) };

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
      providers: [
        HintsService,
        { provide: PlayerEventsService, useValue: playerEventsMock },
      ],
    }).compile();

    const service = moduleRef.get(HintsService);

    await service.createHint({
      puzzleId: 'puzzle-1',
      order: 1,
      type: 'general',
      content: 'Test hint',
      cost: 0,
      pointsPenalty: 0,
    });

    await service.requestHint({
      puzzleId: 'puzzle-1',
      userId: 'user-1',
      attemptNumber: 1,
      timeSpent: 10,
    });

    expect(playerEventsMock.emitPlayerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        eventType: 'hint.used',
      }),
    );
  });
});


