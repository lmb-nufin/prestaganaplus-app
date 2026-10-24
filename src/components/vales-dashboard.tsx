
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FilePlus2, Store, Send, Check, Clock } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Vale } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { getVales } from '@/app/actions';
import { PlusCircle } from 'lucide-react';
import { PersonalBadge } from './personal-badge';


const InstructionStep = ({ icon, title, description }: { icon: React.ElementType, title: string, description: string }) => {
  const Icon = icon;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="font-headline font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

const ValeStatusBadge = ({ status }: { status: Vale['status'] }) => {
    const statusStyles = {
        PENDIENTE: 'bg-amber-100 text-amber-800 border-amber-200',
        FIRMADO: 'bg-accent/10 text-accent border-accent/20',
        CANJEADO: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return <Badge variant="outline" className={statusStyles[status]}>{status}</Badge>;
};


const ValesList = ({ vales: valesToList, noDataMessage }: { vales: Vale[], noDataMessage: string }) => (
<>
        {valesToList.length === 0 ? (
        <div className="text-center py-10 px-4">
            <p className="text-sm text-muted-foreground">{noDataMessage}</p>
        </div>
        ) : (
            <>
            {/* Mobile View - List of Cards */}
            <div className="md:hidden space-y-1.5 p-2">
                {valesToList.map((vale) => (
                <Link key={vale.folio} href={`/sign/${vale.folio}`} className="block transition-transform active:scale-[0.98]">
                    <Card className="bg-card shadow-sm hover:bg-muted/50">
                        <CardContent className="py-1.5 px-2">
                        <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[13px] font-bold leading-tight">{`${vale.firstName} ${vale.lastNameP} ${vale.lastNameM}`}</p>
                                    <span className="font-mono text-xs text-muted-foreground">{vale.folio}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {vale.tipoVale === 'PERSONAL' && <PersonalBadge />}
                                    <ValeStatusBadge status={vale.status} />
                                </div>
                        </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-bold text-primary">{formatCurrency(vale.loanAmount)}</span>
                                <p className="text-xs text-muted-foreground">
                                {format(new Date(vale.createdAt), "d MMM, yyyy", { locale: es })}
                            </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
            
            {/* Desktop View - Table */}
            <div className="hidden md:block w-full overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="font-headline">Folio</TableHead>
                    <TableHead className="font-headline">Cliente</TableHead>
                    <TableHead className="font-headline text-right">Monto</TableHead>
                    <TableHead className="font-headline">Estatus</TableHead>
                    <TableHead className="font-headline">Fecha</TableHead>
                    <TableHead className="text-right font-headline">Acción</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {valesToList.map((vale) => (
                    <TableRow key={vale.folio}>
                    <TableCell className="font-mono text-xs">{vale.folio}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {`${vale.firstName} ${vale.lastNameP} ${vale.lastNameM}`}
                            {vale.tipoVale === 'PERSONAL' && <PersonalBadge />}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(vale.loanAmount)}</TableCell>
                    <TableCell>
                        <ValeStatusBadge status={vale.status} />
                    </TableCell>
                    <TableCell>{format(new Date(vale.createdAt), "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                    <TableCell className="text-right">
                        <Link href={`/sign/${vale.folio}`} passHref>
                            <Button variant="outline" size="sm">
                            Ver Detalle
                            </Button>
                        </Link>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
        </>
        )}
</>
);


export default async function ValesDashboard() {
  const allVales = await getVales();
  
  // An active vale is one that is PENDING or SIGNED
  const activeVales = allVales.filter(v => v.status === 'PENDIENTE' || v.status === 'FIRMADO');
  
  // A redeemed vale is one that has been EXCHANGED
  const redeemedVales = allVales.filter(v => v.status === 'CANJEADO');
  
  return (
    <div className="flex flex-col">
       <header className="shadow-sm">
        <div className="container mx-auto flex h-12 items-center justify-between px-2 md:px-3">
            <h1 className="text-base font-bold font-headline">Vales</h1>
            <div className="hidden md:block">
                 <Button asChild>
                    <Link href="/vales/nuevo">
                        <PlusCircle />
                        Vale Nuevo
                    </Link>
                </Button>
            </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-2 md:p-3 pb-24 md:pb-8">
        <Card className="mb-3 shadow-sm">
          <CardHeader className="p-3">
            <CardTitle className="font-headline text-sm">¿Cómo funciona un vale digital?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
             <InstructionStep icon={FilePlus2} title="1. Llena y Firma" description="Ingresa los datos del cliente idénticos a su INE y completa la firma del vale como asociada." />
             <InstructionStep icon={Send} title="2. Envía al Cliente" description="Comparte el enlace del vale a tu cliente por WhatsApp o QR." />
             <InstructionStep icon={Store} title="3. Canjea en Sucursal" description="¡Listo! El cliente puede presentar el vale digital (QR) en sucursal para hacerlo válido." />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
           <CardHeader className="p-3">
            <CardTitle className="font-headline text-sm">Historial de Vales</CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-3 pt-0">
            <Tabs defaultValue="active">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 h-auto p-1">
                <TabsTrigger value="active" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    <Clock className="mr-2 h-4 w-4" />
                    Activos ({activeVales.length})
                </TabsTrigger>
                <TabsTrigger value="redeemed" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    <Check className="mr-2 h-4 w-4" />
                    Canjeados ({redeemedVales.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <ValesList vales={activeVales} noDataMessage="No tienes vales pendientes o firmados." />
              </TabsContent>
              <TabsContent value="redeemed">
                <ValesList vales={redeemedVales} noDataMessage="No tienes vales que ya hayan sido canjeados."/>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
