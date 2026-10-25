import { expect, test } from '@playwright/test';
import { login, openPhoneTracker } from './helpers';

test.describe('Solicitud del teléfono', () => {
  test('crea folio, aparece el tracker y una segunda pestaña ya no puede solicitar', async ({ context, page }) => {
    await login(context, '1000006');

    // Las dos pestañas cargan la oferta antes de que exista la solicitud.
    const second = await context.newPage();
    await page.goto('/telefono');
    await second.goto('/telefono');

    await page.getByTestId('plan-18').click();
    await page.getByLabel(/Acepto las condiciones/).check();
    await page.getByRole('button', { name: 'Solicitar' }).click();
    const confirmation = page.getByTestId('phone-request-confirmation');
    await expect(confirmation).toContainText('Transfiere el enganche a la CLABE de tu línea. Se registra automáticamente.');
    await expect(confirmation.getByTestId('phone-down-payment-transfer')).toContainText('$225.00');
    await expect(confirmation.getByTestId('phone-clabe')).toHaveText(/^\d{18}$/);
    await expect(confirmation).toContainText(/Folio TEL-1000006-[A-Z0-9]{6}/);

    await second.getByTestId('plan-12').click();
    await second.getByLabel(/Acepto las condiciones/).check();
    await second.getByRole('button', { name: 'Solicitar' }).click();
    await expect(second.getByText('Ya tienes una solicitud de equipo en proceso.')).toBeVisible();
    await expect(second.getByTestId('phone-request-confirmation')).toHaveCount(0);

    await page.goto('/');
    const tracker = page.getByTestId('phone-tracker');
    await expect(tracker).toBeVisible();
    await expect(tracker.getByTestId('phone-tracker-summary')).toHaveText('Solicitado');
    await expect(tracker.getByTestId('phone-tracker-step')).toHaveText('Paso 1 de 5');
    await openPhoneTracker(page);
    await expect(tracker.getByTestId('phone-tracker-current')).toHaveText(/Solicitado/);
    await expect(tracker.getByTestId('phone-tracker-todo')).toContainText('Transfiere el enganche a la CLABE de tu línea. Se registra automáticamente.');

    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Préstamo Personal/ }).click();
    await expect(page.getByTestId('phone-offer-option')).toContainText('Ya tienes una solicitud de equipo en proceso.');
  });

  test('la solicitud cancelada permite volver a solicitar', async ({ context, page }) => {
    await login(context, '1000017');
    await page.goto('/');
    await expect(page.getByTestId('phone-tracker-summary')).toHaveText('Solicitud cancelada');
    await openPhoneTracker(page);
    await expect(page.getByTestId('phone-tracker-cancelled')).toBeVisible();
    await page.goto('/telefono');
    await expect(page.getByTestId('plan-12')).toBeVisible();
  });
});
