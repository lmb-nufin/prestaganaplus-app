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

/**
 * Tarjeta del dashboard: solo aparece si hay solicitud o equipo.
 * Colapsada por default: muestra el resumen (estado actual); al tocarla, el avance completo.
 */
export function PhoneTrackerCard({ phoneState }: { phoneState: PhoneState | null }) {
  if (!phoneState || (!phoneState.solicitud && !phoneState.dispositivo)) return null;
  const { solicitud, dispositivo } = phoneState;

  const reported = dispositivo?.estatus === 'REPORTADO' || dispositivo?.estatus === 'REVOCADO';
  const reportedLabel = dispositivo?.estatus === 'REVOCADO' ? 'Equipo desactivado' : 'Equipo reportado';
  // Con equipo entregado el avance llega a Activo aunque la solicitud no lo diga.
  const current: PhoneRequestStatus | undefined = dispositivo ? 'ACTIVO' : solicitud?.estatus;
  const currentIndex = STEPS.findIndex((step) => step.status === current);

  let summary: { text: string; tone: 'normal' | 'muted' | 'danger' };
  if (current === 'CANCELADO') summary = { text: 'Solicitud cancelada', tone: 'muted' };
  else if (reported) summary = { text: reportedLabel, tone: 'danger' };
  else if (currentIndex >= 0) summary = { text: `${STEPS[currentIndex].label} · paso ${currentIndex + 1} de ${STEPS.length}`, tone: 'normal' };
  else summary = { text: 'En proceso', tone: 'muted' };

  return (
    <Card className="shadow-sm border-indigo-200" data-testid="phone-tracker">
      <Collapsible>
        <CollapsibleTrigger
          className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="phone-tracker-toggle"
        >
          <span className="min-w-0 space-y-1">
            <span className="flex items-center gap-2 font-headline text-sm font-bold">
              <Smartphone className="h-5 w-5 flex-shrink-0 text-indigo-600" />
              Mi Teléfono PrestaGana
            </span>
            <span
              className={cn(
                'block text-xs',
                summary.tone === 'normal' && 'font-semibold text-indigo-900',
                summary.tone === 'muted' && 'text-muted-foreground',
                summary.tone === 'danger' && 'font-semibold text-destructive'
              )}
              data-testid="phone-tracker-summary"
            >
              {summary.text}
            </span>
            {dispositivo && <span className="block truncate text-xs text-muted-foreground">{dispositivo.modelo}</span>}
          </span>
          <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="space-y-3 p-3 pt-0">
            {solicitud && <p className="text-xs text-muted-foreground">Folio {solicitud.folio}</p>}
            {current === 'CANCELADO' ? (
              <p className="flex items-start gap-2 text-xs text-muted-foreground" data-testid="phone-tracker-cancelled">
                <XCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                Tu solicitud fue cancelada. Si quieres el equipo, puedes solicitarlo de nuevo desde Vale Nuevo → Préstamo Personal.
              </p>
            ) : (
              <>
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
                {currentIndex >= 0 && !reported && (
                  <p className="rounded-md bg-indigo-50 p-2 text-xs text-indigo-900" data-testid="phone-tracker-todo">
                    <span className="font-semibold">Qué sigue: </span>
                    {STEPS[currentIndex].todo}
                  </p>
                )}
                {/* Equipo reportado o revocado: el "Qué sigue" explica que no se emite hasta reactivarlo. */}
                {reported && (
                  <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive" data-testid="phone-reported">
                    <Ban className="h-4 w-4 flex-shrink-0" />
                    <span>
                      <span className="font-semibold">Qué sigue: </span>
                      {reportedLabel}. No puedes emitir vales desde este equipo hasta reactivarlo en sucursal.
                    </span>
                  </p>
                )}
              </>
            )}
            {/* El modelo ya está en el resumen; aquí solo el IMEI. */}
            {dispositivo && (
              <p className="text-xs text-muted-foreground">IMEI terminación {dispositivo.ultimos4Imei}</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
