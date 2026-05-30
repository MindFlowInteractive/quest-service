import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SeasonalEventController } from './seasonal-event.controller';
import { SeasonalEventService } from './seasonal-event.service';

describe('SeasonalEventController', () => {
  let ctrl: SeasonalEventController;
  beforeEach(async () => {
    const m: TestingModule = await Test.createTestingModule({
      controllers: [SeasonalEventController], providers: [SeasonalEventService],
    }).compile();
    ctrl = m.get(SeasonalEventController);
  });
  it('should be defined', () => expect(ctrl).toBeDefined());
  it('creates an event and lists it', () => {
    ctrl.create('Summer Fest', 'summer', '2026-06-01', '2026-08-31');
    expect(ctrl.findAll()).toHaveLength(1);
  });
  it('activates an event', () => {
    const e = ctrl.create('Harvest', 'autumn', '2026-09-01', '2026-11-30');
    expect(ctrl.activate(e.id).active).toBe(true);
  });
  it('throws for unknown event', () => {
    expect(() => ctrl.activate('ghost')).toThrow(NotFoundException);
  });
});
