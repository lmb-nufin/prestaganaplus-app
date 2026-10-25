
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { badgeVariants } from "./ui/badge";
import { Ban, ChevronDown, CircleDollarSign, Download, Wallet } from "lucide-react";
import { Progress } from "./ui/progress";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { PaymentOptionsDialog } from "./payment-options-dialog";
import Link from "next/link";
import { AlertTriangle, PlusCircle } from "lucide-react";
import type { IssuancePause, PhoneCollection, PhoneState } from "@/lib/types";
import { PhoneTrackerCard } from "./phone-tracker";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useToast } from "@/hooks/use-toast";


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
    ok: { text: 'text-accent', card: 'bg-accent/10 border-accent/20' },
    warning: { text: 'text-amber-600', card: 'bg-amber-50 border-amber-200' },
    late: { text: 'text-destructive', card: 'bg-destructive/10 border-destructive/20' },
} as const;

const CurrentStatusCard = ({ data, phoneState }: { data: any; phoneState: PhoneState | null }) => {
    const mora = phoneState?.mora;
    // Con mora nunca se muestra "Al Día": AVISO es un pago vencido (ámbar); gracia o bloqueo, atrasada (rojo).
    const isLate = data.paymentStatus.status === 'Atrasada' || mora?.nivel === 'GRACIA' || mora?.nivel === 'BLOQUEO';
    const tone = isLate ? 'late' : mora ? 'warning' : 'ok';
    const statusLabel = isLate ? 'Atrasada' : mora ? 'Pago vencido' : data.paymentStatus.status;
    const statusColor = statusStyles[tone].text;

    // Desglose: amountDue incluye la cuota del teléfono y, si hay, su mora.
    const phone: PhoneCollection | undefined = data.telefono;
    const phoneDue = phone ? phone.pagoQuincenal + (mora?.monto ?? 0) : 0;
    const valesDue = Math.max(data.paymentStatus.amountDue - phoneDue, 0);

    return (
        <Card className={`shadow-sm ${statusStyles[tone].card} flex flex-col`}>
            <CardHeader className="p-3 pb-2">
                <CardTitle className="font-headline text-sm font-bold flex items-center gap-2">
                    <CircleDollarSign className="h-5 w-5"/>
                    Situación Actual
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 pt-0 flex-grow">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Estatus</p>
                    <p className={`font-bold text-sm ${statusColor}`} data-testid="payment-status">{statusLabel}</p>
                </div>
                 <div className="text-center">
                    <p className="text-xs text-muted-foreground">Monto a Pagar</p>
                    <p className={`font-bold text-sm ${statusColor}`}>{formatCurrency(data.paymentStatus.amountDue)}</p>
                </div>
                {phone && (
                    <div className="col-span-2 mt-2 space-y-1 rounded-md bg-background/70 p-2 text-xs" data-testid="collection-breakdown">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Vales</span>
                            <span className="font-semibold">{formatCurrency(valesDue)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">
                                Teléfono · cuota {phone.cuotaActual} de {phone.totalCuotas}
                            </span>
                            <span className="font-semibold">{formatCurrency(phoneDue)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Saldo del equipo</span>
                            <span>{formatCurrency(phone.saldo)}</span>
                        </div>
                    </div>
                )}
                {mora && (
                    <div
                        className={cn('col-span-2 mt-2 rounded-md border p-2 text-xs', moraStyles[mora.nivel].box)}
                        data-testid={`phone-mora-${mora.nivel}`}
                    >
                        <p className="flex items-center gap-1.5 font-semibold">
                            <AlertTriangle className="h-4 w-4" />
                            {moraStyles[mora.nivel].title}
                        </p>
                        <p className="mt-0.5">
                            Tienes un pago vencido de {formatCurrency(mora.monto)} ({mora.dias} {mora.dias === 1 ? 'día' : 'días'}). {moraStyles[mora.nivel].next}
                        </p>
                        <div className="mt-2">
                            <PaymentOptionsDialog paymentReferences={data.paymentReferences} />
                        </div>
                    </div>
                )}
            </CardContent>
            {/* Con mora, el botón de pago vive en el aviso; no se repite abajo. */}
            {!mora && (
                <CardFooter className="p-2 bg-transparent mt-auto border-t">
                    <PaymentOptionsDialog paymentReferences={data.paymentReferences} />
                </CardFooter>
            )}
        </Card>
    );
}

const LineDataCard = ({ data, issuancePause }: { data: any; issuancePause: IssuancePause | null }) => {
    const { toast } = useToast();
    const disposedPercentage = (data.creditLine.placed / data.creditLine.limit) * 100;
    return (
        <Card className="shadow-md border border-primary">
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <CardTitle className="font-headline text-base">Línea PrestaGana</CardTitle>
                {issuancePause ? (
                    // Emisión en pausa: se ve gris, no navega y explica por qué.
                    <Button
                        size="sm"
                        type="button"
                        aria-disabled="true"
                        data-testid="line-new-vale-paused"
                        className="border-2 border-muted bg-muted text-muted-foreground shadow-none hover:bg-muted"
                        onClick={() => toast({ title: issuancePause.title, description: issuancePause.message })}
                    >
                        <PlusCircle />
                        Vale Nuevo
                    </Button>
                ) : (
                    <Button size="sm" className="border-2 border-primary-foreground/50" asChild>
                        <Link href="/vales/nuevo">
                            <PlusCircle />
                            Vale Nuevo
                        </Link>
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="space-y-1">
                    <div>
                        <p className="text-xs text-muted-foreground">Colocado</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(data.creditLine.placed)}</p>
                    </div>
                    <Progress 
                        value={disposedPercentage} 
                        className="h-2"
                        indicatorClassName="bg-primary" 
                    />
                    <div className="space-y-1 pt-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Disponible</span>
                            <span className={cn(
                                "font-semibold",
                                data.creditLine.available < 3000 && "text-destructive"
                            )}>
                                {formatCurrency(data.creditLine.available)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Límite de crédito</span>
                            <span className="font-semibold">{formatCurrency(data.creditLine.limit)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
};

const CollectionReportCard = ({ data }: { data: any }) => (
    <Card className="shadow-sm flex flex-col">
        <CardHeader className="p-3 pb-2">
            <CardTitle className="font-headline text-sm font-bold">
                Relación de Cobro
            </CardTitle>
            <CardDescription className="text-xs">
                Descarga el resumen de tus movimientos.
            </CardDescription>
        </CardHeader>
        <CardFooter className="p-2 bg-transparent mt-auto border-t">
             <Button className="w-full" size="sm" variant="secondary" asChild>
                <a href={data.reports.latestCollectionReportUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2" />
                    Descarga tu Última Relación
                </a>
            </Button>
        </CardFooter>
    </Card>
);

// La API manda el nivel como "Nivel Senior"; el badge solo muestra "Senior" o "Junior".
const levelLabel = (name?: string) => name?.replace(/^nivel\s+/i, '').trim() || null;

// Colapsada por default: título, nivel y nombre; al tocarla muestra el resto de los datos.
const DistributorInfoCard = ({ data }: { data: any }) => {
    const level = levelLabel(data.associateLevel?.name);
    return (
    <Card className="shadow-sm">
        <Collapsible>
            <CollapsibleTrigger
                className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="associate-info-toggle"
            >
                <span className="space-y-2">
                    <span className="flex items-center gap-2">
                        <span className="font-headline text-sm font-bold">Datos de la Asociada</span>
                        {level && (
                            <span className={badgeVariants({ variant: 'secondary' })} data-testid="associate-level">
                                {level}
                            </span>
                        )}
                    </span>
                    <span className="block font-semibold text-base leading-tight">{data.associateInfo.name}</span>
                </span>
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent
                className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
                data-testid="associate-info-details"
            >
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 pt-0 text-xs">
                    <InfoItem label="No. Asociada" value={data.associateInfo.associateNumber} />
                    <InfoItem label="Sucursal" value={data.associateInfo.branch} />
                    <InfoItem label="Fecha de Alta" value={new Date(data.associateInfo.activationDate).toLocaleDateString('es-MX', { timeZone: 'UTC' })} />
                    <InfoItem label="Colocación Promedio" value={formatCurrency(data.associateInfo.monthlyPlacementAvg)} />
                </div>
            </CollapsibleContent>
        </Collapsible>
    </Card>
    );
};

export const DistributorDashboardSkeleton = () => (
    <div className="container mx-auto p-2 md:p-3 pb-20 md:pb-8">
        <div className="animate-pulse">
            <div className="h-7 w-48 bg-muted rounded mb-1"></div>
            <div className="h-5 w-64 bg-muted rounded mb-4"></div>
            <div className="flex flex-col gap-3">
                <div className="h-48 bg-muted rounded-lg"></div>
                <div className="h-40 bg-muted rounded-lg"></div>
                <div className="h-28 bg-muted rounded-lg"></div>
                <div className="h-40 bg-muted rounded-lg"></div>
                <div className="h-40 bg-muted rounded-lg"></div>
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

    return (
        <div className="flex flex-col">
            <main className="flex-grow container mx-auto p-2 md:p-3 md:pb-8">
                <div className="mb-4">
                    <h1 className="text-xl font-bold font-headline text-foreground/90">Hola, {firstName}</h1>
                    <p className="text-sm text-muted-foreground">Qué bueno verte de nuevo.</p>
                </div>
                <div className="flex flex-col gap-3">
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
                    <CollectionReportCard data={distributorData} />
                    <DistributorInfoCard data={distributorData} />
                </div>
            </main>
        </div>
    );
}

    