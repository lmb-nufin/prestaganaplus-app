import { ArrowLeft, FileText, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

import type { Vale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { formatCurrency } from '@/lib/utils';
import { DigitalVale } from '@/components/digital-vale';
import { Badge } from './ui/badge';
import { ValeSigningForm } from './vale-signing-form';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { ValeCancellationDialog } from './vale-cancellation-dialog';
import { Dialog, DialogTrigger } from './ui/dialog';

const InfoRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium text-right">{value}</span>
    </div>
);

const ValeStatusBadge = ({ status }: { status: Vale['status'] }) => {
    const statusStyles = {
        PENDIENTE: 'bg-amber-100 text-amber-800',
        FIRMADO: 'bg-accent text-accent-foreground',
        CANJEADO: 'bg-blue-600 text-white',
    };
    return <Badge className={statusStyles[status]}>{status}</Badge>;
};

export function SignPageContent({ vale, associateName, creditLine }: { vale: Vale, associateName: string, creditLine?: { placed: number, limit: number, available: number } }) {
    const canBeSigned = creditLine ? (vale.loanAmount <= creditLine.available ) : true;
    const canBeCancelled = vale.status === 'PENDIENTE' || vale.status === 'FIRMADO';
    const isSignedOrRedeemed = vale.status === 'FIRMADO' || vale.status === 'CANJEADO';

  return (
      <div className="container mx-auto max-w-md py-4 px-2">
        <div className="flex justify-between items-center mb-2">
          <Button variant="ghost" asChild size="sm">
            <Link href="/vales">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Vales
            </Link>
          </Button>
          <div className="md:hidden">
            <Logo />
          </div>
        </div>
        <Card className="shadow-lg">
          <CardHeader className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="font-headline text-lg">Detalles de Vale</CardTitle>
                <CardDescription className="text-xs">Folio: {vale.folio}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2 mb-4">
                <InfoRow label="Cliente" value={`${vale.firstName} ${vale.lastNameP} ${vale.lastNameM}`} />
                <InfoRow label="Fecha de Nacimiento" value={format(new Date(vale.birthDate), "d 'de' MMMM, yyyy", { locale: es })} />
                <InfoRow label="Monto" value={formatCurrency(vale.loanAmount)} />
                <InfoRow label="Quincenas" value={vale.installments} />
                <InfoRow label="Teléfono" value={vale.phone} />
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Estatus:</span>
                    <ValeStatusBadge status={vale.status} />
                </div>
              {isSignedOrRedeemed && vale.signedAt && (
                  <InfoRow label="Fecha de Emisión" value={format(new Date(vale.signedAt), "d MMM, yyyy HH:mm", { locale: es })} />
              )}
            </div>
             {isSignedOrRedeemed ? (
                <DigitalVale vale={vale} associateName={associateName} />
              ) : null}
          </CardContent>

          {vale.status !== 'CANJEADO' && (
            <CardFooter className="p-0 border-t bg-muted/30 flex-col">
                {vale.status === 'PENDIENTE' && (
                    <>
                        {canBeSigned ? (
                            <ValeSigningForm vale={vale} />
                        ) : (
                            <div className="p-4 w-full">
                                <Alert variant="destructive">
                                    <Ban className="h-4 w-4" />
                                    <AlertTitle className="font-headline">Crédito Insuficiente</AlertTitle>
                                    <AlertDescription>
                                        No puedes firmar este vale porque el monto excede tu línea de crédito disponible. Tu disponible es de {formatCurrency(creditLine?.available ?? 0)}.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </>
                )}

                {canBeCancelled && (
                     <div className="p-4 w-full border-t">
                       <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                              <Ban className="mr-2 h-4 w-4" />
                              Cancelar Vale
                            </Button>
                          </DialogTrigger>
                          <ValeCancellationDialog folio={vale.folio} />
                        </Dialog>
                    </div>
                )}
            </CardFooter>
          )}

        </Card>
      </div>
  );
}
