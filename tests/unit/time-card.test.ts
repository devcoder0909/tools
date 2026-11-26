import { describe, expect, it } from 'vitest';
import { calculateShift, calculateTimeCard, formatDecimalHours, formatHoursMinutes, type ShiftInput } from '../../src/utils/time-card';

const blank: ShiftInput = { start: '', end: '', nextDay: false, breakMinutes: '' };

describe('weekly time card', () => {
  it('deducts break minutes and adds the exact durations before rounding', () => {
    const card = calculateTimeCard([
      { ...blank, start: '08:45', end: '17:10', breakMinutes: '40' },
      { ...blank, start: '09:00', end: '17:00', breakMinutes: '30' },
      { start: '22:00', end: '06:00', nextDay: true, breakMinutes: '30' },
      blank,
    ]);
    expect([card.validCount, card.invalidCount]).toEqual([3, 0]);
    expect(formatHoursMinutes(card.totalMinutes)).toBe('22:45');
    expect(formatDecimalHours(card.totalMinutes)).toBe('22.75');
  });

  it('separates incomplete rows from days off and completed shifts', () => {
    const card = calculateTimeCard([blank, { ...blank, start: '08:00' }, { ...blank, start: '08:00', end: '08:01' }]);
    expect(card.shifts.map(s => s.status)).toEqual(['empty', 'invalid', 'valid']);
    expect(card.totalMinutes).toBe(1);
    expect(formatDecimalHours(card.totalMinutes)).toBe('0.02');
  });

  it('checks overnight intent and break boundaries', () => {
    const shift = { ...blank, start: '23:00', end: '01:00' };
    expect(calculateShift(shift).status).toBe('invalid');
    for (const breakMinutes of ['121', '-1', '3.5']) {
      expect(calculateShift({ ...shift, nextDay: true, breakMinutes }).status).toBe('invalid');
    }
    expect(calculateShift({ ...shift, nextDay: true, breakMinutes: '120' })).toEqual({ status: 'valid', minutes: 0 });
    expect(calculateShift({ ...shift, nextDay: true, end: '23:00' })).toEqual({ status: 'valid', minutes: 1440 });
  });
});
