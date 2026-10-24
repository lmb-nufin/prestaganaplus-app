
'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Loader2, PlusCircle, AlertTriangle, ArrowLeft, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createVale } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency, parseDateOnly } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ExistingClient } from '@/lib/types';
import { useAuditData } from '@/hooks/use-audit-data';
import { useDeviceSignedSubmit } from '@/hooks/use-device-bridge';
import { DeviceSignatureError, DeviceSignatureFields } from './device-gate';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


type ValeFormProps = {
  onFormSuccess?: () => void;
  onBack: () => void;
  existingClientData?: ExistingClient | null;
  // Con emisión restringida, el envío lleva la firma del equipo (miniapp).
  deviceSignatureRequired?: boolean;
};

type State = {
    success?: boolean;
    message: string;
    errors?: {
        firstName?: string[];
        lastNameP?: string[];
        lastNameM?: string[];
        birthDate?: string[];
        loanAmount?: string[];
        installments?: string[];
        phone_number?: string[];
        phone?: string[];
        id_cliente?: string[];
        deviceId?: string[];
        deviceModel?: string[];
        latitude?: string[];
        longitude?: string[];
    };
    folio?: string;
};
const initialState: State = { message: '', errors: {}, folio: undefined };

const plazosPermitidos = [8, 10, 12, 14];

const signatureContext = (form: HTMLFormElement) => ({
  operacion: 'CREAR_VALE' as const,
  monto: Number(new FormData(form).get('loanAmount')),
});

