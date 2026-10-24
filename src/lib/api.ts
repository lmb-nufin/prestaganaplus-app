import 'server-only';

import { demoFetch } from './demo-api';

// Con DEMO_MODE=true la app usa datos simulados en memoria (src/lib/demo-api.ts).
// Sin él, todas las llamadas van a la API real en API_BASE_URL. Si API_BASE_URL
// no está configurada, no hay API a la cual llamar y se usa el modo demo.
const isDemoMode = () => {
  const flag = (process.env.DEMO_MODE ?? '').trim().replace(/^["']|["']$/g, '').toLowerCase();
  if (flag === 'true' || flag === '1') return true;
  if (!process.env.API_BASE_URL?.trim()) {
    console.warn('[API] API_BASE_URL no está configurada; usando el modo demo.');
    return true;
  }
  return false;
};

export const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const cleanPath = path.replace(/^\/+/, '');
  if (isDemoMode()) {
    return demoFetch(cleanPath, init);
  }
  return fetch(`${process.env.API_BASE_URL!.trim()}${cleanPath}`, init);
};
