import { Ban, Check, Smartphone, XCircle } from 'lucide-react';

import type { PhoneRequestStatus, PhoneState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const STEPS: { status: Exclude<PhoneRequestStatus, 'CANCELADO'>; label: string; todo: string }[] = [
  { status: 'SOLICITADO', label: 'Solicitado', todo: 'Transfiere el enganche a la CLABE de tu línea. Se registra automáticamente.' },
  { status: 'ENGANCHE_CONFIRMADO', label: 'Enganche confirmado', todo: 'Recibimos tu enganche. Estamos apartando tu equipo.' },
  { status: 'EN_PREPARACION', label: 'En preparación', todo: 'Estamos configurando tu Teléfono PrestaGana. Te avisaremos cuando esté listo.' },
  { status: 'LISTO_PARA_RECOGER', label: 'Listo para recoger', todo: 'Tu equipo está listo. Recógelo en tu sucursal con tu INE; ahí firmas tu contrato.' },
  { status: 'ACTIVO', label: 'Activo', todo: 'Tu equipo está activo. Desde ahora tus vales se emiten desde él.' },
];

/** Tarjeta del dashboard: solo aparece si hay solicitud o equipo. */
export function PhoneTrackerCard({ phoneState }: { phoneState: PhoneState | null }) {
  if (!phoneState || (!phoneState.solicitud && !phoneState.dispositivo)) return null;
  const { solicitud, dispositivo } = phoneState;

  const reported = dispositivo?.estatus === 'REPORTADO' || dispositivo?.estatus === 'REVOCADO';
  // Con equipo entregado el avance llega a Activo aunque la solicitud no lo diga.
  const current: PhoneRequestStatus | undefined = dispositivo ? 'ACTIVO' : solicitud?.estatus;
  const currentIndex = STEPS.findIndex((step) => step.status === current);

  return (
    <Card className="shadow-sm border-indigo-200" data-testid="phone-tracker">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="font-headline text-sm font-bold flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-indigo-600" />
          Mi Teléfono PrestaGana
        </CardTitle>
        {solicitud && <p className="text-xs text-muted-foreground">Folio {solicitud.folio}</p>}
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
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
          </>
        )}
        {dispositivo && (
          <p className="text-xs text-muted-foreground">
            {dispositivo.modelo} · IMEI terminación {dispositivo.ultimos4Imei}
          </p>
        )}
        {reported && (
          <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive" data-testid="phone-reported">
            <Ban className="h-4 w-4 flex-shrink-0" />
            Tu equipo está reportado y la emisión de vales está bloqueada. Acude a sucursal para reactivar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
