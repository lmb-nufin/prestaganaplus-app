'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { AlertCircle, Check, CheckCircle2, Copy, Info, Loader2, ShieldCheck, Smartphone } from 'lucide-react';

import { requestPhone } from '@/app/actions';
import type { PhoneOfferOption } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

type State = {
  success?: boolean;
  message: string;
  folio?: string;
  errors?: { quincenas?: string[]; aceptoTerminos?: string[] };
};
const initialState: State = { message: '' };

export function PhoneOfferView({ option, stpClabe }: { option: PhoneOfferOption; stpClabe?: string }) {
  const [state, formAction] = useActionState(requestPhone, initialState);

  if (state.success && state.folio) {
    return <RequestConfirmation folio={state.folio} downPayment={option.offer?.engancheMonto ?? 0} stpClabe={stpClabe} />;
  }

  if (!option.available) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="rounded-t-lg bg-indigo-600 text-white">
          <CardTitle className="flex items-center gap-2 font-headline text-lg">
            <Smartphone className="h-5 w-5" />
            Samsung Galaxy A17
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert data-testid="phone-offer-unavailable">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-headline">Oferta no disponible</AlertTitle>
            <AlertDescription>
              {option.message}
              {option.reason === 'SOLICITUD_ABIERTA' && option.folio && <> Folio {option.folio}.</>}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Ir al Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return <OfferForm offer={option.offer} state={state} formAction={formAction} />;
}

function OfferForm({
  offer,
  state,
  formAction,
}: {
  offer: Extract<PhoneOfferOption, { available: true }>['offer'];
  state: State;
  formAction: (formData: FormData) => void;
}) {
  const [quincenas, setQuincenas] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);

  return (
    <form action={formAction} className="space-y-3">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-indigo-600 text-white">
          <CardTitle className="flex items-center gap-2 font-headline text-lg">
            <Smartphone className="h-5 w-5" />
            Tu equipo de trabajo
          </CardTitle>
          <CardDescription className="text-xs text-indigo-100">Voluntario y a tu nombre. No usa tu línea de crédito.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={offer.modelo.imagenUrl} alt={offer.modelo.nombre} className="h-28 w-20 flex-shrink-0 object-contain" />
            <div className="min-w-0">
              <h2 className="font-headline text-base font-semibold leading-tight">{offer.modelo.nombre}</h2>
              <p className="text-xs text-muted-foreground">{offer.modelo.almacenamiento}</p>
              <p className="mt-1 text-sm">
                Precio <span className="font-semibold" data-testid="phone-price">{formatCurrency(offer.precio)}</span>
              </p>
            </div>
          </div>

          <div className="rounded-lg border-2 border-indigo-300 bg-indigo-50 p-3 text-center">
            <p className="text-xs text-indigo-700">Enganche (por transferencia a la CLABE de tu línea)</p>
            <p className="font-headline text-2xl font-bold text-indigo-900" data-testid="phone-down-payment">
              {formatCurrency(offer.engancheMonto)}
            </p>
          </div>

          <fieldset className="space-y-1.5">
            <legend className="font-headline text-xs">Elige tu plazo</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {offer.planes.map((plan) => {
                const selected = quincenas === plan.quincenas;
                return (
                  <button
                    key={plan.quincenas}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-testid={`plan-${plan.quincenas}`}
                    onClick={() => setQuincenas(plan.quincenas)}
                    className={cn(
                      'min-w-0 rounded-lg border-2 p-3 text-left transition-colors',
                      selected ? 'border-indigo-600 bg-indigo-50' : 'border-muted bg-background hover:border-indigo-300'
                    )}
                  >
                    <p className="font-headline text-sm font-bold">{plan.quincenas} quincenas</p>
                    <p className="mt-1 text-xs text-muted-foreground">Pago quincenal</p>
                    <p className="text-base font-semibold text-indigo-900">{formatCurrency(plan.pagoQuincenal)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Total a pagar</p>
                    <p className="text-sm font-semibold">{formatCurrency(plan.totalPagar)}</p>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="quincenas" value={quincenas ?? ''} />
            {state.errors?.quincenas && <p className="text-xs text-destructive">{state.errors.quincenas[0]}</p>}
          </fieldset>

          <Alert className="border-indigo-200 bg-white">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <AlertTitle className="font-headline text-sm">Importante</AlertTitle>
            <AlertDescription className="text-xs">
              Con este equipo tus vales solo se emiten desde él. Consultar saldo, pagar y soporte funcionan desde cualquier dispositivo.
            </AlertDescription>
          </Alert>

          <div className="space-y-1 rounded-md bg-muted/60 p-3 text-xs">
            <p className="font-headline font-semibold">Si te atrasas en un pago del equipo</p>
            <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
              <li>Primero te avisamos en la app y por mensaje.</li>
              <li>Si sigue el atraso, tienes un periodo de gracia para ponerte al corriente.</li>
              <li>Después, el equipo puede quedar con funciones limitadas hasta que pagues.</li>
              <li>Pagar y pedir soporte siempre funcionan.</li>
            </ul>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="aceptoTerminos"
              name="aceptoTerminos"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="aceptoTerminos" className="text-xs font-normal leading-snug">
              Acepto las condiciones del financiamiento del equipo y que mis vales se emitan solo desde él.
            </Label>
          </div>
          {state.errors?.aceptoTerminos && <p className="text-xs text-destructive">{state.errors.aceptoTerminos[0]}</p>}

          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-headline">No se pudo registrar la solicitud</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <SubmitButton disabled={quincenas === null || !accepted} />
          {/* Explica por qué el botón sigue deshabilitado. */}
          {(quincenas === null || !accepted) && (
            <p className="text-center text-xs text-muted-foreground" data-testid="phone-submit-hint">
              {quincenas === null && !accepted
                ? 'Elige tu plazo y acepta las condiciones para solicitar.'
                : quincenas === null
                  ? 'Elige tu plazo para solicitar.'
                  : 'Acepta las condiciones para solicitar.'}
            </p>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
      {pending ? <Loader2 className="animate-spin" /> : <Smartphone />}
      Solicitar
    </Button>
  );
}

function RequestConfirmation({ folio, downPayment, stpClabe }: { folio: string; downPayment: number; stpClabe?: string }) {
  const [copied, setCopied] = useState(false);
  const copyClabe = async () => {
    if (!stpClabe) return;
    try {
      await navigator.clipboard.writeText(stpClabe);
      setCopied(true);
    } catch {}
  };

  return (
    <Card className="shadow-lg" data-testid="phone-request-confirmation">
      <CardHeader className="items-center text-center">
        <CheckCircle2 className="h-10 w-10 text-accent" />
        <CardTitle className="font-headline text-lg">¡Solicitud registrada!</CardTitle>
        <CardDescription>Folio {folio}</CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm">
        <p className="font-semibold">Transfiere el enganche a la CLABE de tu línea. Se registra automáticamente.</p>
        <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-left text-xs" data-testid="phone-down-payment-transfer">
          <p className="flex justify-between">
            <span className="text-muted-foreground">Monto</span>
            <span className="font-semibold">{formatCurrency(downPayment)}</span>
          </p>
          {stpClabe ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-muted-foreground">CLABE (STP)</span>
              <span className="font-mono font-semibold" data-testid="phone-clabe">{stpClabe}</span>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-9 flex-shrink-0" onClick={copyClabe} aria-label="Copiar CLABE">
                {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <p className="mt-1 text-muted-foreground">Es la misma CLABE con la que pagas tu línea (Dashboard → Pagar Ahora).</p>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Puedes seguir el avance de tu equipo desde el Dashboard.</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/">Ir al Dashboard</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
