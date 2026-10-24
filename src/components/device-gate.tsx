'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Ban, Loader2, ShieldCheck, Smartphone } from 'lucide-react';

import { useDeviceBridge, type DeviceSignature } from '@/hooks/use-device-bridge';
import type { IssuanceMode } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

export const DEVICE_ONLY_MESSAGE = 'Por seguridad, tus vales se emiten desde tu Samsung PrestaGana.';

/**
 * Decide qué ve la asociada antes de emitir, firmar o cancelar un vale.
 * Es solo la UX: las server actions vuelven a validar con la API.
 * - LIBRE: el formulario normal.
 * - EQUIPO: con el bridge de la miniapp, el formulario con firma del equipo; sin él, un aviso.
 * - BLOQUEADA: un aviso con el motivo.
 */
export function DeviceGate({
  issuance,
  children,
}: {
  issuance: IssuanceMode;
  children: (deviceSignatureRequired: boolean) => ReactNode;
}) {
  const { status } = useDeviceBridge();

  if (issuance.mode === 'LIBRE') return <>{children(false)}</>;

  if (issuance.mode === 'BLOQUEADA') {
    return (
      <Alert variant="destructive" data-testid="issuance-blocked">
        <Ban className="h-4 w-4" />
        <AlertTitle className="font-headline">Emisión de vales bloqueada</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{issuance.message}</p>
          <p className="text-xs">Consultar saldo, pagar y soporte siguen disponibles.</p>
          <Button asChild size="sm" variant="outline" className="mt-1">
            <Link href="/soporte">Ir a Soporte</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verificando tu equipo…
      </div>
    );
  }

  if (status === 'unavailable') {
    return (
      <Alert className="border-indigo-200 bg-indigo-50" data-testid="device-only-notice">
        <Smartphone className="h-4 w-4 text-indigo-600" />
        <AlertTitle className="font-headline text-indigo-900">Usa tu Samsung PrestaGana</AlertTitle>
        <AlertDescription className="space-y-1 text-indigo-800">
          <p>{DEVICE_ONLY_MESSAGE}</p>
          <p className="text-xs">Consultar saldo, pagar y soporte funcionan desde cualquier dispositivo.</p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-xs text-indigo-700" data-testid="device-signature-on">
        <ShieldCheck className="h-4 w-4" />
        Se firmará con tu equipo PrestaGana.
      </p>
      {children(true)}
    </div>
  );
}

/** Campos ocultos con la firma del equipo que verifican las server actions. */
export function DeviceSignatureFields({ signature }: { signature: DeviceSignature | null }) {
  if (!signature) return null;
  return (
    <>
      <input type="hidden" name="challengeId" value={signature.challengeId} />
      <input type="hidden" name="firma" value={signature.firma} />
      <input type="hidden" name="deviceSignatureId" value={signature.deviceId} />
    </>
  );
}

export function DeviceSignatureError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <Smartphone className="h-4 w-4" />
      <AlertTitle className="font-headline">No se pudo firmar con tu equipo</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
