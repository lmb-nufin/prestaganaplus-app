'use client';

import { Card } from "@/components/ui/card";
import { AlertTriangle, Ban, ChevronDown, Download, FileText, Lock, Plus, Star, User } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { PaymentOptionsDialog } from "./payment-options-dialog";
import Link from "next/link";
import type { IssuancePause, PhoneCollection, PhoneState } from "@/lib/types";
import { PhoneTrackerCard } from "./phone-tracker";
import { LineGauge, placedPercent } from "./line-gauge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useToast } from "@/hooks/use-toast";

/** Estilo común de las tarjetas del dashboard. */
const dashboardCard = "rounded-[20px] border border-[#EEEEF2] bg-white p-[18px] shadow-none";
const cardTitle = "font-headline text-[15px] font-semibold";
const primaryButton = "h-[50px] w-full rounded-[14px] font-headline text-[15px] font-semibold";

const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
    <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
    </div>
);

// La cuota del teléfono va dentro de la línea: el aviso habla de un pago vencido, no de una deuda aparte.
const moraStyles = {
    AVISO: { box: 'border-amber-300 bg-amber-50 text-amber-900', title: 'Pago vencido', next: 'Págalo para evitar el bloqueo de tu Teléfono PrestaGana.' },
    GRACIA: { box: 'border-orange-400 bg-orange-50 text-orange-900', title: 'Estás en periodo de gracia', next: 'Págalo para evitar el bloqueo de tu Teléfono PrestaGana.' },
    BLOQUEO: { box: 'border-destructive/40 bg-destructive/10 text-destructive', title: 'Pago vencido', next: 'Págalo para quitar las limitaciones de tu Teléfono PrestaGana.' },
} as const;

