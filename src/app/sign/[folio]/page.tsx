
import { notFound } from 'next/navigation';
import { getValeByFolio } from '@/app/actions';
import { SignPageContent } from '@/components/sign-page-content';
import { auth } from '@/lib/auth';
import type { IssuanceMode, Vale } from '@/lib/types';
import { getAssociateDashboard } from '@/lib/data';
import { getIssuanceMode } from '@/lib/phone';
import { DemoBridgeSlot } from '@/components/demo-bridge-slot';
import { redirect } from 'next/navigation';

export default async function SignPage({ params }: { params: { folio: string } }) {
  const vale = await getValeByFolio(params.folio);
  
  if (!vale) {
    redirect('/vales'); 
  }

  const session = await auth();
  const associateNumber = session?.user?.associateNumber;
  let creditLine;

  if (associateNumber) {
    // Fetch dashboard data to get credit line info
    const dashboardData = await getAssociateDashboard(associateNumber);
    creditLine = dashboardData?.creditLine;
  }
  
  const associateName = session?.user?.name ?? 'tu Asociada PrestaGana+';
  // Solo la UX: signValeWithOtp y cancelVale vuelven a validar la restricción en el servidor.
  const issuance: IssuanceMode = associateNumber
    ? await getIssuanceMode(associateNumber)
    : { mode: 'BLOQUEADA', message: 'No se pudo autenticar a la asociada.' };

  return (
    <>
      <DemoBridgeSlot />
      <SignPageContent vale={vale} associateName={associateName} creditLine={creditLine} issuance={issuance} />
    </>
  );
}
