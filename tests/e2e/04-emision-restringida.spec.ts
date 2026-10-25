import { expect, test, type Page } from '@playwright/test';
import {
  DEVICE_ONLY,
  DEVICE_REJECTED,
  DEVICE_REPORTED,
  NIP,
  OTP,
  captureNextServerAction,
  confirmNewVale,
  fillNewClientForm,
  fillPersonalCash,
  login,
  replayServerAction,
  signWithOtp,
  stripDeviceSignature,
  tamperDeviceSignature,
} from './helpers';

const RESTRICTED = '1000011';
const RESTRICTED_VALE = '1000011-202610-DEMO02';

/** Reenvía la acción capturada sin firma, con firma alterada y con la firma ya usada: todas se rechazan. */
async function expectDirectCallsRejected(page: Page, action: Awaited<ReturnType<typeof captureNextServerAction>>) {
  const context = page.context();
  const unsigned = await replayServerAction(context, action, stripDeviceSignature(action));
  expect(unsigned.text).toContain(DEVICE_ONLY);
  expect(unsigned.text).not.toContain('"success":true');

  const tampered = await replayServerAction(context, action, tamperDeviceSignature(action));
  expect(tampered.text).toContain(DEVICE_REJECTED);

  // El desafío ya se consumió con el intento alterado: la firma original tampoco sirve.
  const reused = await replayServerAction(context, action);
  expect(reused.text).toContain(DEVICE_REJECTED);
  expect(reused.text).not.toContain('"success":true');
}

test.describe('Emisión restringida desde "Chrome" (sin bridge)', () => {
  test('Vale Nuevo muestra el aviso sin formulario', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto('/');
    // El botón sigue visible y lleva al aviso.
    await page.getByRole('link', { name: 'Vale Nuevo' }).first().click();
    await expect(page).toHaveURL(/\/vales\/nuevo/);
    await expect(page.getByTestId('device-only-notice')).toContainText(DEVICE_ONLY);
    await expect(page.getByRole('button', { name: /Cliente Nuevo/ })).toHaveCount(0);
    await expect(page.locator('form')).toHaveCount(0);
  });

  test('firmar un vale muestra el aviso sin formulario', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto(`/sign/${RESTRICTED_VALE}`);
    await expect(page.getByTestId('device-only-notice')).toContainText(DEVICE_ONLY);
    await expect(page.getByRole('button', { name: 'Enviar Código de Firma' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancelar Vale' })).toHaveCount(0);
  });
});

test.describe('Server actions llamadas directo (sin UI) se rechazan sin firma válida', () => {
  test('createVale', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto('/vales/nuevo?demoDevice=1');
    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await fillNewClientForm(page);
    const action = await captureNextServerAction(page, () => confirmNewVale(page));
    await expectDirectCallsRejected(page, action);
  });

  test('createPersonalLoanVale', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto('/vales/nuevo?demoDevice=1');
    const action = await captureNextServerAction(page, () => fillPersonalCash(page));
    await expectDirectCallsRejected(page, action);
  });

  test('signValeWithOtp', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto(`/sign/${RESTRICTED_VALE}?demoDevice=1`);
    const action = await captureNextServerAction(page, () => signWithOtp(page));
    expect(action.body).toContain(OTP);
    await expectDirectCallsRejected(page, action);
    await page.goto(`/sign/${RESTRICTED_VALE}`);
    await expect(page.getByText('PENDIENTE')).toBeVisible();
  });

  test('cancelVale', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto(`/sign/${RESTRICTED_VALE}?demoDevice=1`);
    await page.getByRole('button', { name: 'Cancelar Vale' }).click();
    await page.getByLabel('NIP de Seguridad').fill(NIP);
    const action = await captureNextServerAction(page, () =>
      page.getByRole('button', { name: 'Confirmar Cancelación' }).click()
    );
    await expectDirectCallsRejected(page, action);
    await page.goto(`/sign/${RESTRICTED_VALE}?demoDevice=1`);
    await expect(page.getByText('PENDIENTE')).toBeVisible();
  });
});

test.describe('Dentro de la miniapp (?demoDevice=1)', () => {
  test('crea y firma un vale de cliente nuevo con la firma del equipo', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto('/vales/nuevo?demoDevice=1');
    await expect(page.getByTestId('device-signature-on')).toBeVisible();
    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await fillNewClientForm(page);
    await confirmNewVale(page);
    await expect(page).toHaveURL(/\/sign\/1000011-/);
    await expect(page.getByText('15 de mayo, 1985')).toBeVisible();
    await signWithOtp(page);
    await expect(page.getByText('FIRMADO', { exact: true })).toBeVisible();
  });

  // Antes del préstamo en efectivo: después ya no tendría opciones y el botón saldría deshabilitado.
  test('la opción del teléfono aparece deshabilitada porque ya tiene equipo', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto('/vales/nuevo?demoDevice=1');
    await page.getByRole('button', { name: /Préstamo Personal/ }).click();
    await expect(page.getByTestId('phone-offer-option')).toContainText('Ya tienes tu equipo PrestaGana.');
  });

  test('crea un préstamo personal en efectivo con la firma del equipo', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto('/vales/nuevo?demoDevice=1');
    await fillPersonalCash(page);
    await expect(page).toHaveURL(/\/sign\/1000011-/);
    await expect(page.getByRole('heading', { name: /Préstamo Personal/ }).or(page.getByText('Préstamo Personal').first())).toBeVisible();
  });

  test('sin el parámetro (Chrome normal) vuelve el aviso', async ({ context, page }) => {
    await login(context, RESTRICTED);
    await page.goto('/vales/nuevo?demoDevice=0');
    await expect(page.getByTestId('device-only-notice')).toBeVisible();
  });
});

test.describe('Equipo REPORTADO', () => {
  test('emisión bloqueada aun desde el equipo', async ({ context, page }) => {
    await login(context, '1000012');
    await page.goto('/vales/nuevo?demoDevice=1');
    await expect(page.getByTestId('issuance-blocked')).toContainText(DEVICE_REPORTED);
    await expect(page.getByRole('button', { name: /Cliente Nuevo/ })).toHaveCount(0);
    await page.goto('/sign/1000012-202610-DEMO02?demoDevice=1');
    await expect(page.getByTestId('issuance-blocked')).toContainText(DEVICE_REPORTED);
    await expect(page.getByRole('button', { name: 'Enviar Código de Firma' })).toHaveCount(0);
    await page.goto('/');
    await expect(page.getByTestId('phone-reported')).toContainText('Equipo reportado. No puedes emitir vales desde este equipo hasta reactivarlo en sucursal.');
  });
});
