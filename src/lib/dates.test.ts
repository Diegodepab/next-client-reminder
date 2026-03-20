import { calculateNextServiceDate, calculateReminderDate, shouldNotify } from './dates';

describe('calculateNextServiceDate', () => {
  it('adds 6 months correctly', () => {
    const result = calculateNextServiceDate('2024-01-15T00:00:00.000Z', 6);
    expect(result).not.toBeNull();
    expect(result?.getUTCFullYear()).toBe(2024);
    expect(result?.getUTCMonth()).toBe(6);
    expect(result?.getUTCDate()).toBe(15);
  });

  it('handles year rollover (Nov + 3 = Feb next year)', () => {
    const result = calculateNextServiceDate('2024-11-01T00:00:00.000Z', 3);
    expect(result).not.toBeNull();
    expect(result?.getUTCFullYear()).toBe(2025);
    expect(result?.getUTCMonth()).toBe(1);
    expect(result?.getUTCDate()).toBe(1);
  });

  it('handles month-end overflow (Jan 31 + 1 month)', () => {
    const result = calculateNextServiceDate('2024-01-31T00:00:00.000Z', 1);
    expect(result).not.toBeNull();
    expect(result?.getUTCMonth()).toBe(2);
  });
});

describe('calculateReminderDate', () => {
  it('returns exactly 7 days before the input date', () => {
    const nextService = new Date(Date.UTC(2024, 0, 15));
    const result = calculateReminderDate(nextService);
    expect(result).not.toBeNull();
    expect(result?.getUTCFullYear()).toBe(2024);
    expect(result?.getUTCMonth()).toBe(0);
    expect(result?.getUTCDate()).toBe(8);
    expect(result?.getUTCHours()).toBe(0);
  });
});

describe('shouldNotify', () => {
  it('returns true when today equals the reminder date', () => {
    const reminder = new Date(Date.UTC(2024, 4, 10));
    const today = new Date(Date.UTC(2024, 4, 10, 9));
    expect(shouldNotify(reminder, today)).toBe(true);
  });

  it('returns true when today is after the reminder date', () => {
    const reminder = new Date(Date.UTC(2024, 4, 10));
    const today = new Date(Date.UTC(2024, 4, 12));
    expect(shouldNotify(reminder, today)).toBe(true);
  });

  it('returns false when today is before the reminder date', () => {
    const reminder = new Date(Date.UTC(2024, 4, 10));
    const today = new Date(Date.UTC(2024, 4, 9));
    expect(shouldNotify(reminder, today)).toBe(false);
  });
});
