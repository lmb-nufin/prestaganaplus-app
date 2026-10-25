'use client';

import { Ban } from 'lucide-react';

import type { IssuanceMode, Vale } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Dialog, DialogTrigger } from './ui/dialog';
import { DeviceGate } from './device-gate';
import { ValeCancellationDialog } from './vale-cancellation-dialog';
import { ValeSigningForm } from './vale-signing-form';

/** Firma y cancelación del vale, detrás de la restricción de emisión del teléfono. */
export function SignActions({
  vale,
  canBeSigned,
  canBeCancelled,
  available,
  issuance,
}: {
  vale: Vale;
  canBeSigned: boolean;
  canBeCancelled: boolean;
  available: number;
  issuance: IssuanceMode;
}) {
  return (
    <div className="w-full">
      <DeviceGate issuance={issuance}>
        {(deviceSignatureRequired) => (
          <>
            {vale.status === 'PENDIENTE' &&
              (canBeSigned ? (
                <ValeSigningForm vale={vale} deviceSignatureRequired={deviceSignatureRequired} />
              ) : (
                <div className="p-4 w-full">
                  <Alert variant="destructive">
                    <Ban className="h-4 w-4" />
                    <AlertTitle className="font-headline">Crédito Insuficiente</AlertTitle>
                    <AlertDescription>
                      No puedes firmar este vale porque el monto excede tu línea de crédito disponible. Tu disponible es de {formatCurrency(available)}.
                    </AlertDescription>
                  </Alert>
                </div>
              ))}

            {canBeCancelled && (
              <div className="p-4 w-full border-t">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Ban className="mr-2 h-4 w-4" />
                      Cancelar Vale
                    </Button>
                  </DialogTrigger>
                  <ValeCancellationDialog folio={vale.folio} deviceSignatureRequired={deviceSignatureRequired} />
                </Dialog>
              </div>
            )}
          </>
        )}
      </DeviceGate>
    </div>
  );
}
