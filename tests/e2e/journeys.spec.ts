import { test, expect, type Page } from '@playwright/test';
async function login(page: Page, role: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(`${role}@driveshare.demo`);
  await page.getByLabel('Password', { exact: true }).fill('DriveShareDemo!23');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('link', { name: 'My dashboard' })).toBeVisible();
}
test('landing, location search, interactive local map and synchronized listing', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your spot/ })).toBeVisible();
  await page.getByLabel('Where are you headed?').fill('Bengaluru');
  await page.getByRole('button', { name: 'Find a space' }).click();
  await expect(page.getByRole('heading', { name: 'Less searching. More arriving.' })).toBeVisible();
  await expect(page.getByText('Local demo map · fictional area')).toBeVisible();
  await expect(
    page.getByText('Offline map illustration. Parking search and bookings still work.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'View on map' }).first().click();
  await expect(page.getByRole('button', { name: 'On map', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Maximum hourly price' }).selectOption('25');
  await expect(page.locator('.spot-card')).toHaveCount(2);
});
test('registration creates a real account and garage accepts a vehicle', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Playwright Neighbor');
  await page.getByLabel('Email address').fill(`browser-${Date.now()}@driveshare.demo`);
  await page.getByLabel('Password', { exact: true }).fill('BrowserDemo!123');
  await page.getByRole('button', { name: 'Create your account' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Playwright.' })).toBeVisible();
  await page.goto('/vehicles');
  await page.getByLabel('Vehicle model').fill('Browser Swift');
  await page.getByLabel('Registration number').fill('DEMO E2E 1234');
  await page.getByRole('button', { name: 'Add to my garage' }).click();
  await expect(page.getByRole('heading', { name: 'Browser Swift' })).toBeVisible();
});
test('driver reserves, retries a failed demo payment, confirms, then cancels', async ({ page }) => {
  await login(page, 'driver4');
  await page.goto('/explore');
  await page.getByRole('link', { name: 'Maple Court · East Wing', exact: true }).click();
  await page.getByRole('button', { name: 'Reserve this space' }).click();
  await expect(page.getByRole('heading', { name: 'Make this space yours.' })).toBeVisible();
  await expect(page.getByText('DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED')).toBeVisible();
  await page.getByRole('button', { name: 'Simulate Payment Failure' }).click();
  await expect(page.getByRole('alert')).toContainText('Simulated payment failed');
  await page.getByRole('button', { name: 'Complete Demo Payment' }).click();
  await expect(page.locator('.page-title .badge')).toHaveText('confirmed');
  await expect(page.getByRole('heading', { name: 'Your reservation', exact: true })).toBeVisible();
  page.on('dialog', async (dialog) => {
    if (dialog.type() === 'prompt') await dialog.accept('Demonstrating a fair cancellation');
    else await dialog.accept();
  });
  await page.getByRole('button', { name: 'Cancel booking', exact: true }).click();
  await expect(page.locator('.page-title .badge')).toHaveText('cancelled');
  await expect(page.locator('.payment-mini').filter({ hasText: 'refund' })).toContainText('-');
});
test('host workspace, listing edit and schedule management are connected', async ({ page }) => {
  await login(page, 'owner');
  await expect(page.getByRole('heading', { name: 'Welcome home, Meera.' })).toBeVisible();
  await page.getByRole('link', { name: 'My parking spaces', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your parking spaces', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Availability', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Recurring availability' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Day', exact: true })).toHaveCount(7);
  await page.getByRole('button', { name: 'Save recurring hours' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Recurring availability saved.' }),
  ).toBeVisible();
});
test('administrator reviews pending listing and sees protected dispute controls', async ({
  page,
}) => {
  await login(page, 'admin');
  await expect(page.getByRole('heading', { name: 'A clearer view.' })).toBeVisible();
  await page.getByRole('link', { name: 'Listing approvals', exact: true }).click();
  const card = page
    .locator('.owner-spot')
    .filter({ has: page.getByRole('heading', { name: 'The Quiet Driveway', exact: true }) });
  await expect(card.locator('.badge')).toHaveText('pending');
  page.on('dialog', (dialog) => dialog.accept('Permission and fictional listing reviewed.'));
  await card.getByRole('button', { name: 'Approve listing' }).click();
  await expect(card.locator('.badge')).toHaveText('approved');
  await page.getByRole('link', { name: 'Disputes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A fair resolution.' })).toBeVisible();
  await expect(
    page.getByText(
      'The host was delayed confirming my departure. Please review this demonstration fine.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record resolution' }).first()).toBeVisible();
});
test('mobile discovery fits the viewport and map can be hidden', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/explore');
  await expect(page.getByText('Local demo map · fictional area')).toBeVisible();
  await page.getByRole('button', { name: 'Hide map' }).click();
  await expect(page.locator('.parking-map')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Show map' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
