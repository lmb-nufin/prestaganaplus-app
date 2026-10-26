import { defineConfig } from '@playwright/test';

const PORT = 3130;
// Segundo servidor (mismo build, también demo) con Préstamo Personal y Teléfono apagados: 10-interruptores.
const PORT_FEATURES_OFF = 3131;

const SERVER_ENV = {
  DEMO_MODE: 'true',
  API_BASE_URL: '',
  AUTH_SECRET: 'playwright-local-secret-playwright-local-secret',
  TZ: 'America/Mexico_City',
};

// Las pruebas corren SIEMPRE contra la API simulada (DEMO_MODE=true), nunca contra la API real.
// La simulación guarda estado en memoria, así que las pruebas corren en serie sobre un solo servidor.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Usa el Chrome instalado en la máquina (no descarga navegadores).
    channel: 'chrome',
    viewport: { width: 390, height: 844 },
    timezoneId: 'America/Mexico_City',
    locale: 'es-MX',
    trace: 'retain-on-failure',
  },
  // Los servidores se levantan en orden: el segundo usa el build que hace el primero.
  webServer: [
    {
      command: `npm run build && npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/login`,
      // Nunca reutilizar un servidor ya levantado: podría no estar en modo demo.
      reuseExistingServer: false,
      timeout: 300_000,
      env: SERVER_ENV,
    },
    {
      command: `npx next start -p ${PORT_FEATURES_OFF}`,
      url: `http://localhost:${PORT_FEATURES_OFF}/login`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { ...SERVER_ENV, FEATURE_PRESTAMO_PERSONAL: 'false', FEATURE_TELEFONO: 'false' },
    },
  ],
});
