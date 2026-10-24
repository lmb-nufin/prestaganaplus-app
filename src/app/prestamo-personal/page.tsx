import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Ban, HandCoins } from 'lucide-react';

import { auth } from '@/lib/auth';
import { getPersonalLoanEligibility, PERSONAL_LOAN_AMOUNTS, PERSONAL_LOAN_INSTALLMENTS } from '@/lib/personal-loan';
import { parseDateOnly } from '@/lib/utils';
import { PersonalLoanForm } from '@/components/personal-loan-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const blockTitles = {
  ATRASADA: 'Tienes pagos pendientes',
  ANTIGUEDAD: 'Aún no cumples la antigüedad',
  ACTIVO: 'Ya tienes un préstamo activo',
  NO_DISPONIBLE: 'Servicio no disponible',
} as const;

const ReadOnlyRow = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="font-headline text-xs text-muted-foreground">{label}</p>
    <p className="rounded-md border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-sm font-medium">{value}</p>
  </div>
);

export default async function PersonalLoanPage() {
  const session = await auth();
  const associateNumber = session?.user?.associateNumber;
  if (!associateNumber) {
    redirect('/login');
  }

  const eligibility = await getPersonalLoanEligibility(associateNumber);

  return (
    <div className="flex flex-col min-h-screen bg-indigo-50/40">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Button variant="ghost" asChild size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-grow w-full">
        <div className="w-full max-w-md mx-auto py-4 px-2">
          <Card className="shadow-lg border-indigo-200">
            <CardHeader className="rounded-t-lg bg-indigo-600 text-white">
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <HandCoins className="h-5 w-5" />
                Préstamo Personal
              </CardTitle>
              <CardDescription className="text-xs text-indigo-100">
                Un préstamo a tu nombre que no usa tu línea de crédito.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {eligibility.eligible ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <ReadOnlyRow
                      label="Nombre"
                      value={`${eligibility.cliente.firstName} ${eligibility.cliente.lastNameP} ${eligibility.cliente.lastNameM}`}
                    />
                    <ReadOnlyRow
                      label="Fecha de Nacimiento"
                      value={format(parseDateOnly(eligibility.cliente.birthDate), "d 'de' MMMM, yyyy", { locale: es })}
                    />
                    <ReadOnlyRow label="Teléfono" value={eligibility.cliente.phone} />
                  </div>
                  <PersonalLoanForm amounts={PERSONAL_LOAN_AMOUNTS} installments={PERSONAL_LOAN_INSTALLMENTS} />
                </div>
              ) : (
                <Alert variant={eligibility.reason === 'ACTIVO' ? 'default' : 'destructive'}>
                  <Ban className="h-4 w-4" />
                  <AlertTitle className="font-headline">{blockTitles[eligibility.reason]}</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{eligibility.message}</p>
                    {eligibility.reason === 'ACTIVO' && eligibility.folioActivo && (
                      <Link href={`/sign/${eligibility.folioActivo}`} className="font-semibold text-indigo-700 underline">
                        Ver préstamo {eligibility.folioActivo}
                      </Link>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
