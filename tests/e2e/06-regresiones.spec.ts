import { expect, test } from '@playwright/test';
import { confirmNewVale, fillNewClientForm, fillPersonalCash, login, pickOption, signWithOtp } from './helpers';

// Asociada sin teléfono: los flujos de siempre deben funcionar igual.
test.describe('Regresiones (1000001, sin equipo)', () => {
  test('vale de cliente nuevo con fecha correcta y firma OTP + NIP', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await expect(page.getByTestId('device-signature-on')).toHaveCount(0);
    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await fillNewClientForm(page);
    await confirmNewVale(page);
    await expect(page).toHaveURL(/\/sign\/1000001-/);
    await expect(page.getByText('15 de mayo, 1985')).toBeVisible();
    await signWithOtp(page);
    await expect(page.getByText('FIRMADO', { exact: true })).toBeVisible();
  });

  test('vale de cliente existente con fecha correcta', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Existente/ }).click();
    await page.locator('#curp').fill('PEGJ900101MDFRRN01');
    await page.locator('#curp-confirm').fill('PEGJ900101MDFRRN01');
    await page.getByRole('button', { name: 'Buscar Cliente' }).click();
    await expect(page.getByLabel('Nombre(s)')).toHaveValue('JUANA');
    await expect(page.locator('input[name="birthDate"]')).toHaveValue('1990-01-01');
    await pickOption(page, 0, '$8,500.00');
    await pickOption(page, 1, '14 Quincenas');
    await confirmNewVale(page);
    await expect(page).toHaveURL(/\/sign\/1000001-/);
    await expect(page.getByText('1 de enero, 1990')).toBeVisible();
  });

  test('préstamo personal en efectivo y firma', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await fillPersonalCash(page, '$6,000.00', '12 Quincenas');
    await expect(page).toHaveURL(/\/sign\/1000001-/);
    await expect(page.getByText('Préstamo Personal').first()).toBeVisible();
    await expect(page.getByText('15 de enero, 1990')).toBeVisible();
    await signWithOtp(page);
    await expect(page.getByText('FIRMADO', { exact: true })).toBeVisible();

    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Préstamo Personal/ }).click();
    await expect(page.getByRole('button', { name: /Efectivo/ })).toBeDisabled();
    await expect(page.getByText('Ya tienes un préstamo activo')).toBeVisible();
  });

  test('sin scroll horizontal en la pantalla de oferta', async ({ context, page }) => {
    await login(context, '1000017');
    await page.goto('/telefono');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