export function ValeCreationForm({ onFormSuccess, onBack, existingClientData = null, deviceSignatureRequired = false }: ValeFormProps) {
  const [state, formAction] = useActionState(createVale, initialState);
  const deviceSignature = useDeviceSignedSubmit(deviceSignatureRequired, signatureContext);
  const { toast } = useToast();
  const router = useRouter();
  const auditData = useAuditData();
  const [date, setDate] = useState<Date | undefined>(
    existingClientData?.birthDate ? parseDateOnly(existingClientData.birthDate) : undefined
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (state?.success && state.folio) {
        toast({
            title: 'Vale Creado',
            description: 'Redirigiendo a la página de firma...',
            className: 'bg-accent text-accent-foreground',
        });
        router.push(`/sign/${state.folio}`);
    }
    else if (state?.message && !state.success) {
      toast({
          title: 'Error al Crear el Vale',
          description: state.message,
          variant: 'destructive',
      });
    }
  }, [state, router, toast]);
 
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setIsCalendarOpen(false);
  }
  
  const isRenewedFlow = !!existingClientData;

  const loanAmounts = useMemo(() => {
    const maxAmount = isRenewedFlow ? 8500 : 5000;
    return Array.from({ length: (maxAmount - 4500) / 500 + 1 }, (_, i) => 4500 + i * 500);
  }, [isRenewedFlow]);
  
  
  return (
    <div className="flex flex-col">
      {isRenewedFlow && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground -ml-2 mb-2 self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a búsqueda
        </Button>
      )}

      <form id="vale-creation-form" action={formAction} onSubmit={deviceSignature.onSubmit} className="space-y-4">
        <input type="hidden" name="deviceId" value={auditData.deviceId} />
        <input type="hidden" name="deviceModel" value={auditData.deviceModel} />
        <input type="hidden" name="latitude" value={auditData.latitude} />
        <input type="hidden" name="longitude" value={auditData.longitude} />
        {isRenewedFlow && existingClientData && (
            <>
                <input type="hidden" name="firstName" value={existingClientData.firstName || ''} />
                <input type="hidden" name="lastNameP" value={existingClientData.lastNameP || ''} />
                <input type="hidden" name="lastNameM" value={existingClientData.lastNameM || ''} />
                <input type="hidden" name="phone" value={existingClientData.phone || ''} />
                {existingClientData.curp && (
                    <input type="hidden" name="curp" value={existingClientData.curp} />
                )}
                {existingClientData.id_cliente && (
                    <input type="hidden" name="id_cliente" value={existingClientData.id_cliente} />
                )}
            </>
        )}
        <input type="hidden" name="isRenewed" value={String(isRenewedFlow)} />
        <input type="hidden" name="birthDate" value={date ? format(date, 'yyyy-MM-dd') : ''} />
        
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="font-headline text-xs">Nombre(s)</Label>
          <Input id="firstName" name="firstName" placeholder="Ej. Juan" defaultValue={existingClientData?.firstName} readOnly={isRenewedFlow} required className={cn(isRenewedFlow && 'bg-muted cursor-not-allowed text-muted-foreground')} />
          {state?.errors?.firstName && <p className="text-xs text-destructive">{state.errors.firstName[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastNameP" className="font-headline text-xs">Apellido Paterno</Label>
          <Input id="lastNameP" name="lastNameP" placeholder="Ej. Pérez" defaultValue={existingClientData?.lastNameP} readOnly={isRenewedFlow} required className={cn(isRenewedFlow && 'bg-muted cursor-not-allowed text-muted-foreground')} />
          {state?.errors?.lastNameP && <p className="text-xs text-destructive">{state.errors.lastNameP[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastNameM" className="font-headline text-xs">Apellido Materno</Label>
          <Input id="lastNameM" name="lastNameM" placeholder="Ej. García" defaultValue={existingClientData?.lastNameM} readOnly={isRenewedFlow} required className={cn(isRenewedFlow && 'bg-muted cursor-not-allowed text-muted-foreground')} />
          {state?.errors?.lastNameM && <p className="text-xs text-destructive">{state.errors.lastNameM[0]}</p>}
        </div>
        <Collapsible open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <div className="space-y-1.5">
            <Label htmlFor="birthDate-display" className="font-headline text-xs">Fecha de Nacimiento</Label>
            <CollapsibleTrigger asChild>
              <Button id="birthDate-display" type="button" variant={'outline'} className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground', isRenewedFlow && 'bg-muted cursor-not-allowed text-muted-foreground')} disabled={isRenewedFlow}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
              </Button>
            </CollapsibleTrigger>
            {state?.errors?.birthDate && <p className="text-xs text-destructive">{state.errors.birthDate[0]}</p>}
          </div>
          <CollapsibleContent>
            <div className="flex justify-center pt-2">
              <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus locale={es} captionLayout="dropdown-buttons" fromYear={1930} toYear={new Date().getFullYear()} className="border rounded-md" />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {!isRenewedFlow && (
            <div className="space-y-1.5">
                <Label htmlFor="phone_number" className="font-headline text-xs">Teléfono</Label>
                <div className="flex items-center gap-1">
                    <span className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 text-base md:text-sm text-muted-foreground">+52</span>
                    <Input id="phone_number" name="phone_number" type="tel" placeholder="55 1234 5678" required={!isRenewedFlow} pattern="\d{10}" title="Ingresa un número de 10 dígitos" />
                </div>
                {state?.errors?.phone_number && <p className="text-xs text-destructive">{state.errors.phone_number[0]}</p>}
            </div>
        )}

        <div className="space-y-1.5">
            <Label htmlFor="loanAmount" className="font-headline text-xs">Monto de Préstamo</Label>
            <Select name="loanAmount" required>
                <SelectTrigger><SelectValue placeholder="Selecciona un monto" /></SelectTrigger>
                <SelectContent>{loanAmounts.map((amount) => (<SelectItem key={amount} value={String(amount)}>{formatCurrency(amount)}</SelectItem>))}</SelectContent>
            </Select>
            {state?.errors?.loanAmount && <p className="text-xs text-destructive">{state.errors.loanAmount[0]}</p>}
        </div>
        <div className="space-y-1.5">
            <Label htmlFor="installments" className="font-headline text-xs">No. de Quincenas</Label>
            <Select name="installments" required>
                <SelectTrigger><SelectValue placeholder="Selecciona un plazo" /></SelectTrigger>
                <SelectContent>
                    {plazosPermitidos.map((q) => (
                        <SelectItem key={q} value={String(q)}>
                            {q} Quincenas
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {state?.errors?.installments && <p className="text-xs text-destructive">{state.errors.installments[0]}</p>}
        </div>

        <DeviceSignatureFields signature={deviceSignature.signature} />
        <DeviceSignatureError message={deviceSignature.error} />
        {state?.message && !state.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-headline">No se pudo crear el vale</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <div className="pt-2">
            <ConfirmationSubmitButton />
        </div>
      </form>
    </div>
  );
}

function ConfirmationSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" disabled={pending} className="w-full bg-accent hover:bg-accent/90">
          {pending ? <Loader2 className="animate-spin" /> : <PlusCircle />}
          Crear Vale
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 text-amber-500" />
            Confirmación Requerida
          </AlertDialogTitle>
          <AlertDialogDescription className="py-2">
            Por favor, asegúrate de que el <strong>nombre completo</strong> y la <strong>fecha de nacimiento</strong> del cliente sean <strong>exactamente iguales</strong> a los de su INE.
            <br /><br />
            Si los datos no coinciden, el vale será <strong>rechazado en sucursal</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="vale-creation-form" disabled={pending}>
            {pending ? <Loader2 className="animate-spin mr-2" /> : null}
            Confirmar y Crear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
