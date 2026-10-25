'use client';

import { Ban, Check, ChevronDown, Smartphone, XCircle } from 'lucide-react';

import type { PhoneRequestStatus, PhoneState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

const STEPS: { status: Exclude<PhoneRequestStatus, 'CANCELADO'>; label: string; todo: string }[] = [
  { status: 'SOLICITADO', label: 'Solicitado', todo: 'Transfiere el enganche a la CLABE de tu línea. Se registra automáticamente.' },
  { status: 'ENGANCHE_CONFIRMADO', label: 'Enganche confirmado', todo: 'Recibimos tu enganche. Estamos apartando tu equipo.' },
  { status: 'EN_PREPARACION', label: 'En preparación', todo: 'Estamos configurando tu Teléfono PrestaGana. Te avisaremos cuando esté listo.' },
  { status: 'LISTO_PARA_RECOGER', label: 'Listo para recoger', todo: 'Tu equipo está listo. Recógelo en tu sucursal con tu INE; ahí firmas tu contrato.' },
  { status: 'ACTIVO', label: 'Activo', todo: 'Tu equipo está activo. Desde ahora tus vales se emiten desde él.' },
];

/** Barra de 5 segmentos: la etapa se ve de un vistazo con la tarjeta colapsada. */
function StepBar({ currentIndex, danger }: { currentIndex: number; danger: boolean }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {STEPS.map((step, index) => (
        <span
          key={step.status}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            index > currentIndex && 'bg-indigo-100',
            index <= currentIndex && (danger ? 'bg-destructive/60' : 'bg-indigo-600'),
            index === currentIndex && !danger && currentIndex < STEPS.length - 1 && 'bg-indigo-400'
          )}
        />
      ))}
    </span>
  );
}

/**
 * Tarjeta del dashboard: solo aparece si hay solicitud o equipo.
 * Colapsada por default: etapa, avance, qué sigue y modelo. Al tocarla: folio, los 5 pasos e IMEI.
 */
export function PhoneTrackerCard({ phoneState }: { phoneState: PhoneState | null }) {
  if (!phoneState || (!phoneState.solicitud && !phoneState.dispositivo)) return null;
  const { solicitud, dispositivo } = phoneState;

  const reported = dispositivo?.estatus === 'REPORTADO' || dispositivo?.estatus === 'REVOCADO';
  const reportedLabel = dispositivo?.estatus === 'REVOCADO' ? 'Equipo desactivado' : 'Equipo reportado';
  // Con equipo entregado el avance llega a Activo aunque la solicitud no lo diga.
  const current: PhoneRequestStatus | undefined = dispositivo ? 'ACTIVO' : solicitud?.estatus;
  const cancelled = current === 'CANCELADO';
  const currentIndex = STEPS.findIndex((step) => step.status === current);
  const stageLabel = cancelled ? 'Solicitud cancelada' : reported ? reportedLabel : currentIndex >= 0 ? STEPS[currentIndex].label : 'En proceso';

  return (
    <Card className="shadow-sm border-indigo-200" data-testid="phone-tracker">
      <Collapsible>
        <CollapsibleTrigger
          className="group flex min-h-11 w-full items-start justify-between gap-3 rounded-lg p-3 pb-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="phone-tracker-toggle"
        >
          <span className="min-w-0 flex-1 space-y-2">
            <span className="flex items-center gap-2 font-headline text-sm font-bold">
              <Smartphone className="h-5 w-5 flex-shrink-0 text-indigo-600" />
              Mi Teléfono PrestaGana
            </span>
            <span className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold',
                  cancelled && 'bg-muted text-muted-foreground',
                  reported && 'bg-destructive/10 text-destructive',
                  !cancelled && !reported && 'bg-indigo-100 text-indigo-900'
                )}
              >
                {cancelled && <XCircle className="h-4 w-4" />}
                {reported && <Ban className="h-4 w-4" />}
                {!cancelled && !reported && currentIndex === STEPS.length - 1 && <Check className="h-4 w-4" />}
                <span data-testid="phone-tracker-summary">{stageLabel}</span>
              </span>
              {!cancelled && currentIndex >= 0 && (
                <span className="flex-shrink-0 text-xs text-muted-foreground" data-testid="phone-tracker-step">
                  Paso {currentIndex + 1} de {STEPS.length}
                </span>
              )}
            </span>
            {!cancelled && currentIndex >= 0 && <StepBar currentIndex={currentIndex} danger={reported} />}
          </span>
          <ChevronDown className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>

        {/* Siempre visible: lo que la asociada tiene que hacer y qué equipo es. */}
        <div className="space-y-2 px-3 pb-3">
          {cancelled ? (
            <p className="text-xs text-muted-foreground" data-testid="phone-tracker-cancelled">
              Si quieres el equipo, puedes solicitarlo de nuevo desde Vale Nuevo → Préstamo Personal.
            </p>
          ) : reported ? (
            <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive" data-testid="phone-reported">
              <span className="font-semibold">Qué sigue: </span>
              {reportedLabel}. No puedes emitir vales desde este equipo hasta reactivarlo en sucursal.
            </p>
          ) : (
            currentIndex >= 0 && (
              <p className="rounded-md bg-indigo-50 p-2 text-xs text-indigo-900" data-testid="phone-tracker-todo">
                <span className="font-semibold">Qué sigue: </span>
                {STEPS[currentIndex].todo}
              </p>
            )
          )}
          {dispositivo && <p className="truncate text-xs text-muted-foreground">{dispositivo.modelo}</p>}
        </div>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="space-y-3 border-t p-3" data-testid="phone-tracker-details">
            {solicitud && <p className="text-xs text-muted-foreground">Folio {solicitud.folio}</p>}
            {!cancelled && (
              <ol className="space-y-1.5">
                {STEPS.map((step, index) => {
                  const done = index < currentIndex;
                  const active = index === currentIndex;
                  return (
                    <li
                      key={step.status}
                      aria-current={active ? 'step' : undefined}
                      data-testid={active ? 'phone-tracker-current' : undefined}
                      className={cn('flex items-center gap-2 text-xs', active ? 'font-semibold text-indigo-900' : 'text-muted-foreground')}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px]',
                          done && 'border-indigo-600 bg-indigo-600 text-white',
                          active && 'border-indigo-600 bg-indigo-100 text-indigo-900 ring-2 ring-indigo-300',
                          !done && !active && 'border-muted-foreground/40'
                        )}
                      >
                        {done ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      {step.label}
                    </li>
                  );
                })}
              </ol>
            )}
            {dispositivo && <p className="text-xs text-muted-foreground">IMEI terminación {dispositivo.ultimos4Imei}</p>}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
