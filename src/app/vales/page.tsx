import ValesDashboard from '@/components/vales-dashboard';
import Header from '@/components/header';
import BottomNavBar from '@/components/bottom-nav-bar';
import { Suspense } from 'react';
import { ValesDashboardSkeleton } from './loading';

export default async function ValesPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  return (
    <>
      <Header />
      <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
         <Suspense fallback={<ValesDashboardSkeleton />}>
            <ValesDashboard notice={aviso} />
         </Suspense>
      </main>
      <BottomNavBar />
    </>
  );
}
