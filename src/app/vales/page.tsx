import ValesDashboard from '@/components/vales-dashboard';
import Header from '@/components/header';
import BottomNavBar from '@/components/bottom-nav-bar';
import { Suspense } from 'react';
import ValesDashboardSkeleton from './loading';

export default function ValesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
         <Suspense fallback={<ValesDashboardSkeleton />}>
            <ValesDashboard />
         </Suspense>
      </main>
      <BottomNavBar />
    </>
  );
}