const statusStyles = {
    ok: { pill: 'bg-green-50 text-green-800', dot: 'bg-green-600', amount: '' },
    warning: { pill: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500', amount: '' },
    late: { pill: 'bg-red-50 text-red-700', dot: 'bg-red-600', amount: 'text-red-800' },
} as const;

const CurrentStatusCard = ({ data, phoneState }: { data: any; phoneState: PhoneState | null }) => {
    const mora = phoneState?.mora;
    // Con mora nunca se muestra "Al Día": AVISO es un pago vencido (ámbar); gracia o bloqueo, atrasada (rojo).
    const isLate = data.paymentStatus.status === 'Atrasada' || mora?.nivel === 'GRACIA' || mora?.nivel === 'BLOQUEO';
    const tone = isLate ? 'late' : mora ? 'warning' : 'ok';
    const statusLabel = isLate ? 'Atrasada' : mora ? 'Pago vencido' : data.paymentStatus.status;

    // Desglose: amountDue incluye la cuota del teléfono y, si hay, su mora.
    const phone: PhoneCollection | undefined = data.telefono;
    const phoneDue = phone ? phone.pagoQuincenal + (mora?.monto ?? 0) : 0;
    const valesDue = Math.max(data.paymentStatus.amountDue - phoneDue, 0);

    return (
        <Card className={dashboardCard}>
            <h2 className={cardTitle}>Situación Actual</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-[#F7F7F9] px-3.5 py-3">
                    <p className="text-xs text-muted-foreground">Estatus</p>
                    <span className={cn('mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', statusStyles[tone].pill)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', statusStyles[tone].dot)} aria-hidden="true" />
                        <span data-testid="payment-status">{statusLabel}</span>
                    </span>
                </div>
                <div className="rounded-2xl bg-[#F7F7F9] px-3.5 py-3">
                    <p className="text-xs text-muted-foreground">Monto a Pagar</p>
                    <p className={cn('mt-1 font-headline text-xl font-bold tabular-nums', statusStyles[tone].amount)}>
                        {formatCurrency(data.paymentStatus.amountDue)}
                    </p>
                </div>
            </div>
            {phone && (
                <div className="mt-3 flex flex-col gap-1.5 text-[13px]" data-testid="collection-breakdown">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Vales</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(valesDue)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">
                            Teléfono · cuota {phone.cuotaActual} de {phone.totalCuotas}
                        </span>
                        <span className="font-semibold tabular-nums">{formatCurrency(phoneDue)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Saldo del equipo</span>
                        <span className="tabular-nums">{formatCurrency(phone.saldo)}</span>
                    </div>
                </div>
            )}
            {mora ? (
                <div
                    className={cn('mt-3 rounded-[14px] border p-3 text-xs', moraStyles[mora.nivel].box)}
                    data-testid={`phone-mora-${mora.nivel}`}
                >
                    <p className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        {moraStyles[mora.nivel].title}
                    </p>
                    <p className="mt-0.5">
                        Tienes un pago vencido de {formatCurrency(mora.monto)} ({mora.dias} {mora.dias === 1 ? 'día' : 'días'}). {moraStyles[mora.nivel].next}
                    </p>
                    <div className="mt-3">
                        <PaymentOptionsDialog paymentReferences={data.paymentReferences} prominent />
                    </div>
                </div>
            ) : (
                // Con mora, el botón de pago vive en el aviso; no se repite abajo.
                <div className="mt-4">
                    <PaymentOptionsDialog paymentReferences={data.paymentReferences} prominent />
                </div>
            )}
        </Card>
    );
}

const LineDataCard = ({ data, issuancePause }: { data: any; issuancePause: IssuancePause | null }) => {
    const { toast } = useToast();
    const percent = placedPercent(data.creditLine.placed, data.creditLine.limit);
    return (
        <Card className={dashboardCard}>
            <h2 className={cardTitle}>Línea PrestaGana</h2>
            <div className="mt-3 flex items-center gap-[18px]">
                <LineGauge percent={percent} />
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div>
                        <p className="text-xs text-muted-foreground">Disponible</p>
                        <p className={cn(
                            "font-headline text-xl font-bold tabular-nums",
                            data.creditLine.available < 3000 && "text-destructive"
                        )}>
                            {formatCurrency(data.creditLine.available)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[13px]">
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        <span className="text-muted-foreground">Colocado</span>
                        <span className="ml-auto font-bold tabular-nums text-[#9E2F4B]">{formatCurrency(data.creditLine.placed)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px]">
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#F6E3E8] ring-1 ring-[#E8C9D1]" aria-hidden="true" />
                        <span className="text-muted-foreground">Límite</span>
                        <span className="ml-auto font-bold tabular-nums">{formatCurrency(data.creditLine.limit)}</span>
                    </div>
                </div>
            </div>
            {issuancePause ? (
                // Emisión en pausa: se ve gris, no navega y explica por qué.
                <Button
                    type="button"
                    aria-disabled="true"
                    data-testid="line-new-vale-paused"
                    className={cn(primaryButton, "mt-4 bg-muted text-muted-foreground shadow-none hover:bg-muted")}
                    onClick={() => toast({ title: issuancePause.title, description: issuancePause.message })}
                >
                    <Lock />
                    Vale Nuevo en pausa
                </Button>
            ) : (
                <Button className={cn(primaryButton, "mt-4 bg-primary text-primary-foreground")} asChild>
                    <Link href="/vales/nuevo">
                        <Plus />
                        Vale Nuevo
                    </Link>
                </Button>
            )}
        </Card>
    )
};

const rowIcon = "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]";
const rowFocus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

// Relación de Cobro y Datos de la Asociada en una sola lista. Datos va colapsada por default.
const AssociateListCard = ({ data }: { data: any }) => (
    <Card className={cn(dashboardCard, "overflow-hidden p-0")}>
        <a
            href={data.reports.latestCollectionReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("flex min-h-[60px] items-center gap-3 px-4 py-3", rowFocus)}
        >
            <span className={cn(rowIcon, "bg-[#F2F2F5]")}>
                <FileText className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold leading-tight">Relación de Cobro</span>
                <span className="block text-xs text-muted-foreground">Descarga el resumen de tus movimientos</span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-1 text-[13px] font-bold text-[#9E2F4B]">
                Descargar
                <Download className="h-4 w-4" />
            </span>
        </a>
        <div className="ml-16 h-px bg-[#F0F0F3]" />
        <Collapsible>
            <CollapsibleTrigger
                className={cn("group flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left", rowFocus)}
                data-testid="associate-info-toggle"
            >
                <span className={cn(rowIcon, "bg-[#FCEFF2] text-[#8E2A43]")}>
                    <User className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-tight">Datos de la Asociada</span>
                    <span className="block truncate text-xs text-muted-foreground">{data.associateInfo.name}</span>
                </span>
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent
                className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
                data-testid="associate-info-details"
            >
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 pb-4 pl-16 text-xs">
                    <InfoItem label="No. Asociada" value={data.associateInfo.associateNumber} />
                    <InfoItem label="Sucursal" value={data.associateInfo.branch} />
                    <InfoItem label="Fecha de Alta" value={new Date(data.associateInfo.activationDate).toLocaleDateString('es-MX', { timeZone: 'UTC' })} />
                    <InfoItem label="Colocación Promedio" value={formatCurrency(data.associateInfo.monthlyPlacementAvg)} />
                </div>
            </CollapsibleContent>
        </Collapsible>
    </Card>
);

// La API manda el nivel como "Nivel Senior"; la pastilla dice "Nivel Senior" o "Nivel Junior".
const levelLabel = (name?: string) => name?.replace(/^nivel\s+/i, '').trim() || null;

export const DistributorDashboardSkeleton = () => (
    <div className="container mx-auto p-2 md:p-3 pb-20 md:pb-8">
        <div className="animate-pulse">
            <div className="mb-4 flex items-end justify-between">
                <div>
                    <div className="mb-1.5 h-4 w-40 rounded bg-muted"></div>
                    <div className="h-7 w-28 rounded bg-muted"></div>
                </div>
                <div className="h-7 w-24 rounded-full bg-muted"></div>
            </div>
            <div className="flex flex-col gap-3.5">
                <div className="h-[250px] rounded-[20px] bg-muted"></div>
                <div className="h-[170px] rounded-[20px] bg-muted"></div>
                <div className="h-[120px] rounded-[20px] bg-muted"></div>
            </div>
        </div>
    </div>
);

export default function DistributorDashboard({
    distributorData,
    phoneState = null,
    issuancePause = null,
}: {
    distributorData: any;
    phoneState?: PhoneState | null;
    issuancePause?: IssuancePause | null;
}) {
    const getFirstName = (fullName: string) => {
        if (!fullName) return '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    };

    const firstName = getFirstName(distributorData.associateInfo.name);
    const level = levelLabel(distributorData.associateLevel?.name);

    return (
        <div className="flex flex-col">
            <main className="flex-grow container mx-auto p-2 md:p-3 md:pb-8">
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">Qué bueno verte de nuevo,</p>
                        <h1 className="truncate font-headline text-2xl font-semibold tracking-tight">{firstName}</h1>
                    </div>
                    {level && (
                        <span
                            className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[#FCEFF2] px-3 py-1.5 text-xs font-bold text-[#8E2A43]"
                            data-testid="associate-level"
                        >
                            <Star className="h-[13px] w-[13px]" aria-hidden="true" />
                            Nivel {level}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-3.5">
                    {issuancePause && (
                        <Alert variant="destructive" data-testid="issuance-paused">
                            <Ban className="h-4 w-4" />
                            <AlertTitle>{issuancePause.title}</AlertTitle>
                            <AlertDescription>{issuancePause.message}</AlertDescription>
                        </Alert>
                    )}
                    <LineDataCard data={distributorData} issuancePause={issuancePause} />
                    <CurrentStatusCard data={distributorData} phoneState={phoneState} />
                    <PhoneTrackerCard phoneState={phoneState} />
                    <AssociateListCard data={distributorData} />
                </div>
            </main>
        </div>
    );
}
