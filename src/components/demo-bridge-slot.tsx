import 'server-only';

import { isDemoModeEnabled } from '@/lib/demo-mode';
import { DemoDeviceBridge } from './demo-device-bridge';

/**
 * Monta el bridge simulado solo si el servidor corre con DEMO_MODE=true.
 * Va únicamente en páginas dinámicas (se evalúa en cada request, no en el build).
 */
export function DemoBridgeSlot() {
  return isDemoModeEnabled() ? <DemoDeviceBridge /> : null;
}
