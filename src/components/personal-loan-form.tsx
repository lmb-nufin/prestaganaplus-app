'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, HandCoins, Loader2 } from 'lucide-react';

import { createPersonalLoanVale } from '@/app/actions';
import { useAuditData } from '@/hooks/use-audit-data';
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
};

export function PersonalLoanForm({ amounts, installments, holderName }: PersonalLoanFormProps) {
  const [state, formAction] = useActionState(createPersonalLoanVale, initialState);
  const auditData = useAuditData();
  const formRef = useRef<HTMLFormElement>(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const canSubmit = loanAmount !== '' && installmentCount !== '';

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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

      {state?.message && !state.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-headline">No se pudo crear el préstamo</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="pt-2">
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => setIsConfirmOpen(true)}
          className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <HandCoins />
          Confirmar
        </Button>
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

function SubmitAction({ onSubmit }: { onSubmit: () => void }) {
  const { pending } = useFormStatus();
  return (
    <AlertDialogAction onClick={onSubmit} disabled={pending} className="bg-indigo-600 hover:bg-indigo-700">
      {pending ? <Loader2 className="animate-spin mr-2" /> : null}
      Confirmar y Crear
    </AlertDialogAction>
  );
}
