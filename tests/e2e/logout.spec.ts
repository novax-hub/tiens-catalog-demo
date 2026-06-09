import { test, expect } from '@playwright/test';

test('logout via form clears cookie and redirects to login', async ({ page, context }) => {
  // Seed a session cookie so logout has something to clear
  await context.addCookies([
    {
      name: 'tiens_auth_session',
      value: 'dummy-session',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
    },
  ]);

  await page.goto('/admin');

  // Create and submit a form POST to /api/auth/logout so the browser applies Set-Cookie
  await page.evaluate(() => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/logout';
    document.body.appendChild(form);
    form.submit();
  });

  // After submit the browser should navigate; wait for login page
  await page.waitForURL('**/admin/login', { timeout: 5000 });

  const cookieString = await page.evaluate(() => document.cookie);
  expect(cookieString).not.toContain('tiens_auth_session');
});
