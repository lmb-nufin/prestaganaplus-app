'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

import { DEVICE_BRIDGE_READY_EVENT } from '@/hooks/use-device-bridge';

// Debe coincidir con DEMO_DEVICE_ID en src/lib/demo-api.ts.
const DEMO_DEVICE_ID = 'DEMO-DEVICE-0001';
const STORAGE_KEY = 'prestagana-demo-device';

/**
 * Bridge simulado de la miniapp. Solo se monta cuando el servidor corre con DEMO_MODE=true
 * (ver src/components/demo-bridge-slot.tsx). Se activa con ?demoDevice=1 y se apaga con ?demoDevice=0;
 * la elección se recuerda en la pestaña para que sobreviva la navegación.
 */
export function DemoDeviceBridge() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('demoDevice');
    try {
      if (param === '1') sessionStorage.setItem(STORAGE_KEY, '1');
      if (param === '0') sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    let enabled = param === '1';
    try {
      enabled = enabled || sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {}
    if (param === '0') enabled = false;
    if (!enabled) return;

    window.PrestaGanaDevice = {
      getDeviceId: async () => DEMO_DEVICE_ID,
      signChallenge: async (challenge: string) => `demo-${challenge}`,
    };
    window.dispatchEvent(new Event(DEVICE_BRIDGE_READY_EVENT));
    setActive(true);
  }, []);

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed left-2 top-16 z-[60] flex items-center gap-1 rounded-full bg-indigo-600/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
      <Smartphone className="h-3 w-3" />
      Equipo demo
    </div>
  );
}
