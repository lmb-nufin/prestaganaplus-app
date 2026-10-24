import { expect, type BrowserContext, type Page, type Request } from '@playwright/test';

// Asociadas demo (src/lib/demo-api.ts). NIP 1234, OTP 123456.
export const NIP = '1234';
export const OTP = '123456';

export const DEVICE_ONLY = 'Por seguridad, tus vales se emiten desde tu Teléfono PrestaGana.';
export const DEVICE_REPORTED = 'Acude a sucursal para reactivar';
export const DEVICE_REJECTED = 'No pudimos verificar tu equipo';

/** Inicia sesión por la API de NextAuth; las cookies quedan en el contexto del navegador. */
export async function login(context: BrowserContext, associateNumber: string) {
  const csrf = await context.request.get('/api/auth/csrf');
  const { csrfToken } = await csrf.json();
  const response = await context.request.post('/api/auth/callback/credentials', {
    form: { csrfToken, associateNumber, nip: NIP, callbackUrl: '/' },
    maxRedirects: 0,
  });
  expect(response.status(), `login de ${associateNumber}`).toBe(302);
  expect(response.headers()['location']).not.toContain('error');
}

/** Elige una opción de un Select de Radix (combobox) por el texto visible. */
export async function pickOption(page: Page, comboboxIndex: number, optionName: string) {
  await page.getByRole('combobox').nth(comboboxIndex).click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

export async function fillNewClientForm(page: Page, amount = '$5,000.00', installments = '12 Quincenas') {
  await page.getByLabel('Nombre(s)').fill('MARIA');
  await page.getByLabel('Apellido Paterno').fill('GOMEZ');
  await page.getByLabel('Apellido Materno').fill('LARA');
  await page.locator('#birthDate-display').click();
  await page.locator('select[name="years"]').selectOption('1985');
  await page.locator('select[name="months"]').selectOption('4'); // mayo (base 0)
  await page.getByRole('gridcell', { name: '15', exact: true }).click();
  await expect(page.locator('input[name="birthDate"]')).toHaveValue('1985-05-15');
  await page.locator('input[name="phone_number"]').fill('5512345678');
  await pickOption(page, 0, amount);
  await pickOption(page, 1, installments);
}

export async function confirmNewVale(page: Page) {
  await page.getByRole('button', { name: 'Crear Vale' }).click();
  await page.getByRole('button', { name: 'Confirmar y Crear' }).click();
}

export async function fillPersonalCash(page: Page, amount = '$6,000.00', installments = '12 Quincenas') {
  await page.getByRole('button', { name: /Préstamo Personal/ }).click();
  await page.getByRole('button', { name: /Efectivo/ }).click();
  await pickOption(page, 0, amount);
  await pickOption(page, 1, installments);
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar y Crear' }).click();
}

/** Firma un vale pendiente con OTP + NIP desde /sign/{folio}. */
export async function signWithOtp(page: Page) {
  await page.getByRole('button', { name: 'Enviar Código de Firma' }).click();
  const digits = page.locator('input[inputmode="numeric"][maxlength="1"]');
  await expect(digits).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    await digits.nth(i).fill(OTP[i]);
  }
  await page.locator('#nip').fill(NIP);
  await page.getByRole('button', { name: 'Verificar y Firmar Vale' }).click();
}

export type CapturedAction = { url: string; headers: Record<string, string>; body: string };

/**
 * Intercepta la siguiente llamada a una server action desde la página, la aborta y la regresa
 * para reenviarla a mano (simula llamar la server action directo, sin la UI).
 */
export async function captureNextServerAction(page: Page, trigger: () => Promise<void>): Promise<CapturedAction> {
  let captured: CapturedAction | null = null;
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  const handler = async (route: any, request: Request) => {
    const headers = request.headers();
    const body = request.postData() ?? '';
    // Ignora la acción que pide el desafío: queremos la de crear, firmar o cancelar.
    if (request.method() === 'POST' && headers['next-action'] && body.includes('firma')) {
      captured = { url: request.url(), headers, body };
      await route.abort();
      resolve();
      return;
    }
    await route.continue();
  };
  await page.route('**/*', handler);
  await trigger();
  await done;
  await page.unroute('**/*', handler);
  return captured!;
}

const REPLAY_HEADERS = ['next-action', 'content-type', 'accept', 'next-router-state-tree', 'origin'];

/** Reenvía una server action capturada con las cookies del contexto dado. */
export async function replayServerAction(context: BrowserContext, action: CapturedAction, body = action.body) {
  const headers = Object.fromEntries(
    Object.entries(action.headers).filter(([key]) => REPLAY_HEADERS.includes(key.toLowerCase()))
  );
  const response = await context.request.post(action.url, { headers, data: body });
  return { status: response.status(), text: await response.text() };
}

/** Quita del body multipart los campos de la firma del equipo. */
export function stripDeviceSignature(action: CapturedAction) {
  const boundary = /boundary=(.+)$/.exec(action.headers['content-type'] ?? '')?.[1];
  if (!boundary) throw new Error('La server action no es multipart');
  const parts = action.body.split(`--${boundary}`);
  const kept = parts.filter((part) => !/name="(\d+_)?(challengeId|firma|deviceSignatureId)"/.test(part));
  expect(kept.length).toBe(parts.length - 3);
  return kept.join(`--${boundary}`);
}

/** Cambia la firma por una inválida conservando el resto del body. */
export function tamperDeviceSignature(action: CapturedAction) {
  const tampered = action.body.replace(/demo-([0-9a-f]{32})/, 'fake-$1');
  expect(tampered).not.toBe(action.body);
  return tampered;
}
