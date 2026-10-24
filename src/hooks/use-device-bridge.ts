'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

import { requestDeviceChallenge } from '@/app/actions';
import type { DeviceOperation } from '@/lib/types';

/**
 * Bridge que inyecta la miniapp Android de PrestaGana (contrato en docs/specs/miniapp-bridge.md).
 * La detección es solo por este objeto, nunca por user agent.
 */
export type PrestaGanaDeviceBridge = {
  getDeviceId(): Promise<string>;
  signChallenge(challenge: string): Promise<string>;
};

declare global {
  interface Window {
    PrestaGanaDevice?: PrestaGanaDeviceBridge;
  }
}

// La miniapp dispara este evento al terminar de inyectar el bridge.
export const DEVICE_BRIDGE_READY_EVENT = 'prestagana-device-ready';

export const getDeviceBridge = (): PrestaGanaDeviceBridge | null => {
  if (typeof window === 'undefined') return null;
  const bridge = window.PrestaGanaDevice;
  return bridge && typeof bridge.getDeviceId === 'function' && typeof bridge.signChallenge === 'function'
    ? bridge
    : null;
};

export type DeviceBridgeStatus = 'checking' | 'available' | 'unavailable';

// Tiempo de espera por si la miniapp inyecta el bridge después de cargar la página.
const DETECTION_GRACE_MS = 600;

export function useDeviceBridge(): { status: DeviceBridgeStatus; bridge: PrestaGanaDeviceBridge | null } {
  const [bridge, setBridge] = useState<PrestaGanaDeviceBridge | null>(null);
  const [status, setStatus] = useState<DeviceBridgeStatus>('checking');

  useEffect(() => {
    const detect = () => {
      const found = getDeviceBridge();
      if (found) {
        setBridge(found);
        setStatus('available');
      }
      return !!found;
    };
    if (detect()) return;
    const onReady = () => detect();
    window.addEventListener(DEVICE_BRIDGE_READY_EVENT, onReady);
    const timer = window.setTimeout(() => {
      if (!detect()) setStatus('unavailable');
    }, DETECTION_GRACE_MS);
    return () => {
      window.removeEventListener(DEVICE_BRIDGE_READY_EVENT, onReady);
      window.clearTimeout(timer);
    };
  }, []);

  return { status, bridge };
}

export type DeviceSignature = { challengeId: string; firma: string; deviceId: string };

/** Pide un desafío para la operación, lo firma con el equipo y regresa lo que la server action verifica. */
export async function withDeviceSignature(
  operacion: DeviceOperation,
  datos: { folio?: string; monto?: number } = {}
): Promise<DeviceSignature> {
  const bridge = getDeviceBridge();
  if (!bridge) throw new Error('Abre la app desde tu Teléfono PrestaGana para continuar.');
  const result = await requestDeviceChallenge(operacion, datos);
  if (!result.ok) throw new Error(result.message);
  const [deviceId, firma] = await Promise.all([
    bridge.getDeviceId(),
    bridge.signChallenge(result.challenge.challenge),
  ]);
  return { challengeId: result.challenge.challengeId, firma, deviceId };
}

/**
 * Antes de enviar un formulario con firma del equipo: detiene el envío, firma el desafío,
 * pone la firma en campos ocultos y vuelve a enviar. Sin `required`, el formulario sale normal.
 * Cada envío usa una firma nueva (los desafíos son de un solo uso).
 */
export function useDeviceSignedSubmit(
  required: boolean,
  getOperation: (form: HTMLFormElement) => { operacion: DeviceOperation; folio?: string; monto?: number }
) {
  const [signature, setSignature] = useState<DeviceSignature | null>(null);
  const [error, setError] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const allowNextSubmit = useRef(false);
  const pendingForm = useRef<HTMLFormElement | null>(null);

  // Ya con la firma en los campos ocultos, se reenvía el formulario.
  useEffect(() => {
    if (signature && pendingForm.current) {
      const form = pendingForm.current;
      pendingForm.current = null;
      allowNextSubmit.current = true;
      form.requestSubmit();
    }
  }, [signature]);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (!required) return;
      if (allowNextSubmit.current) {
        allowNextSubmit.current = false;
        return;
      }
      event.preventDefault();
      const form = event.currentTarget;
      const { operacion, folio, monto } = getOperation(form);
      setError('');
      setIsSigning(true);
      withDeviceSignature(operacion, { folio, monto })
        .then((sig) => {
          pendingForm.current = form;
          setSignature(sig);
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No se pudo firmar con tu equipo.'))
        .finally(() => setIsSigning(false));
    },
    [required, getOperation]
  );

  return { signature, error, isSigning, onSubmit };
}
