import ValesDashboard from '@/components/vales-dashboard';
import Header from '@/components/header';
import BottomNavBar from '@/components/bottom-nav-bar';
import { AppShell } from '@/components/app-shell';
import { Suspense } from 'react';
import { ValesDashboardSkeleton } from './loading';
import { auth } from '@/lib/auth';
import { getIssuancePause } from '@/lib/phone';

export default async function ValesPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  const associateNumber = (await auth())?.user?.associateNumber;
  const issuancePause = associateNumber ? await getIssuancePause(associateNumber) : null;
  return (
    <AppShell header={<Header />} footer={<BottomNavBar issuancePause={issuancePause} />}>
      <main className="pb-8 md:pb-0">
         <Suspense fallback={<ValesDashboardSkeleton />}>
            <ValesDashboard notice={aviso} />
         </Suspense>
      </main>
    </AppShell>
  );
}
