import { expect, it } from 'vitest';
import { requiredFinalGrade, requiredFinalPoints } from '../../src/utils/final-grade';

it('solves weighted finals and rounds a minimum upward to a hundredth', () => {
  expect(requiredFinalGrade(88, 90, 20)).toBe(98);
  expect(requiredFinalGrade(80, 81, 30)).toBe(83.34);
  expect(requiredFinalGrade(91.26, 91.26, 0.01)).toBe(91.26);
  expect(requiredFinalGrade(60, 90, 20)).toBeGreaterThan(100);
  expect(requiredFinalGrade(100, 80, 20)).toBe(0);
});

it('rounds the points needed on a whole-point exam upward', () => {
  expect(requiredFinalPoints(420, 500, 100, 85)).toBe(90);
  expect(requiredFinalPoints(9, 10, 7, 80)).toBe(5);
});
