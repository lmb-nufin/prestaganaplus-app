import 'server-only';

import { demoFetch } from './demo-api';
import { isDemoModeEnabled } from './demo-mode';

// Con DEMO_MODE=true la app usa datos simulados en memoria (src/lib/demo-api.ts).
// Sin él, todas las llamadas van a la API real en API_BASE_URL.
// Si falta API_BASE_URL: en producción es un error (servir datos falsos en una app de
// crédito es peor que fallar); en desarrollo se usa el modo demo con un aviso.

let warnedMissingBaseUrl = false;

const isProduction = () =>
  process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

const useDemoApi = () => {
  if (isDemoModeEnabled()) return true;
  if (process.env.API_BASE_URL?.trim()) return false;
  if (isProduction()) {
    throw new Error(
      '[API] API_BASE_URL no está configurada y DEMO_MODE no es true. Configura API_BASE_URL para usar la API real o DEMO_MODE=true para datos simulados.'
    );
  }
  if (!warnedMissingBaseUrl) {
    warnedMissingBaseUrl = true;
    console.warn('[API] API_BASE_URL no está configurada; usando el modo demo (solo en desarrollo).');
  }
  return true;
};

export const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const cleanPath = path.replace(/^\/+/, '');
  if (useDemoApi()) {
    return demoFetch(cleanPath, init);
  }
  return fetch(`${process.env.API_BASE_URL!.trim()}${cleanPath}`, init);
};
