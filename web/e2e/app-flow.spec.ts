import { test, expect } from '@playwright/test';

test.describe('PFF App flows', () => {
  test('home page loads and shows gate or loading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const loading = page.getByText(/Loading\.\.\.|Verifying Presence/i);
    const gateContent = page.getByRole('button', { name: /start|scan|continue|verify|identity|continue with face/i }).or(
      page.getByPlaceholder(/phone|number|\+1/i)
    ).or(page.getByText(/identity anchor|4-layer|gate|presence|vitalization/i));
    await expect(loading.or(gateContent).first()).toBeVisible({ timeout: 15000 });
  });

  test('manifesto page loads', async ({ page }) => {
    await page.goto('/manifesto/');
    await expect(page).toHaveURL(/\/manifesto/);
    await expect(page.locator('body')).toBeVisible();
    const titleOrContent = page.getByText(/manifesto|vitalization|born in lagos|presence factor fabric/i).first();
    await expect(titleOrContent).toBeVisible({ timeout: 10000 });
  });

  test('vitalize register page loads', async ({ page }) => {
    await page.goto('/vitalize/register/');
    await expect(page).toHaveURL(/\/vitalize\/register/);
    await expect(page.locator('body')).toBeVisible();
    const formOrTitle = page.getByRole('heading').or(page.getByRole('form')).or(page.getByText(/register|vitalize/i)).first();
    await expect(formOrTitle).toBeVisible({ timeout: 10000 });
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
    const loginContent = page.getByText(/login|sign in|remote|qr|sovereign id|handshake/i).first();
    await expect(loginContent).toBeVisible({ timeout: 10000 });
  });

  test('dashboard redirects to home when not verified', async ({ page }) => {
    await page.goto('/dashboard/');
    await page.waitForURL(
      (url) => (url.pathname.replace(/\/$/, '') || '/') === '/',
      { timeout: 15000 }
    );
    const pathname = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
    expect(pathname).toBe('/');
  });

  test('pulse page loads', async ({ page }) => {
    await page.goto('/pulse/');
    await expect(page).toHaveURL(/\/pulse/);
    await expect(page.locator('body')).toBeVisible();
    const content = page.getByText(/pulse|national|vida/i).first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

});
