import { expect, test, type Browser, type Page, type Request } from '@playwright/test';
import { confirmNewVale, fillNewClientForm, fillPersonalCash, login, signWithOtp } from './helpers';

// Este archivo corre contra el segundo servidor demo (puerto 3131), con FEATURE_PRESTAMO_PERSONAL=false
// y FEATURE_TELEFONO=false. Las server actions se capturan en el servidor normal (3130, mismo build).
const OFF = 'http://localhost:3131';
const ON = 'http://localhost:3130';
test.use({ baseURL: OFF });

type Captured = { url: string; headers: Record<string, string>; body: string };

/** Captura (y aborta) la siguiente server action cuyo body contenga `marker`. */
async function captureAction(page: Page, marker: string, trigger: () => Promise<void>): Promise<Captured> {
  let captured: Captured | null = null;
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  await page.route('**/*', async (route, request: Request) => {
    const body = request.postData() ?? '';
    if (request.method() === 'POST' && request.headers()['next-action'] && body.includes(marker)) {
      captured = { url: request.url(), headers: request.headers(), body };
      await route.abort();
      resolve();
      return;
    }
    await route.continue();
  });
  await trigger();
  await done;
  return captured!;
}

/** Abre una pestaña en el servidor con todo encendido para capturar la acción. */
async function onServerPage(browser: Browser, associate: string) {
  const context = await browser.newContext({ baseURL: ON, viewport: { width: 390, height: 844 } });
  await login(context, associate);
  return { context, page: await context.newPage() };
}

/** Reenvía la acción al servidor con los interruptores apagados, con la sesión de ese servidor. */
async function replayOnOffServer(page: Page, action: Captured) {
  const keep = ['next-action', 'content-type', 'accept', 'next-router-state-tree'];
  const headers = Object.fromEntries(Object.entries(action.headers).filter(([k]) => keep.includes(k.toLowerCase())));
  const response = await page.context().request.post(action.url.replace(ON, OFF), {
    headers: { ...headers, origin: OFF },
    data: action.body,
  });
  return { status: response.status(), text: await response.text() };
}

test.describe('Interruptores apagados (Préstamo Personal y Teléfono)', () => {
  test('dashboard sin Mi Teléfono ni pausa, aunque el equipo esté reportado en demo', async ({ context, page }) => {
    await login(context, '1000012');
    await page.goto('/');
    await expect(page.getByText('Línea PrestaGana')).toBeVisible();
    await expect(page.getByTestId('phone-tracker')).toHaveCount(0);
    await expect(page.getByTestId('issuance-paused')).toHaveCount(0);
    await expect(page.getByTestId('line-new-vale-paused')).toHaveCount(0);
    await expect(page.getByTestId('nav-new-vale-paused')).toHaveCount(0);
    await page.getByRole('link', { name: 'Vale Nuevo' }).first().click();
    await expect(page).toHaveURL(/\/vales\/nuevo/);
    // Sin restricción del teléfono: crea y firma un vale de cliente nuevo con OTP + NIP, sin firma del equipo.
    await page.getByRole('button', { name: /Cliente Nuevo/ }).click();
    await fillNewClientForm(page);
    await confirmNewVale(page);
    await expect(page).toHaveURL(/\/sign\/1000012-/);
    await signWithOtp(page);
    await expect(page.getByText('FIRMADO').first()).toBeVisible();
  });

  test('sin mora del teléfono en Situación Actual', async ({ context, page }) => {
    await login(context, '1000013');
    await page.goto('/');
    await expect(page.getByTestId('payment-status')).toBeVisible();
    await expect(page.locator('[data-testid^="phone-mora-"]')).toHaveCount(0);
    await expect(page.getByTestId('collection-breakdown')).toHaveCount(0);
  });

  test('Vale Nuevo sin Préstamo Personal; /telefono regresa a Vale Nuevo', async ({ context, page }) => {
    await login(context, '1000001');
    await page.goto('/vales/nuevo');
    await expect(page.getByRole('button', { name: /Cliente Nuevo/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cliente Existente/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Préstamo Personal/ })).toHaveCount(0);
    await page.goto('/vales/nuevo?paso=personal');
    await expect(page.getByRole('button', { name: /Cliente Nuevo/ })).toBeVisible();
    await expect(page.getByTestId('phone-offer-option')).toHaveCount(0);
    await page.goto('/telefono');
    await expect(page).toHaveURL(/\/vales\/nuevo$/);
  });

  test('Perfil sin Reportar mi equipo', async ({ context, page }) => {
    await login(context, '1000011');
    await page.goto('/perfil');
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
    await expect(page.getByRole('button', { name: /Reportar mi equipo/ })).toHaveCount(0);
  });

  test('createPersonalLoanVale llamada directo se rechaza', async ({ browser, context, page }) => {
    // 1000015 es elegible para efectivo y ninguna otra prueba le crea un préstamo personal.
    const on = await onServerPage(browser, '1000015');
    await on.page.goto('/vales/nuevo');
    const action = await captureAction(on.page, 'loanAmount', () => fillPersonalCash(on.page));
    await on.context.close();

    await login(context, '1000015');
    await page.goto('/vales');
    const result = await replayOnOffServer(page, action);
    expect(result.text).toContain('El préstamo personal no está disponible por ahora.');
  });

  test('requestPhone llamada directo se rechaza', async ({ browser, context, page }) => {
    // 1000017 (solicitud cancelada) puede volver a solicitar; 1000006 ya solicita en 02-solicitud.
    const on = await onServerPage(browser, '1000017');
    await on.page.goto('/telefono');
    await on.page.getByTestId('plan-12').click();
    await on.page.getByLabel(/Acepto las condiciones/).check();
    const action = await captureAction(on.page, 'quincenas', () =>
      on.page.getByRole('button', { name: 'Solicitar' }).click()
    );
    await on.context.close();

    await login(context, '1000017');
    await page.goto('/');
    const result = await replayOnOffServer(page, action);
    expect(result.text).toContain('El Teléfono PrestaGana no está disponible por ahora.');
  });
});
