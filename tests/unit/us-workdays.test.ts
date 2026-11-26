import { describe, expect, it } from 'vitest';
import { getUsWorkdayMonths } from '../../src/utils/us-workdays';

describe('US federal monthly workday calendar', () => {
  it.each([[2026, 250], [2027, 249]])('counts federal workdays in calendar year %i', (year, workdays) => {
    const rows = getUsWorkdayMonths(year);
    expect(rows).toHaveLength(12);
    expect(rows.reduce((total, row) => total + row.weekdays, 0)).toBe(261);
    expect(rows.reduce((total, row) => total + row.workdays, 0)).toBe(workdays);
  });

  it('uses observed dates for Independence Day on a Saturday or Sunday', () => {
    const july = (year: number) => getUsWorkdayMonths(year)[6];
    expect(july(2026)).toMatchObject({ month: 7, monthName: 'July', weekdays: 23, workdays: 22, holidays: [{ date: '2026-07-03' }] });
    expect(july(2027)).toMatchObject({ month: 7, monthName: 'July', weekdays: 22, workdays: 21, holidays: [{ date: '2027-07-05' }] });
  });

  it('counts New Year 2028 in the month of its observed closure', () => {
    const december = getUsWorkdayMonths(2027)[11];
    expect(december.holidays.map(holiday => holiday.date)).toEqual(['2027-12-24', '2027-12-31']);
    expect(december.workdays).toBe(21);
  });

  it('rejects years outside the published coverage', () => {
    expect(() => getUsWorkdayMonths(2028)).toThrow(RangeError);
  });
});
