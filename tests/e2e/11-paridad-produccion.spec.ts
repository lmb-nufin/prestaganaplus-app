import { expect, test } from '@playwright/test';
import {
  NIP,
  captureNextServerAction,
  confirmNewVale,
  fillNewClientForm,
  fillPersonalCash,
  login,
  pickOption,
  replayServerAction,
  type CapturedAction,
} from './helpers';

/**
 * Cambia un campo del multipart de la server action capturada, en todas sus apariciones:
 * el formulario manda algunos campos dos veces y el servidor se queda con la última.
 */
const withField = (body: string, field: string, value: string) => {
  const pattern = new RegExp(`(name="(?:\\d+_)?${field}"\\r\\n\\r\\n)[^\\r]*`, 'g');
  expect(body).toMatch(pattern);
  return body.replace(pattern, `$1${value}`);
};

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

  test('Préstamo Personal: mismos montos y plazos que cliente existente; el servidor rechaza 14 quincenas', async ({ context, page }) => {
    await login(context, '1000006');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Préstamo Personal/ }).click();
    await expect(page.getByText('De $5,000 a $9,000, a 8, 10 o 12 quincenas')).toBeVisible();
    await page.getByRole('button', { name: /Efectivo/ }).click();

    await page.getByRole('combobox').nth(0).click();
    const options = page.getByRole('option');
    await expect(options.first()).toHaveText('$5,000.00');
    await expect(options.last()).toHaveText('$9,000.00');
    await expect(options).toHaveCount(9);
    await page.keyboard.press('Escape');
    await page.getByRole('combobox').nth(1).click();
    await expect(options).toHaveText(['8 Quincenas', '10 Quincenas', '12 Quincenas']);
    await page.keyboard.press('Escape');

    await pickOption(page, 0, '$6,000.00');
    await pickOption(page, 1, '12 Quincenas');
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    const action = await captureNextServerAction(
      page,
      () => page.getByRole('button', { name: 'Confirmar y Crear' }).click(),
      'installments'
    );
    const rejected = await replayServerAction(context, action, withField(action.body, 'installments', '14'));
    expect(rejected.text).toContain('Plazo no permitido.');
    expect(rejected.text).not.toContain('"success":true');
  });

  test('el servidor rechaza vales fuera de monto o plazo', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await fillNewClientForm(page);
    const action = await captureNextServerAction(page, () => confirmNewVale(page), 'installments');

    const tooMuch = await replayServerAction(context, action, withField(action.body, 'loanAmount', '9000'));
    expect(tooMuch.text).toContain('Monto no permitido.');
    const notAStep = await replayServerAction(context, action, withField(action.body, 'loanAmount', '5250'));
    expect(notAStep.text).toContain('Monto no permitido.');
    const tooLong = await replayServerAction(context, action, withField(action.body, 'installments', '14'));
    expect(tooLong.text).toContain('Plazo no permitido.');
  });

  const NOT_VERIFIED = 'No pudimos verificar al cliente existente para este monto.';

  test('un cliente nuevo no llega a $9,000 marcándose como existente', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await fillNewClientForm(page);
    const action = await captureNextServerAction(page, () => confirmNewVale(page), 'installments');

    const forged = withField(withField(action.body, 'isRenewed', 'true'), 'loanAmount', '9000');
    const rejected = await replayServerAction(context, action, forged);
    expect(rejected.text).toContain(NOT_VERIFIED);
  });

  test('un cliente existente no llega a $9,000 con otro id_cliente', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Existente/ }).click();
    await page.locator('#curp').fill('PEGJ900101MDFRRN01');
    await page.locator('#curp-confirm').fill('PEGJ900101MDFRRN01');
    await page.getByRole('button', { name: 'Buscar Cliente' }).click();
    await pickOption(page, 0, '$9,000.00');
    await pickOption(page, 1, '12 Quincenas');
    const action = await captureNextServerAction(page, () => confirmNewVale(page), 'installments');

    const rejected = await replayServerAction(context, action, withField(action.body, 'id_cliente', '9999'));
    expect(rejected.text).toContain(NOT_VERIFIED);
  });

  test('arriba de $5,500, los datos personales salen de la API y no del formulario', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Existente/ }).click();
    await page.locator('#curp').fill('PEGJ900101MDFRRN01');
    await page.locator('#curp-confirm').fill('PEGJ900101MDFRRN01');
    await page.getByRole('button', { name: 'Buscar Cliente' }).click();
    await pickOption(page, 0, '$9,000.00');
    await pickOption(page, 1, '12 Quincenas');
    const action = await captureNextServerAction(page, () => confirmNewVale(page), 'installments');

    // CURP e id_cliente reales, con los datos de otra persona.
    let forged = withField(action.body, 'firstName', 'MARIA');
    forged = withField(forged, 'lastNameP', 'GOMEZ');
    forged = withField(forged, 'lastNameM', 'LOPEZ');
    forged = withField(forged, 'birthDate', '1985-05-15');
    forged = withField(forged, 'phone', '+525599999999');
    const created = await replayServerAction(context, action, forged);
    const folio = /1000001-\d{6}-[0-9A-Z]{6}/.exec(created.text)?.[0];
    expect(folio, created.text).toBeTruthy();

    await page.unrouteAll();
    await page.goto(`/sign/${folio}`);
    await expect(page.getByText(/JUANA PEREZ GARCIA/).first()).toBeVisible();
    await expect(page.getByText(/MARIA|GOMEZ|LOPEZ/)).toHaveCount(0);
    await expect(page.getByText('1 de enero, 1990')).toBeVisible();
    await expect(page.getByText('15 de mayo, 1985')).toHaveCount(0);
    await expect(page.getByText(/5511111111/).first()).toBeVisible();
    await expect(page.getByText(/5599999999/)).toHaveCount(0);
  });

  test('arriba de $5,500 se rechaza si la API no trae un dato, aunque venga en el formulario', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Existente/ }).click();
    await page.locator('#curp').fill('SITE900101MDFRRN02');
    await page.locator('#curp-confirm').fill('SITE900101MDFRRN02');
    await page.getByRole('button', { name: 'Buscar Cliente' }).click();
    await pickOption(page, 0, '$9,000.00');
    await pickOption(page, 1, '12 Quincenas');
    const action = await captureNextServerAction(page, () => confirmNewVale(page), 'installments');

    const rejected = await replayServerAction(context, action, withField(action.body, 'phone', '+525599999999'));
    expect(rejected.text).toContain(NOT_VERIFIED);
  });

  test('arriba de $5,500 se rechaza si la API no trae id_cliente, sin alterar el formulario', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Existente/ }).click();
    await page.locator('#curp').fill('SIID900101MDFRRN03');
    await page.locator('#curp-confirm').fill('SIID900101MDFRRN03');
    await page.getByRole('button', { name: 'Buscar Cliente' }).click();
    await pickOption(page, 0, '$9,000.00');
    await pickOption(page, 1, '12 Quincenas');
    const action = await captureNextServerAction(page, () => confirmNewVale(page), 'installments');

    const rejected = await replayServerAction(context, action, action.body);
    expect(rejected.text).toContain(NOT_VERIFIED);
  });

  test('un vale activo no se cancela y se muestra el mensaje de la API', async ({ context, page }) => {
    const folio = '1000001-202610-ACTIVO';
    await login(context, '1000001');
    await page.goto(`/sign/${folio}`);
    await page.getByRole('button', { name: 'Cancelar Vale' }).click();
    await page.getByLabel('NIP de Seguridad').fill(NIP);
    await page.getByRole('button', { name: 'Confirmar Cancelación' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'No se pudo cancelar' }).getByText('El vale ya está activo y no se puede cancelar.')
    ).toBeVisible();

    await page.goto(`/sign/${folio}`);
    await expect(page.getByRole('button', { name: 'Cancelar Vale' })).toBeVisible();
  });

  test('un vale que no está activo sí se cancela', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await fillNewClientForm(page);
    await confirmNewVale(page);
    await expect(page).toHaveURL(/\/sign\/1000001-/);
    const folio = page.url().split('/sign/')[1].split('?')[0];

    await page.getByRole('button', { name: 'Cancelar Vale' }).click();
    await page.getByLabel('NIP de Seguridad').fill(NIP);
    await page.getByRole('button', { name: 'Confirmar Cancelación' }).click();
    await expect(page.getByText('eliminado correctamente').first()).toBeVisible();
    await expect(page).toHaveURL(/\/vales$/);
    // Primero la lista pintada: antes de eso, los conteos en cero no prueban nada.
    await expect(page.locator('a[href="/sign/1000001-202610-ACTIVO"]').first()).toBeVisible();
    await expect(page.getByTestId('vales-notice')).toHaveCount(0);
    await expect(page.locator(`a[href="/sign/${folio}"]`)).toHaveCount(0);
  });

  test('la lista de vales en móvil no se desborda con préstamo personal', async ({ context, page }) => {
    await login(context, '1000017');
    await page.goto('/vales/nuevo');
    await fillPersonalCash(page);
    await expect(page).toHaveURL(/\/sign\/1000017-/);
    await page.goto('/vales');
    await expect(page.getByText('Personal', { exact: true }).first()).toBeVisible();
    // El scroll vive en AppShell: medir el documento no detectaría un desborde.
    const overflow = await page.getByTestId('app-scroll').evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('números de soporte', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/soporte');
    await expect(page.locator('a[href="https://wa.me/5533349279"]')).toHaveCount(1);
    await expect(page.locator('a[href="tel:5662302984"]')).toHaveCount(1);
  });

  test('el scroll del contenido cuenta como actividad: 8 minutos con un scroll a la mitad no cierran la sesión', async ({ context, page }) => {
    await page.clock.install();
    await login(context, '1000011');
    await page.goto('/');
    await expect(page.getByText('Línea PrestaGana')).toBeVisible();

    await page.clock.fastForward('04:00');
    const scroll = page.getByTestId('app-scroll');
    // El navegador entrega el evento scroll en su propio frame, sin esperar al reloj simulado.
    // Adelantar el reloj antes de que llegue cerraría la sesión.
    await scroll.evaluate(
      (el) =>
        new Promise<void>((resolve) => {
          window.addEventListener('scroll', () => resolve(), { capture: true, once: true });
          el.scrollTo(0, 400);
        })
    );
    expect(await scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await page.clock.fastForward('03:59');
    // El cierre es una server action: se le da tiempo real de terminar antes de revisar.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Línea PrestaGana')).toBeVisible();

    // Después, más de 5 minutos sin nada: regresa al login.
    await page.clock.fastForward('05:30');
    await expect(page).toHaveURL(/\/login/);
  });

  test('control: los mismos 8 minutos sin scroll cierran la sesión', async ({ context, page }) => {
    await page.clock.install();
    await login(context, '1000011');
    await page.goto('/');
    await expect(page.getByText('Línea PrestaGana')).toBeVisible();

    await page.clock.fastForward('04:00');
    await page.clock.fastForward('04:00');
    await expect(page).toHaveURL(/\/login/);
  });
});
