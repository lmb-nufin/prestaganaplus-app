import 'server-only';

import { isDemoModeEnabled } from './demo-mode';

// Interruptores por función para el piloto. Se leen solo en el servidor.
// true/1 enciende y false/0 apaga; sin definir, solo se encienden en modo demo.
const flag = (name: string) => {
  const value = (process.env[name] ?? '').trim().replace(/^["']|["']$/g, '').toLowerCase();
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return isDemoModeEnabled();
};

/** Préstamo Personal en efectivo (`prestamoPersonal/{n}` y `tipoVale: PERSONAL`). */
export const isPersonalLoanEnabled = () => flag('FEATURE_PRESTAMO_PERSONAL');

/** Teléfono PrestaGana y su miniapp (`telefono/*` y `dispositivo/*`). */
export const isPhoneEnabled = () => flag('FEATURE_TELEFONO');

export type FeatureSet = { personalLoan: boolean; phone: boolean };

export const getFeatures = (): FeatureSet => ({ personalLoan: isPersonalLoanEnabled(), phone: isPhoneEnabled() });
