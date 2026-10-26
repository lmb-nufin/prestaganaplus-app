import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getAssociateDashboard } from '@/lib/data';
import { getPhoneOfferOption } from '@/lib/phone';
import { PhoneOfferView } from '@/components/phone-offer';
import { SubPageHeader } from '@/components/sub-page-header';
import { AppShell } from '@/components/app-shell';
import { isPhoneEnabled } from '@/lib/features';

export default async function PhoneOfferPage() {
  const session = await auth();
  const associateNumber = session?.user?.associateNumber;
  if (!associateNumber) {
    redirect('/login');
  }
  if (!isPhoneEnabled()) {
    redirect('/vales/nuevo');
  }

  // Solo la UX: requestPhone vuelve a validar todo antes de crear la solicitud.
  const [option, dashboard] = await Promise.all([
    getPhoneOfferOption(associateNumber),
    getAssociateDashboard(associateNumber),
  ]);
  // El enganche se transfiere a la misma CLABE de la línea; el sistema lo registra solo.
  const stpClabe: string | undefined = dashboard?.paymentReferences?.stpClabe || undefined;

  return (
    <AppShell
      className="bg-indigo-50/40"
      header={<SubPageHeader title="Teléfono PrestaGana" backLabel="Volver a Préstamo Personal" backHref="/vales/nuevo?paso=personal" />}
    >
      <main className="w-full">
        <div className="mx-auto w-full max-w-md px-2 py-4">
          <PhoneOfferView option={option} stpClabe={stpClabe} />
        </div>
      </main>
    </AppShell>
  );
}
