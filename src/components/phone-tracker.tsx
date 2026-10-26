'use client';

import type { ReactNode } from 'react';
import { Ban, Check, ChevronDown, Smartphone, XCircle } from 'lucide-react';

import type { PhoneRequestStatus, PhoneState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

const STEPS: { status: Exclude<PhoneRequestStatus, 'CANCELADO'>; label: string; short: string; todo: string }[] = [
  { status: 'SOLICITADO', label: 'Solicitado', short: 'Solicitado', todo: 'Transfiere el enganche a la CLABE de tu línea. Se registra automáticamente.' },
  { status: 'ENGANCHE_CONFIRMADO', label: 'Enganche confirmado', short: 'Enganche', todo: 'Recibimos tu enganche. Estamos apartando tu equipo.' },
  { status: 'EN_PREPARACION', label: 'En preparación', short: 'Preparación', todo: 'Estamos configurando tu Teléfono PrestaGana. Te avisaremos cuando esté listo.' },
  { status: 'LISTO_PARA_RECOGER', label: 'Listo para recoger', short: 'Recoger', todo: 'Tu equipo está listo. Recógelo en tu sucursal con tu INE; ahí firmas tu contrato.' },
  { status: 'ACTIVO', label: 'Activo', short: 'Activo', todo: 'Tu equipo está activo. Desde ahora tus vales se emiten desde él.' },
];

/** Stepper horizontal de 5 pasos; la línea va del centro del paso 1 al centro del paso 5. */
function Stepper({ currentIndex, danger, stepText }: { currentIndex: number; danger: boolean; stepText: ReactNode }) {
  const span = 100 - 100 / STEPS.length; // del centro de la primera columna al de la última
  return (
    <div className="relative mt-3.5">
      <span className="absolute top-[11px] h-0.5 bg-[#E5E7EB]" style={{ left: `${50 / STEPS.length}%`, width: `${span}%` }} aria-hidden="true" />
      <span
        className={cn('absolute top-[11px] h-0.5', danger ? 'bg-destructive/60' : 'bg-indigo-600')}
        style={{ left: `${50 / STEPS.length}%`, width: `${(span * currentIndex) / (STEPS.length - 1)}%` }}
        aria-hidden="true"
      />
      {stepText}
      <ol className="relative grid grid-cols-5">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={step.status}
              aria-current={active ? 'step' : undefined}
              data-testid={active ? 'phone-tracker-current' : undefined}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
                  done && (danger ? 'bg-destructive/60 text-white' : 'bg-indigo-600 text-white'),
                  active && (danger ? 'bg-white text-destructive ring-2 ring-destructive/60' : 'bg-white text-indigo-600 ring-2 ring-indigo-600'),
                  !done && !active && 'bg-white text-muted-foreground ring-2 ring-[#E5E7EB]'
                )}
                aria-hidden="true"
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-center text-[11px] leading-tight',
                  active ? cn('font-bold', danger ? 'text-destructive' : 'text-indigo-900') : 'text-muted-foreground'
                )}
              >
                {step.short}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Tarjeta del dashboard: solo aparece si hay solicitud o equipo.
 * Siempre visible: etapa, stepper y qué sigue. Al tocar el encabezado: modelo e IMEI.
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
  const showStepper = !cancelled && currentIndex >= 0;
  const stepLabel = `Paso ${currentIndex + 1} de ${STEPS.length}`;
  // Lo secundario (modelo e IMEI) solo existe con equipo; sin él no hay nada que desplegar.
  const hasDetails = !!dispositivo;

  const headerContent = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <Smartphone className="h-5 w-5 flex-shrink-0 text-indigo-600" />
        <span className="font-headline text-[15px] font-semibold">Mi Teléfono PrestaGana</span>
      </span>
      <span className="ml-auto flex flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        {solicitud ? (
          <span>Folio {solicitud.folio}</span>
        ) : (
          showStepper && <span data-testid="phone-tracker-step">{stepLabel}</span>
        )}
        {hasDetails && (
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        )}
      </span>
    </>
  );
  const headerClass = 'group -mx-2 -mt-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-2 rounded-xl px-2 text-left';

  const body = (
    <>
      <span
        className={cn(
          'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold',
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

      {showStepper && (
        <Stepper
          currentIndex={currentIndex}
          danger={reported}
          // Con el folio en el encabezado, el paso queda para lector de pantalla (los círculos son visuales).
          stepText={solicitud && <span className="sr-only" data-testid="phone-tracker-step">{stepLabel}</span>}
        />
      )}

      {cancelled ? (
        <p className="mt-3.5 text-xs text-muted-foreground" data-testid="phone-tracker-cancelled">
          Si quieres el equipo, puedes solicitarlo de nuevo desde Vale Nuevo → Préstamo Personal.
        </p>
      ) : reported ? (
        <p className="mt-3.5 rounded-[14px] bg-destructive/10 p-3 text-xs text-destructive" data-testid="phone-reported">
          <span className="font-semibold">Qué sigue: </span>
          {reportedLabel}. No puedes emitir vales desde este equipo hasta reactivarlo en sucursal.
        </p>
      ) : (
        currentIndex >= 0 && (
          <p className="mt-3.5 rounded-[14px] bg-indigo-50 p-3 text-xs text-indigo-900" data-testid="phone-tracker-todo">
            <span className="font-semibold">Qué sigue: </span>
            {STEPS[currentIndex].todo}
          </p>
        )
      )}
    </>
  );

  return (
    <Card className="rounded-[20px] border border-[#EEEEF2] bg-white p-[18px] shadow-none" data-testid="phone-tracker">
      {hasDetails ? (
        <Collapsible>
          <CollapsibleTrigger
            className={cn(headerClass, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
            data-testid="phone-tracker-toggle"
          >
            {headerContent}
          </CollapsibleTrigger>
          {body}
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="mt-3.5 space-y-1 border-t border-[#F0F0F3] pt-3 text-xs text-muted-foreground" data-testid="phone-tracker-details">
              <p className="font-medium text-foreground">{dispositivo.modelo}</p>
              <p>IMEI terminación {dispositivo.ultimos4Imei}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <div className={headerClass}>{headerContent}</div>
          {body}
        </>
      )}
    </Card>
  );
}
