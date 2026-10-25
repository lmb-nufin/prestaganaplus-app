import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('Oferta del teléfono dentro de Préstamo Personal', () => {
  test('elegible: ve Efectivo y el Galaxy con precio y enganche de la API', async ({ context, page }) => {
    await login(context, '1000006');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Préstamo Personal/ }).click();

    await expect(page.getByRole('button', { name: /Efectivo/ })).toBeEnabled();
    const card = page.getByTestId('phone-offer-option');
    await expect(card).toContainText('Samsung Galaxy A17 4G 128GB');
    await expect(card).toContainText('Precio $4,499.00');
    await expect(card).toContainText('Enganche $225.00');
    await expect(card.getByRole('img', { name: 'Samsung Galaxy A17 4G' })).toBeVisible();

    await card.getByRole('link').click();
    await expect(page).toHaveURL(/\/telefono$/);
  });

  test('comparativo 12 vs 18 quincenas con datos de la API', async ({ context, page }) => {
    await login(context, '1000006');
    await page.goto('/telefono');
    await expect(page.getByTestId('phone-price')).toHaveText('$4,499.00');
    await expect(page.getByTestId('phone-down-payment')).toHaveText('$225.00');
    const plan12 = page.getByTestId('plan-12');
    const plan18 = page.getByTestId('plan-18');
    await expect(plan12).toContainText('$445.00');
    await expect(plan12).toContainText('$5,340.00');
    await expect(plan18).toContainText('$320.00');
    await expect(plan18).toContainText('$5,760.00');
    await expect(page.getByText('Con este equipo tus vales solo se emiten desde él.')).toBeVisible();
    await expect(page.getByText('Consultar saldo, pagar y soporte funcionan desde cualquier dispositivo.')).toBeVisible();
    // Sin plan ni aceptación no se puede solicitar.
    await expect(page.getByRole('button', { name: 'Solicitar' })).toBeDisabled();
    await plan18.click();
    await expect(page.getByRole('button', { name: 'Solicitar' })).toBeDisabled();
    await page.getByLabel(/Acepto las condiciones/).check();
    await expect(page.getByRole('button', { name: 'Solicitar' })).toBeEnabled();
  });

  test('no elegible: opción deshabilitada con el motivo de la API', async ({ context, page }) => {
    await login(context, '1000015');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Préstamo Personal/ }).click();
    const card = page.getByTestId('phone-offer-option');
    await expect(card.getByRole('link')).toHaveCount(0);
    await expect(card).toContainText('Por ahora no tienes una oferta de equipo disponible.');
    // Efectivo sigue disponible para ella.
    await expect(page.getByRole('button', { name: /Efectivo/ })).toBeEnabled();
  });

  test('con solicitud en proceso: deshabilitada con el folio', async ({ context, page }) => {
    await login(context, '1000007');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Préstamo Personal/ }).click();
    const card = page.getByTestId('phone-offer-option');
    await expect(card.getByRole('link')).toHaveCount(0);
    await expect(card).toContainText('Ya tienes una solicitud de equipo en proceso.');
    await expect(card).toContainText('TEL-1000007-DEMO');
    await page.goto('/telefono');
    await expect(page.getByTestId('phone-offer-unavailable')).toBeVisible();
  });

  test('atrasada: Préstamo Personal deshabilitado (ni efectivo ni teléfono)', async ({ context, page }) => {
    await login(context, '1000002');
    await page.goto('/vales/nuevo');
    await expect(page.getByRole('button', { name: /Préstamo Personal/ })).toBeDisabled();
    await expect(page.getByText('Necesitas estar al día')).toBeVisible();
  });

  test('servicio caído: fail-closed en la oferta y en la emisión', async ({ context, page }) => {
    await login(context, '1000016');
    await page.goto('/telefono');
    await expect(page.getByTestId('phone-offer-unavailable')).toContainText('Servicio no disponible');
    await expect(page.getByRole('button', { name: 'Solicitar' })).toHaveCount(0);
    // Sin poder leer el estado del teléfono, no se emiten vales.
    await page.goto('/vales/nuevo');
    await expect(page.getByTestId('issuance-blocked')).toContainText('Servicio no disponible');
    await expect(page.getByRole('button', { name: /Cliente Nuevo/ })).toHaveCount(0);
  });
});
