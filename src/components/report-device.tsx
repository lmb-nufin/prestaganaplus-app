'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';

import { reportMyDevice } from '@/app/actions';
import type { DeviceReportReason } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const REASONS: { value: DeviceReportReason; label: string }[] = [
  { value: 'ROBO', label: 'Me lo robaron' },
  { value: 'PERDIDA', label: 'Lo perdí' },
  { value: 'DANO', label: 'Está dañado' },
  { value: 'OTRO', label: 'Otro motivo' },
];

const initialState = { success: false, message: '' };

export function ReportDeviceButton({ deviceLabel }: { deviceLabel: string }) {
  const [state, formAction] = useActionState(reportMyDevice, initialState);
  const [motivo, setMotivo] = useState<DeviceReportReason | ''>('');

  // Al reportar, Perfil se vuelve a renderizar con el equipo REPORTADO y muestra ReportedDeviceSteps.
  if (state.success) return <ReportedDeviceSteps />;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10">
          <ShieldAlert className="mr-2" />
          Reportar mi equipo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-headline">Reportar mi equipo</DialogTitle>
            <DialogDescription>
              {deviceLabel}. Al reportarlo se bloquea la emisión de vales desde él hasta que acudas a sucursal.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup name="motivo" value={motivo} onValueChange={(value) => setMotivo(value as DeviceReportReason)}>
            {REASONS.map((reason) => (
              <div key={reason.value} className="flex items-center gap-2">
                <RadioGroupItem value={reason.value} id={`motivo-${reason.value}`} />
                <Label htmlFor={`motivo-${reason.value}`} className="font-normal">{reason.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <ConfirmButton disabled={!motivo} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Siguientes pasos con el equipo reportado (justo después del reporte y en visitas posteriores). */
export function ReportedDeviceSteps() {
  return (
    <Alert className="border-accent/30 bg-accent/10" data-testid="device-report-done">
      <CheckCircle2 className="h-4 w-4 text-accent" />
      <AlertTitle className="font-headline">Equipo reportado</AlertTitle>
      <AlertDescription className="space-y-1 text-xs">
        <p>Bloqueamos la emisión de vales desde tu equipo para proteger tu cuenta.</p>
        <p>Siguientes pasos:</p>
        <ol className="list-decimal pl-4">
          <li>Acude a sucursal para reactivar o reponer el equipo; lleva tu INE.</li>
          <li>Si fue robo, levanta tu denuncia y llévala a la sucursal.</li>
          <li>Mientras tanto puedes consultar tu saldo, pagar y pedir soporte desde cualquier dispositivo.</li>
        </ol>
        <Link href="/soporte" className="font-semibold underline">Contactar a soporte</Link>
      </AlertDescription>
    </Alert>
  );
}

function ConfirmButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={disabled || pending} className="w-full sm:w-auto">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Confirmar reporte
    </Button>
  );
}
