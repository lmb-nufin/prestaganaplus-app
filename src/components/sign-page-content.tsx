import { FileText, List, Home } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

import type { IssuanceMode, Vale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubPageHeader } from '@/components/sub-page-header';
import { AppShell } from '@/components/app-shell';
import { formatCurrency, parseDateOnly } from '@/lib/utils';
import { DigitalVale } from '@/components/digital-vale';
import { PersonalBadge } from '@/components/personal-badge';
import { Badge } from './ui/badge';
import { SignActions } from './sign-actions';

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

export function SignPageContent({ vale, associateName, creditLine, issuance }: { vale: Vale, associateName: string, creditLine?: { placed: number, limit: number, available: number }, issuance: IssuanceMode }) {
    const isPersonal = vale.tipoVale === 'PERSONAL';
    // El préstamo personal no sale de la línea de crédito.
    const canBeSigned = isPersonal || !creditLine || vale.loanAmount <= creditLine.available;
    const canBeCancelled = vale.status === 'PENDIENTE' || vale.status === 'FIRMADO';
    const isSignedOrRedeemed = vale.status === 'FIRMADO' || vale.status === 'CANJEADO';

  return (
    <AppShell header={<SubPageHeader title="Detalle del vale" backLabel="Volver a Vales" backHref="/vales" />}>
      <div className="container mx-auto max-w-md py-4 px-2">
        <Card className="shadow-lg">
          <CardHeader className="p-4">
            <div className="flex items-start gap-3">
              <FileText className={`h-6 w-6 flex-shrink-0 mt-0.5 ${isPersonal ? 'text-indigo-600' : 'text-primary'}`} />
              <div>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  {isPersonal ? 'Préstamo Personal' : 'Detalles de Vale'}
                  {isPersonal && <PersonalBadge />}
                </CardTitle>
                <CardDescription className="text-xs">Folio: {vale.folio}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2 mb-4">
                <InfoRow label={isPersonal ? 'Asociada' : 'Cliente'} value={`${vale.firstName} ${vale.lastNameP} ${vale.lastNameM}`} />
                <InfoRow label="Fecha de Nacimiento" value={format(parseDateOnly(vale.birthDate), "d 'de' MMMM, yyyy", { locale: es })} />
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
            <CardFooter className={issuance.mode === 'LIBRE' ? 'p-0 border-t bg-muted/30 flex-col' : 'p-4 border-t bg-muted/30 flex-col'}>
                <SignActions
                  vale={vale}
                  canBeSigned={canBeSigned}
                  canBeCancelled={canBeCancelled}
                  available={creditLine?.available ?? 0}
                  issuance={issuance}
                />
            </CardFooter>
          )}

        </Card>

        {/* Ya firmado: siguiente paso claro en lugar de quedarse en la pantalla de firma. */}
        {isSignedOrRedeemed && (
          <div className="mt-4 grid grid-cols-2 gap-2" data-testid="sign-next-actions">
            <Button variant="outline" asChild>
              <Link href="/vales"><List />Mis vales</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/"><Home />Inicio</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
