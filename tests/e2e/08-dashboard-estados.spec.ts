import { expect, test, type Page } from '@playwright/test';
import { NIP, captureNextServerAction, confirmNewVale, fillNewClientForm, login, openPhoneTracker, replayServerAction } from './helpers';

const ALL_DEMO = Array.from({ length: 17 }, (_, i) => String(1000001 + i));
const PAUSED_MESSAGE = 'Reportaste tu Teléfono PrestaGana. Acude a tu sucursal para reactivarlo.';

async function loginWithForm(page: Page, associateNumber: string) {
  await page.locator('#associateNumber').fill(associateNumber);
  await page.locator('#nip').fill(NIP);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

async function expectBellNotBack(page: Page) {
  await expect(page.getByRole('link', { name: 'Notificaciones' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Regresar' })).toHaveCount(0);
}

test.describe('Login termina en el dashboard con la URL correcta', () => {
  for (const associate of ALL_DEMO) {
    test(`asociada ${associate}`, async ({ page }) => {
      await page.goto('/login');
      await loginWithForm(page, associate);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText('Línea PrestaGana')).toBeVisible();
      await expectBellNotBack(page);
    });
  }

  test('regresa a la ruta interna de callbackUrl', async ({ page }) => {
    await page.goto('/vales');
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
    await loginWithForm(page, '1000001');
    await expect(page).toHaveURL(/\/vales$/);
  });

  for (const external of ['https%3A%2F%2Fexample.com%2Fphish', '%2F.%2F%2Fexample.com', '%2F%5Cexample.com']) {
    test(`ignora un callbackUrl externo (${external})`, async ({ page }) => {
      await page.goto(`/login?callbackUrl=${external}`);
      await loginWithForm(page, '1000001');
      await expect(page).toHaveURL(/localhost:\d+\/$/);
      await expectBellNotBack(page);
    });
  }
});

test.describe('Equipo reportado (1000012): emisión en pausa en el dashboard', () => {
  test('aviso, Vale Nuevo deshabilitado y mensaje al tocar', async ({ context, page }) => {
    await login(context, '1000012');
    await page.goto('/');
    const paused = page.getByTestId('issuance-paused');
    await expect(paused).toContainText('Emisión de vales en pausa.');
    await expect(paused).toContainText(PAUSED_MESSAGE);
    await openPhoneTracker(page);
    await expect(page.getByTestId('phone-reported')).toContainText(
      'Equipo reportado. No puedes emitir vales desde este equipo hasta reactivarlo en sucursal.'
    );

    for (const testId of ['line-new-vale-paused', 'nav-new-vale-paused']) {
      const button = page.getByTestId(testId);
      await expect(button).toHaveAttribute('aria-disabled', 'true');
      // aria-disabled: Playwright lo trata como deshabilitado, pero la asociada sí puede tocarlo.
      await button.click({ force: true });
      await expect(page.getByRole('status').filter({ hasText: PAUSED_MESSAGE }).first()).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
    }
    await expect(page.getByRole('link', { name: /Vale Nuevo/ })).toHaveCount(0);
  });

  test('llamar la server action directo sigue siendo rechazado', async ({ browser, context, page }) => {
    // Se captura la acción desde una asociada que sí puede emitir y se reenvía con la sesión de 1000012.
    await login(context, '1000011');
    await page.goto('/vales/nuevo?demoDevice=1');
    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await fillNewClientForm(page);
    const action = await captureNextServerAction(page, () => confirmNewVale(page));

    const reported = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    await login(reported, '1000012');
    const result = await replayServerAction(reported, action);
    expect(result.text).toContain('Tu equipo está reportado');
    expect(result.text).not.toContain('"success":true');
    await reported.close();
  });
});

test.describe('Pago vencido con teléfono (1000013)', () => {
  test('estatus en mora, aviso nuevo y un solo botón de pago', async ({ context, page }) => {
    await login(context, '1000013');
    await page.goto('/');
    const status = page.getByTestId('payment-status');
    await expect(status).toHaveText('Pago vencido');
    await expect(status).not.toHaveClass(/text-accent/);
    const alert = page.getByTestId('phone-mora-AVISO');
    await expect(alert).toContainText(
      'Tienes un pago vencido de $320.00 (3 días). Págalo para evitar el bloqueo de tu Teléfono PrestaGana.'
    );
    await expect(alert).not.toContainText('del equipo (');
    await expect(page.getByRole('button', { name: 'Pagar Ahora' })).toHaveCount(1);
    const breakdown = page.getByTestId('collection-breakdown');
    await expect(breakdown).toContainText('Vales');
    await expect(breakdown).toContainText('Teléfono · cuota');
    await expect(breakdown).toContainText('Saldo del equipo');
  });
});

test.describe('Sin cambios para las demás asociadas', () => {
  const CASES = [
    { associate: '1000001', status: 'Al Día' },
    { associate: '1000002', status: 'Atrasada' },
    { associate: '1000009', status: 'Al Día' },
    { associate: '1000011', status: 'Al Día' },
  ];
  for (const { associate, status } of CASES) {
    test(`asociada ${associate}`, async ({ context, page }) => {
      await login(context, associate);
      await page.goto('/');
      await expect(page.getByTestId('payment-status')).toHaveText(status);
      await expect(page.getByTestId('issuance-paused')).toHaveCount(0);
      await expect(page.getByTestId('line-new-vale-paused')).toHaveCount(0);
      await expect(page.getByTestId('nav-new-vale-paused')).toHaveCount(0);
      await page.getByRole('link', { name: 'Vale Nuevo' }).first().click();
      await expect(page).toHaveURL(/\/vales\/nuevo/);
    });
  }
});

test.describe('Mi Teléfono PrestaGana', () => {
  test('colapsada por default con el resumen; se expande con el avance', async ({ context, page }) => {
    await login(context, '1000011');
    await page.goto('/');
    const toggle = page.getByTestId('phone-tracker-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle.getByTestId('phone-tracker-summary')).toHaveText('Activo · paso 5 de 5');
    await expect(toggle).toContainText('Samsung Galaxy A17');
    expect((await toggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByTestId('phone-tracker-todo')).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('phone-tracker-current')).toHaveText(/Activo/);
    await expect(page.getByTestId('phone-tracker-todo')).toBeVisible();
    await expect(page.getByTestId('phone-tracker')).toContainText('Folio TEL-1000011-DEMO');
  });
});

test.describe('Datos de la Asociada', () => {
  test('colapsada por default; se expande con los 4 datos', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/');
    const toggle = page.getByTestId('associate-info-toggle');
    await expect(toggle).toContainText('Datos de la Asociada');
    await expect(toggle).toContainText('ROSA MARTINEZ LOPEZ');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // El nivel vive como badge en la tarjeta; ya no hay tarjeta "Nivel".
    await expect(toggle.getByTestId('associate-level')).toHaveText('Senior');
    await expect(page.getByText('Nivel Senior')).toHaveCount(0);
    const box = await toggle.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByText('No. Asociada')).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const details = page.getByTestId('associate-info-details');
    for (const label of ['No. Asociada', 'Sucursal', 'Fecha de Alta', 'Colocación Promedio']) {
      await expect(details.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(details).toContainText('1000001');
  });
});
