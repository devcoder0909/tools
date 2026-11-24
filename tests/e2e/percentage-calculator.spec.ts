import { expect, test } from '@playwright/test';

test('percentage difference compares either order and handles zero', async ({ page }) => {
  await page.goto('/percentage-calculator/');
  await page.getByRole('button', { name: 'Percentage difference' }).click();
  const first = page.getByLabel('First measurement');
  const second = page.getByLabel('Second measurement');
  const calculator = page.locator('.calculator-shell');
  for (const [a, b, answer] of [
    ['80', '92', '13.95%'],
    ['92', '80', '13.95%'],
    ['12', '12', '0%'],
    ['0', '12', '200%'],
    ['0', '0', 'Undefined because both values are zero'],
    ['-1', '2', 'Enter two nonnegative measurements'],
  ]) {
    await first.fill(a);
    await second.fill(b);
    await expect(calculator.getByText(answer, { exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: '% Change from X to Y' }).click();
  await page.getByLabel('Initial Value (From)').fill('80');
  await page.getByLabel('Final Value (To)').fill('92');
  await expect(calculator.getByText('15% increase', { exact: true })).toBeVisible();
});
