import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getAssociateDashboard } from '@/lib/data';
import { getPhoneOfferOption } from '@/lib/phone';
import { PhoneOfferView } from '@/components/phone-offer';
import { SubPageHeader } from '@/components/sub-page-header';

export default async function PhoneOfferPage() {
  const session = await auth();
  const associateNumber = session?.user?.associateNumber;
  if (!associateNumber) {
    redirect('/login');
  }

  // Solo la UX: requestPhone vuelve a validar todo antes de crear la solicitud.
  const [option, dashboard] = await Promise.all([
    getPhoneOfferOption(associateNumber),
    getAssociateDashboard(associateNumber),
  ]);
  // El enganche se transfiere a la misma CLABE de la línea; el sistema lo registra solo.
  const stpClabe: string | undefined = dashboard?.paymentReferences?.stpClabe || undefined;

  return (
    <div className="flex min-h-screen flex-col bg-indigo-50/40">
      <SubPageHeader title="Teléfono PrestaGana" backLabel="Volver a Préstamo Personal" backHref="/vales/nuevo?paso=personal" />
      <main className="w-full flex-grow">
        <div className="mx-auto w-full max-w-md px-2 py-4">
          <PhoneOfferView option={option} stpClabe={stpClabe} />
        </div>
      </main>
    </div>
  );
}
