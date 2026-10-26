import { expect, test } from '@playwright/test';
import { login } from './helpers';

// Lo que la app en producción ya tiene y la app nueva debe igualar (docs/specs/paridad-produccion.md).

test.describe('Paridad con producción', () => {
  test('montos y plazos del vale de cliente nuevo', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await page.getByRole('combobox').nth(0).click();
    await expect(page.getByRole('option')).toHaveText(['$5,000.00', '$5,500.00']);
    await page.keyboard.press('Escape');
    await page.getByRole('combobox').nth(1).click();
    await expect(page.getByRole('option')).toHaveText(['8 Quincenas', '10 Quincenas', '12 Quincenas']);
  });

  test('montos del vale de cliente existente llegan a $9,000', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Existente/ }).click();
    await page.locator('#curp').fill('PEGJ900101MDFRRN01');
    await page.locator('#curp-confirm').fill('PEGJ900101MDFRRN01');
    await page.getByRole('button', { name: 'Buscar Cliente' }).click();
    await page.getByRole('combobox').nth(0).click();
    const options = page.getByRole('option');
    await expect(options.first()).toHaveText('$5,000.00');
    await expect(options.last()).toHaveText('$9,000.00');
    await expect(options).toHaveCount(9);
  });

  test('números de soporte', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/soporte');
    await expect(page.locator('a[href="https://wa.me/5533349279"]')).toHaveCount(1);
    await expect(page.locator('a[href="tel:5662302984"]')).toHaveCount(1);
  });

  test('cierra la sesión tras 5 minutos sin actividad; el scroll del contenido cuenta como actividad', async ({ context, page }) => {
    await page.clock.install();
    await login(context, '1000011');
    await page.goto('/');
    await expect(page.getByText('Línea PrestaGana')).toBeVisible();

    // 4 minutos, scroll dentro del contenido y otros 4: sigue dentro.
    await page.clock.fastForward('04:00');
    await page.getByTestId('app-scroll').evaluate((el) => el.scrollTo(0, 400));
    await page.clock.fastForward('04:00');
    await expect(page).toHaveURL(/\/$/);

    // Más de 5 minutos sin nada: regresa al login.
    await page.clock.fastForward('05:30');
    await expect(page).toHaveURL(/\/login/);
  });
});
