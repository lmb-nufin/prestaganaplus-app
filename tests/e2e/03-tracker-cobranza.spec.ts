import { expect, test } from '@playwright/test';
import { login } from './helpers';

const TRACKER_CASES = [
  { associate: '1000007', step: 'Solicitado', todo: 'Transfiere el enganche' },
  { associate: '1000008', step: 'Enganche confirmado', todo: 'Recibimos tu enganche' },
  { associate: '1000009', step: 'En preparación', todo: 'Estamos configurando' },
  { associate: '1000010', step: 'Listo para recoger', todo: 'Recógelo en tu sucursal con tu INE; ahí firmas tu contrato.' },
  { associate: '1000011', step: 'Activo', todo: 'tus vales se emiten desde él' },
];

test.describe('Tracker en el dashboard', () => {
  for (const { associate, step, todo } of TRACKER_CASES) {
    test(`estatus ${step}`, async ({ context, page }) => {
      await login(context, associate);
      await page.goto('/');
      const tracker = page.getByTestId('phone-tracker');
      await expect(tracker.getByTestId('phone-tracker-current')).toHaveText(new RegExp(step));
      await expect(tracker.locator('[aria-current="step"]')).toHaveCount(1);
      await expect(tracker.getByTestId('phone-tracker-todo')).toContainText(todo);
    });
  }

  test('sin solicitud ni equipo no hay tarjeta', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/');
    await expect(page.getByText('Línea PrestaGana')).toBeVisible();
    await expect(page.getByTestId('phone-tracker')).toHaveCount(0);
    await expect(page.getByTestId('collection-breakdown')).toHaveCount(0);
  });
});

test.describe('Desglose de cobranza y mora del teléfono', () => {
  test('Monto a Pagar se desglosa en Vales y Teléfono', async ({ context, page }) => {
    await login(context, '1000011');
    await page.goto('/');
    const breakdown = page.getByTestId('collection-breakdown');
    await expect(breakdown).toContainText('Vales$1,200.00');
    await expect(breakdown).toContainText('Teléfono · cuota 3 de 18$320.00');
    await expect(breakdown).toContainText('Saldo del equipo$4,800.00');
    await expect(page.getByTestId(/phone-mora-/)).toHaveCount(0);
  });

  test('mora AVISO con monto y botón Pagar', async ({ context, page }) => {
    await login(context, '1000013');
    await page.goto('/');
    const alert = page.getByTestId('phone-mora-AVISO');
    await expect(alert).toContainText('Pago del equipo pendiente');
    await expect(alert).toContainText('Debes $320.00 del equipo (3 días de atraso).');
    await alert.getByRole('button', { name: 'Pagar Ahora' }).click();
    await expect(page.getByRole('dialog')).toContainText('CLABE');
    // El teléfono va con su cuota más la mora; los vales quedan igual.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('collection-breakdown')).toContainText('Vales$1,200.00');
    await expect(page.getByTestId('collection-breakdown')).toContainText('$640.00');
  });

  test('mora GRACIA con monto', async ({ context, page }) => {
    await login(context, '1000014');
    await page.goto('/');
    const alert = page.getByTestId('phone-mora-GRACIA');
    await expect(alert).toContainText('periodo de gracia');
    await expect(alert).toContainText('Debes $960.00 del equipo (12 días de atraso).');
    await expect(alert.getByRole('button', { name: 'Pagar Ahora' })).toBeEnabled();
  });
});
