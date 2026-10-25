import ValesDashboard from '@/components/vales-dashboard';
import Header from '@/components/header';
import BottomNavBar from '@/components/bottom-nav-bar';
import { Suspense } from 'react';
import { ValesDashboardSkeleton } from './loading';
import { auth } from '@/lib/auth';
import { getIssuancePause } from '@/lib/phone';

export default async function ValesPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  const associateNumber = (await auth())?.user?.associateNumber;
  const issuancePause = associateNumber ? await getIssuancePause(associateNumber) : null;
  return (
    <>
      <Header />
      <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
         <Suspense fallback={<ValesDashboardSkeleton />}>
            <ValesDashboard notice={aviso} />
         </Suspense>
      </main>
      <BottomNavBar issuancePause={issuancePause} />
    </>
  );
}
