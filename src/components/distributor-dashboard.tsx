
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { CircleDollarSign, Download, Wallet } from "lucide-react";
import { Progress } from "./ui/progress";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { PaymentOptionsDialog } from "./payment-options-dialog";
import Link from "next/link";
import { AlertTriangle, PlusCircle } from "lucide-react";
import type { PhoneCollection, PhoneState } from "@/lib/types";
import { PhoneTrackerCard } from "./phone-tracker";


const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
    <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
    </div>
);

const moraStyles = {
    AVISO: { box: 'border-amber-300 bg-amber-50 text-amber-900', title: 'Pago del equipo pendiente' },
    GRACIA: { box: 'border-orange-400 bg-orange-50 text-orange-900', title: 'Tu equipo está en periodo de gracia' },
    BLOQUEO: { box: 'border-destructive/40 bg-destructive/10 text-destructive', title: 'Pago del equipo vencido' },
} as const;

const CurrentStatusCard = ({ data, phoneState }: { data: any; phoneState: PhoneState | null }) => {
    const isLate = data.paymentStatus.status === 'Atrasada';
    const statusColor = isLate ? 'text-destructive' : 'text-accent';
    const bgColor = isLate ? 'bg-destructive/10' : 'bg-accent/10';
    const borderColor = isLate ? 'border-destructive/20' : 'border-accent/20';

    // Desglose: amountDue incluye la cuota del teléfono y, si hay, su mora.
    const phone: PhoneCollection | undefined = data.telefono;
    const mora = phoneState?.mora;
    const phoneDue = phone ? phone.pagoQuincenal + (mora?.monto ?? 0) : 0;
    const valesDue = Math.max(data.paymentStatus.amountDue - phoneDue, 0);

    return (
        <Card className={`shadow-sm ${bgColor} ${borderColor} flex flex-col`}>
            <CardHeader className="p-3 pb-2">
                <CardTitle className="font-headline text-sm font-bold flex items-center gap-2">
                    <CircleDollarSign className="h-5 w-5"/>
                    Situación Actual
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 pt-0 flex-grow">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Estatus</p>
                    <p className={`font-bold text-sm ${statusColor}`}>{data.paymentStatus.status}</p>
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
                            Debes {formatCurrency(mora.monto)} del equipo ({mora.dias} {mora.dias === 1 ? 'día' : 'días'} de atraso).
                            {mora.nivel === 'AVISO' && ' Págalo para evitar cargos y limitaciones.'}
                            {mora.nivel === 'GRACIA' && ' Ponte al corriente antes de que termine el periodo de gracia.'}
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

const LineDataCard = ({ data }: { data: any }) => {
    const disposedPercentage = (data.creditLine.placed / data.creditLine.limit) * 100;
    return (
        <Card className="shadow-md border border-primary">
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <CardTitle className="font-headline text-base">Línea PrestaGana</CardTitle>
                <Button size="sm" className="border-2 border-primary-foreground/50" asChild>
                    <Link href="/vales/nuevo">
                        <PlusCircle />
                        Vale Nuevo
                    </Link>
                </Button>
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

const DistributorInfoCard = ({ data }: { data: any }) => (
     <Card className="shadow-sm">
        <CardHeader className="p-3 pb-2">
             <CardTitle className="font-headline text-sm font-bold">
                Datos de la Asociada
             </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1 text-xs space-y-2">
            <p className="font-semibold text-base leading-tight">{data.associateInfo.name}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                <InfoItem label="No. Asociada" value={data.associateInfo.associateNumber} />
                <InfoItem label="Sucursal" value={data.associateInfo.branch} />
                <InfoItem label="Fecha de Alta" value={new Date(data.associateInfo.activationDate).toLocaleDateString('es-MX', { timeZone: 'UTC' })} />
                <InfoItem label="Colocación Promedio" value={formatCurrency(data.associateInfo.monthlyPlacementAvg)} />
            </div>
        </CardContent>
    </Card>
);

const ProfileCard = ({ data }: { data: any }) => (
     <Card className="shadow-sm flex flex-col justify-center">
        <CardHeader className="p-3 pb-2">
            <CardTitle className="font-headline text-sm font-bold text-center">
                Nivel
            </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex flex-col items-center justify-center space-y-1">
             <div className="relative w-16 h-16">
                <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full">
                    <circle cx="60" cy="60" r="54" stroke="hsl(var(--primary))" strokeWidth="4" fill="hsl(var(--card))" />
                </svg>
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <svg
                        className="w-12 h-12 text-primary"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2ZM9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7C15 8.65685 13.6569 10 12 10C10.3431 10 9 8.65685 9 7Z"
                        />
                        <path
                            d="M5.62062 14.0049C3.4934 14.5492 2 16.2736 2 18.5V19C2 19.5523 2.44772 20 3 20H21C21.5523 20 22 19.5523 22 19V18.5C22 16.2736 20.5066 14.5492 18.3794 14.0049C16.9234 15.6516 14.6127 16.75 12 16.75C9.38729 16.75 7.07663 15.6516 5.62062 14.0049Z"
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 16.75L15.09 19.25L14.25 15.5L17 13.25L13.24 12.9L12 9.5L10.76 12.9L7 13.25L9.75 15.5L8.91 19.25L12 16.75Z"
                            fill="hsl(var(--accent))"
                        />
                    </svg>
                </div>
            </div>
            <div className="text-center">
               
                <h3 className="font-headline text-base font-semibold mt-1">{data.associateLevel.name}</h3>
            </div>
        </CardContent>
    </Card>
);

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

export default function DistributorDashboard({ distributorData, phoneState = null }: { distributorData: any; phoneState?: PhoneState | null }) {
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
                    <LineDataCard data={distributorData} />
                    <CurrentStatusCard data={distributorData} phoneState={phoneState} />
                    <PhoneTrackerCard phoneState={phoneState} />
                    <CollectionReportCard data={distributorData} />
                    <DistributorInfoCard data={distributorData} />
                    <ProfileCard data={distributorData} />
                </div>
            </main>
        </div>
    );
}

    