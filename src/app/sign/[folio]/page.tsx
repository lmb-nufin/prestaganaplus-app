
import { notFound } from 'next/navigation';
import { getValeByFolio } from '@/app/actions';
import { SignPageContent } from '@/components/sign-page-content';
import { auth } from '@/lib/auth';
import type { Vale } from '@/lib/types';
import { getAssociateDashboard } from '@/lib/data';
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

  return <SignPageContent vale={vale} associateName={associateName} creditLine={creditLine} />;
}
