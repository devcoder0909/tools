import { describe, expect, it } from 'vitest';
import { countDateRange } from '../../src/utils/date-range';

describe('date range workdays', () => {
  it('separates the observed holiday from ordinary weekdays and follows the end-date setting', () => {
    expect(countDateRange('2027-12-31', '2027-12-30', true)).toMatchObject({ weekdays: 2, federalWorkdays: 1 });
    expect(countDateRange('2027-12-30', '2027-12-31', false)).toMatchObject({ weekdays: 1, federalWorkdays: 1 });
    expect(countDateRange('2027-12-31', '2027-12-31', false)).toMatchObject({ totalDays: 0, weekdays: 0, federalWorkdays: 0 });
  });

  it('counts calendar dates across DST, leap years and calendar boundaries', () => {
    expect(countDateRange('2026-03-06', '2026-03-09', true)).toMatchObject({ totalDays: 4, weekends: 2, weekdays: 2 });
    expect(countDateRange('2024-02-28', '2024-03-01', true)).toMatchObject({ totalDays: 3, federalWorkdays: null });
    expect(countDateRange('2025-12-31', '2026-01-02', true)?.federalWorkdays).toBeNull();
    expect(countDateRange('2026-12-31', '2027-01-04', true)?.federalWorkdays).toBe(2);
    expect(countDateRange('0099-12-31', '0100-01-01', true)?.totalDays).toBe(2);
  });

  it('rejects incomplete and impossible dates', () => {
    expect(countDateRange('', '2027-01-01', true)).toBeNull();
    expect(countDateRange('2026-02-29', '2026-03-01', true)).toBeNull();
  });
});
