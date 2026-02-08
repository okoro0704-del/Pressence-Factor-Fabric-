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

  test('self-test: flow from language setup through to identity anchor (Step 2)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);

    // Wait for initial loading to settle (Verifying Presence or gate content)
    await page.waitForLoadState('domcontentloaded');
    const loading = page.getByText(/Verifying Presence|Loading\.\.\./i);
    const step1 = page.getByText('Step 1 of 4').first();
    const confirmLanguage = page.getByRole('heading', { name: /Confirm Language/i }).first();
    const languageOptions = page.getByRole('listbox', { name: /Language options/i });

    await expect(loading.or(step1).or(confirmLanguage).or(languageOptions).first()).toBeVisible({ timeout: 20000 });

    // If we're still loading, wait for it to disappear and language step to show
    await loading.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    const step1Now = page.getByText('Step 1 of 4').first();
    const langHeading = page.getByRole('heading', { name: /Confirm Language/i }).first();
    const listbox = page.getByRole('listbox', { name: /Language options/i });

    await expect(step1Now.or(langHeading).or(listbox).first()).toBeVisible({ timeout: 10000 });

    // Select English (role=option with text English or nativeName)
    const englishOption = page.getByRole('option').filter({ hasText: /English/i }).first();
    await englishOption.click();

    // Confirm & Continue
    const confirmBtn = page.getByRole('button', { name: /Confirm & Continue/i });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Should land on Step 2 of 4: Identity Anchor (phone number)
    const step2 = page.getByText('Step 2 of 4').first();
    const identityAnchorHeading = page.getByText(/Identity Anchor Required|Identity Anchor/i).first();
    const phoneInput = page.getByPlaceholder(/phone|number|\+234|\+1/i).first();

    await expect(step2.or(identityAnchorHeading).or(phoneInput).first()).toBeVisible({ timeout: 15000 });

    // Flow from language setup completed successfully to identity step
    const onStep2 = await step2.isVisible().catch(() => false) || await identityAnchorHeading.isVisible().catch(() => false);
    expect(onStep2).toBe(true);
  });
});
