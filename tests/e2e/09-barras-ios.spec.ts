import { expect, test, type Page } from '@playwright/test';
import { login } from './helpers';

/** Posición de las barras y si el documento hace scroll (con app shell, nunca). */
async function bars(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('header')!.getBoundingClientRect();
    const nav = document.querySelector('[data-testid="bottom-nav"]')?.getBoundingClientRect();
    return {
      docScroll: document.documentElement.scrollHeight - window.innerHeight,
      scrollY: window.scrollY,
      headerTop: Math.round(header.top),
      navBottom: nav ? Math.round(nav.bottom) : null,
      height: window.innerHeight,
    };
  });
}

async function expectBarsInPlace(page: Page, withNav: boolean) {
  const b = await bars(page);
  expect(b.docScroll).toBeLessThanOrEqual(0);
  expect(b.scrollY).toBe(0);
  expect(b.headerTop).toBe(0);
  if (withNav) expect(b.navBottom).toBe(b.height);
}

async function scrollContentToEnd(page: Page) {
  await page.getByTestId('app-scroll').evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(200);
}

test.describe('Header y barra inferior estables (app shell)', () => {
  for (const url of ['/', '/vales', '/perfil', '/soporte', '/notificaciones']) {
    test(`${url}: barras en su lugar tras scroll; lo último queda visible`, async ({ context, page }) => {
      await login(context, '1000011');
      await page.goto(url);
      await expect(page.getByTestId('app-scroll')).toBeVisible();
      await expectBarsInPlace(page, true);
      await scrollContentToEnd(page);
      await expectBarsInPlace(page, true);
      // El final del contenido queda arriba de la barra inferior.
      const contentBottom = await page.getByTestId('app-scroll').evaluate((el) => {
        const last = el.lastElementChild!.getBoundingClientRect();
        return Math.round(last.bottom);
      });
      const navTop = await page.getByTestId('bottom-nav').evaluate((el) => Math.round(el.getBoundingClientRect().top));
      expect(contentBottom).toBeLessThanOrEqual(navTop);
    });
  }

  test('menú lateral y diálogo de pago no desfasan las barras', async ({ context, page }) => {
    await login(context, '1000011');
    await page.goto('/');
    await scrollContentToEnd(page);
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expectBarsInPlace(page, true);

    await page.getByRole('button', { name: 'Pagar Ahora' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expectBarsInPlace(page, true);
  });

  test('al cambiar de pantalla, la nueva empieza arriba', async ({ context, page }) => {
    await login(context, '1000011');
    await page.goto('/');
    await scrollContentToEnd(page);
    expect(await page.getByTestId('app-scroll').evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await page.getByTestId('bottom-nav').getByRole('link', { name: 'Perfil' }).click();
    await expect(page).toHaveURL(/\/perfil$/);
    await expect.poll(() => page.getByTestId('app-scroll').evaluate((el) => el.scrollTop)).toBe(0);
    await expectBarsInPlace(page, true);
  });

  for (const url of ['/vales/nuevo', '/telefono']) {
    test(`${url}: header de subpágina en su lugar tras scroll`, async ({ context, page }) => {
      await login(context, '1000006');
      await page.goto(url);
      await expect(page.getByTestId('sub-page-title')).toBeVisible();
      await scrollContentToEnd(page);
      await expectBarsInPlace(page, false);
    });
  }
});

test('detalle del vale: header de subpágina en su lugar tras scroll', async ({ context, page }) => {
  await login(context, '1000001');
  await page.goto('/sign/1000001-202610-DEMO01');
  await expect(page.getByTestId('sub-page-title')).toHaveText('Detalle del vale');
  await scrollContentToEnd(page);
  await expectBarsInPlace(page, false);
});
