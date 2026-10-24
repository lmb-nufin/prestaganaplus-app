import 'server-only';

import { demoFetch } from './demo-api';

// Con DEMO_MODE=true la app usa datos simulados en memoria (src/lib/demo-api.ts).
// Sin él, todas las llamadas van a la API real en API_BASE_URL.
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const API_BASE_URL = process.env.API_BASE_URL;

export const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const cleanPath = path.replace(/^\/+/, '');
  if (DEMO_MODE) {
    return demoFetch(cleanPath, init);
  }
  return fetch(`${API_BASE_URL}${cleanPath}`, init);
};
