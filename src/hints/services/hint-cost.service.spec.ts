import { HintCostService } from './hint-cost.service';

describe('HintCostService', () => {
  const service = new HintCostService();

  it('makes the first hint free', () => {
    const cost = service.computeCost(1, 'medium');
    expect(cost.totalCost).toBe(0);
    expect(cost.progressiveFactor).toBe(0);
  });

  it('scales the price with puzzle difficulty', () => {
    expect(service.computeCost(2, 'easy').totalCost).toBe(8);
    expect(service.computeCost(2, 'medium').totalCost).toBe(11);
    expect(service.computeCost(2, 'hard').totalCost).toBe(15);
    expect(service.computeCost(2, 'expert').totalCost).toBe(23);
  });

  it('increases progressively with the hint order', () => {
    const second = service.computeCost(2, 'hard').totalCost;
    const third = service.computeCost(3, 'hard').totalCost;
    const fourth = service.computeCost(4, 'hard').totalCost;

    expect(third).toBeGreaterThan(second);
    expect(fourth).toBeGreaterThan(third);
  });

  it('clamps invalid orders to the first hint', () => {
    expect(service.computeCost(0, 'medium').order).toBe(1);
    expect(service.computeCost(-5, 'medium').order).toBe(1);
    expect(service.computeCost(Number.NaN, 'medium').order).toBe(1);
  });

  it('treats an unknown difficulty as the base factor', () => {
    const cost = service.computeCost(2, 'unknown' as any);
    expect(cost.difficultyFactor).toBe(1);
    expect(cost.totalCost).toBe(8);
  });

  it('honours base cost and free-hint overrides', () => {
    const cost = service.computeCost(2, 'easy', {
      baseCost: 10,
      freeHints: 0,
    });
    expect(cost.totalCost).toBe(15);
  });

  it('previews the whole progressive schedule', () => {
    const schedule = service.previewSchedule('easy', 4);
    expect(schedule).toHaveLength(4);
    expect(schedule.map((entry) => entry.order)).toEqual([1, 2, 3, 4]);
  });

  it('sums the cumulative cost of a ladder', () => {
    const schedule = service.previewSchedule('medium', 3);
    const expected = schedule.reduce((sum, entry) => sum + entry.totalCost, 0);
    expect(service.cumulativeCost(3, 'medium')).toBe(expected);
  });

  it('never returns a negative cost', () => {
    const cost = service.computeCost(2, 'expert', { baseCost: -100 });
    expect(cost.totalCost).toBe(0);
  });
});
