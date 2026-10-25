'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, HandCoins, Loader2 } from 'lucide-react';

import { createPersonalLoanVale } from '@/app/actions';
import { useAuditData } from '@/hooks/use-audit-data';
import { useDeviceSignedSubmit } from '@/hooks/use-device-bridge';
import { DeviceSignatureError, DeviceSignatureFields } from './device-gate';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

type State = {
  success?: boolean;
  message: string;
  errors?: { loanAmount?: string[]; installments?: string[] };
};
const initialState: State = { message: '' };

type PersonalLoanFormProps = {
  amounts: number[];
  installments: number[];
  // Solo para el diálogo; el servidor toma los datos de la API.
  holderName: string;
  // Con emisión restringida, el envío lleva la firma del equipo (miniapp).
  deviceSignatureRequired?: boolean;
};

const signatureContext = (form: HTMLFormElement) => ({
  operacion: 'PRESTAMO_PERSONAL' as const,
  monto: Number(new FormData(form).get('loanAmount')),
});

export function PersonalLoanForm({ amounts, installments, holderName, deviceSignatureRequired = false }: PersonalLoanFormProps) {
  const [state, formAction] = useActionState(createPersonalLoanVale, initialState);
  const deviceSignature = useDeviceSignedSubmit(deviceSignatureRequired, signatureContext);
  const auditData = useAuditData();
  const formRef = useRef<HTMLFormElement>(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const canSubmit = loanAmount !== '' && installmentCount !== '';

  return (
    <form ref={formRef} action={formAction} onSubmit={deviceSignature.onSubmit} className="space-y-4">
      <DeviceSignatureFields signature={deviceSignature.signature} />
      <input type="hidden" name="deviceId" value={auditData.deviceId} />
      <input type="hidden" name="deviceModel" value={auditData.deviceModel} />
      <input type="hidden" name="latitude" value={auditData.latitude} />
      <input type="hidden" name="longitude" value={auditData.longitude} />

      <div className="space-y-1.5">
        <Label htmlFor="loanAmount" className="font-headline text-xs">Monto del Préstamo</Label>
        <Select name="loanAmount" value={loanAmount} onValueChange={setLoanAmount} required>
          <SelectTrigger id="loanAmount"><SelectValue placeholder="Selecciona un monto" /></SelectTrigger>
          <SelectContent>
            {amounts.map((amount) => (
              <SelectItem key={amount} value={String(amount)}>{formatCurrency(amount)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.loanAmount && <p className="text-xs text-destructive">{state.errors.loanAmount[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="installments" className="font-headline text-xs">No. de Quincenas</Label>
        <Select name="installments" value={installmentCount} onValueChange={setInstallmentCount} required>
          <SelectTrigger id="installments"><SelectValue placeholder="Selecciona un plazo" /></SelectTrigger>
          <SelectContent>
            {installments.map((q) => (
              <SelectItem key={q} value={String(q)}>{q} Quincenas</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.installments && <p className="text-xs text-destructive">{state.errors.installments[0]}</p>}
      </div>

      <DeviceSignatureError message={deviceSignature.error} />
      {state?.message && !state.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-headline">No se pudo crear el préstamo</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="pt-2">
        <ConfirmButton disabled={!canSubmit} onClick={() => setIsConfirmOpen(true)} />
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Confirmar préstamo personal</AlertDialogTitle>
            <AlertDialogDescription className="py-2">
              Préstamo personal de <strong>{loanAmount && formatCurrency(Number(loanAmount))}</strong> a{' '}
              <strong>{installmentCount} quincenas</strong> a nombre de <strong>{holderName}</strong>. Se cobrará en tu relación de cobro y no usa tu línea de crédito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <SubmitAction onSubmit={() => formRef.current?.requestSubmit()} />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

// El diálogo se cierra al confirmar, así que el estado de envío se muestra en este botón
// y lo deshabilita para que no se pueda mandar dos veces.
function ConfirmButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      disabled={disabled || pending}
      onClick={onClick}
      className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
    >
      {pending ? <Loader2 className="animate-spin" /> : <HandCoins />}
      {pending ? 'Creando préstamo…' : 'Confirmar'}
    </Button>
  );
}

function SubmitAction({ onSubmit }: { onSubmit: () => void }) {
  return (
    <AlertDialogAction onClick={onSubmit} className="bg-indigo-600 hover:bg-indigo-700">
      Confirmar y Crear
    </AlertDialogAction>
  );
}
