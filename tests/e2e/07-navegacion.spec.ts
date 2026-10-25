import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('Navegación y regreso', () => {
  test('Vale Nuevo: cada paso regresa al anterior con la flecha y con el botón de atrás', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');

    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await expect(page).toHaveURL(/paso=datos/);
    await expect(page.getByText('Vale para Cliente Nuevo')).toBeVisible();

    // Atrás del navegador (o de Android) regresa a la elección, no sale del asistente.
    await page.goBack();
    await expect(page).toHaveURL(/\/vales\/nuevo$/);
    await expect(page.getByText('Crear Nuevo Vale')).toBeVisible();

    await page.getByRole('button', { name: /Préstamo Personal/ }).click();
    await expect(page).toHaveURL(/paso=personal/);
    await page.getByRole('button', { name: 'Regresar al paso anterior' }).click();
    await expect(page.getByText('Crear Nuevo Vale')).toBeVisible();

    // En la elección, la flecha sale a Vales.
    await page.getByRole('button', { name: 'Volver a Vales' }).click();
    await expect(page).toHaveURL(/\/vales$/);
  });

  test('desde el teléfono, la flecha regresa a Préstamo Personal', async ({ context, page }) => {
    // 1000017 tiene una solicitud cancelada y puede volver a pedir; 1000006 lo usa la prueba de solicitud.
    await login(context, '1000017');
    await page.goto('/telefono');
    await expect(page.getByTestId('phone-submit-hint')).toHaveText('Elige tu plazo y acepta las condiciones para solicitar.');
    await page.getByTestId('plan-12').click();
    await expect(page.getByTestId('phone-submit-hint')).toHaveText('Acepta las condiciones para solicitar.');

    await page.getByRole('link', { name: 'Volver a Préstamo Personal' }).click();
    await expect(page).toHaveURL(/paso=personal/);
    await expect(page.getByTestId('phone-offer-option')).toBeVisible();
  });

  test('un folio que no existe avisa en Vales', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/sign/NO-EXISTE');
    await expect(page).toHaveURL(/\/vales\?aviso=folio-no-encontrado/);
    await expect(page.getByTestId('vales-notice')).toContainText('No encontramos ese vale');
  });

  test('notificaciones: abrir marca como leída y borrar no regresa al recargar', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/notificaciones');
    await expect(page.getByText('Recuerda tu pago quincenal')).toBeVisible();

    await page.getByText('Recuerda tu pago quincenal').click();
    await expect(page.getByRole('link', { name: 'Ver mi monto' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: /Leídas/ }).last().click();
    await expect(page.getByText('Recuerda tu pago quincenal')).toBeVisible();

    await page.getByRole('tab', { name: /No leídas/ }).click();
    const first = page.getByText('Comparte tus vales por WhatsApp');
    await expect(first).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar' }).first().click();
    await expect(first).toHaveCount(0);

    await page.reload();
    await expect(page.getByText('Comparte tus vales por WhatsApp')).toHaveCount(0);
  });
});
