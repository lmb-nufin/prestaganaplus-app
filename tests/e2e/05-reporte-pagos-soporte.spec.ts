import { expect, test } from '@playwright/test';
import { DEVICE_REPORTED, login } from './helpers';

test.describe('Reportar mi equipo', () => {
  test('reporta por robo, muestra siguientes pasos y bloquea la emisión', async ({ context, page }) => {
    await login(context, '1000013');
    await page.goto('/perfil');
    await page.getByRole('button', { name: 'Reportar mi equipo' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Confirmar reporte' })).toBeDisabled();
    await dialog.getByLabel('Me lo robaron').check();
    await dialog.getByRole('button', { name: 'Confirmar reporte' }).click();
    const done = page.getByTestId('device-report-done');
    await expect(done).toContainText('Equipo reportado');
    await expect(done).toContainText('levanta tu denuncia');

    await page.goto('/perfil');
    await expect(page.getByTestId('device-report-done')).toContainText('Acude a sucursal para reactivar');
    await expect(page.getByRole('button', { name: 'Reportar mi equipo' })).toHaveCount(0);

    await page.goto('/vales/nuevo?demoDevice=1');
    await expect(page.getByTestId('issuance-blocked')).toContainText(DEVICE_REPORTED);
  });

  test('sin equipo no aparece el botón', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/perfil');
    await expect(page.getByText('Mi Perfil')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reportar mi equipo' })).toHaveCount(0);
  });
});

test.describe('Pagar y soporte nunca se bloquean', () => {
  for (const associate of ['1000011', '1000012', '1000014', '1000016']) {
    test(`asociada ${associate}`, async ({ context, page }) => {
      await login(context, associate);
      await page.goto('/');
      await page.getByRole('button', { name: 'Pagar Ahora' }).last().click();
      await expect(page.getByRole('dialog')).toContainText('CLABE');
      await page.keyboard.press('Escape');
      await page.goto('/soporte');
      await expect(page.getByText('Centro de Soporte')).toBeVisible();
      await expect(page.getByRole('link', { name: /WhatsApp|Chatear|Iniciar/ }).first()).toBeVisible();
    });
  }
});
