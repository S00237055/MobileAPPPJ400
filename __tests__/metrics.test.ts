import {
  aggregateByWeek,
  calculateTotalReps,
  calculateVolume,
  fetchWithRetry,
  formatTime,
  getSafetyStatus,
  parseDurationMinutes,
  startOfWeek,
  sumMacros,
} from '../lib/metrics';

// Helper so each test does not have to repeat every field.
const log = (dateEaten: string, calories = 100, protein = 10, carbs = 20, fat = 5) => ({
  dateEaten,
  calories,
  proteinGrams: protein,
  carbsGrams: carbs,
  fatGrams: fat,
});

describe('startOfWeek', () => {
  it('returns the Monday for a date mid-week', () => {
    // Wednesday 14 January 2026
    const result = startOfWeek('2026-01-14T15:30:00');
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(12);
    expect(result.getHours()).toBe(0);
  });

  it('groups Sunday with the week that began on the preceding Monday', () => {
    // JavaScript numbers Sunday as day 0. Without remapping it to 7 this would
    // roll forward to the wrong week.
    const result = startOfWeek('2026-01-18T22:00:00');
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(12);
  });
});

describe('aggregateByWeek', () => {
  it('sums entries that fall in the same week into one bucket', () => {
    const result = aggregateByWeek([
      log('2026-01-12T09:00:00', 100, 10, 20, 5),
      log('2026-01-14T09:00:00', 200, 20, 30, 10),
      log('2026-01-18T23:30:00', 300, 30, 40, 15), // Sunday, same week
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].calories).toBe(600);
    expect(result[0].protein).toBe(60);
  });

  it('separates weeks and returns the newest first', () => {
    const result = aggregateByWeek([
      log('2026-01-07T09:00:00', 100),
      log('2026-01-21T09:00:00', 300),
      log('2026-01-14T09:00:00', 200),
    ]);

    expect(result).toHaveLength(3);
    expect(result[0].calories).toBe(300);
    expect(result[2].calories).toBe(100);
  });

  it('treats missing carbohydrate and fat values as zero rather than NaN', () => {
    // Entries logged before those columns existed.
    const result = aggregateByWeek([
      { dateEaten: '2026-01-14T09:00:00', calories: 100, proteinGrams: 10 },
    ]);

    expect(result[0].carbs).toBe(0);
    expect(Number.isNaN(result[0].fat)).toBe(false);
  });
});

describe('sumMacros', () => {
  it('adds every entry together', () => {
    const totals = sumMacros([
      log('2026-01-14T09:00:00', 100, 10, 20, 5),
      log('2026-01-14T13:00:00', 250, 30, 15, 8),
    ]);

    expect(totals.calories).toBe(350);
    expect(totals.protein).toBe(40);
    expect(totals.carbs).toBe(35);
  });
});

describe('calculateVolume', () => {
  it('multiplies load by repetitions, and is zero for empty or bodyweight sets', () => {
    // 60x10 = 600, 65x8 = 520
    expect(calculateVolume([
      { weightKg: 60, reps: 10 },
      { weightKg: 65, reps: 8 },
    ])).toBe(1120);

    expect(calculateVolume([])).toBe(0);
    expect(calculateVolume([{ weightKg: 0, reps: 20 }])).toBe(0);
  });
});

describe('calculateTotalReps', () => {
  it('adds the repetitions of every set', () => {
    expect(calculateTotalReps([
      { weightKg: 60, reps: 10 },
      { weightKg: 65, reps: 8 },
      { weightKg: 70, reps: 6 },
    ])).toBe(24);
  });
});

describe('parseDurationMinutes', () => {
  it('reads minutes and seconds from the note and rounds up', () => {
    expect(parseDurationMinutes('Duration: 42:15')).toBe(43);
    expect(parseDurationMinutes('Duration: 30:00')).toBe(30);
  });

  it('reports at least one minute for a very short recorded session', () => {
    expect(parseDurationMinutes('Duration: 00:20')).toBe(1);
  });

  it('returns zero for sessions with no recorded duration', () => {
    // Sessions logged before the timer feature existed, or a malformed note.
    expect(parseDurationMinutes(undefined)).toBe(0);
    expect(parseDurationMinutes('Felt strong today')).toBe(0);
    expect(parseDurationMinutes('Duration: not a time')).toBe(0);
  });
});

describe('formatTime', () => {
  it('pads minutes and seconds below ten', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(3599)).toBe('59:59');
  });
});

describe('getSafetyStatus', () => {
  it('falls back to unknown rather than implying an unrated product is safe', () => {
    expect(getSafetyStatus(1).label).toContain('Unprocessed');
    expect(getSafetyStatus(4).label).toContain('Ultra-Processed');
    expect(getSafetyStatus(undefined).label).toContain('Unknown');
  });
});

describe('fetchWithRetry', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retries after a failure and returns the eventual success', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ recovered: true }) }) as any;

    const result = await fetchWithRetry('https://example.test', undefined, 3, 1);

    expect(result).toEqual({ recovered: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('gives up after the configured number of attempts', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 }) as any;

    await expect(fetchWithRetry('https://example.test', undefined, 3, 1)).rejects.toThrow('503');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
