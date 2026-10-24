
import { Suspense } from 'react';
import DistributorDashboard, { DistributorDashboardSkeleton } from '@/components/distributor-dashboard';
import { getAssociateDashboard } from '@/lib/data';
import { auth } from '@/lib/auth';

// Esta es ahora la página principal de la APLICACIÓN
export default async function AppPage() {
  const session = await auth();
  const associateNumber = session?.user?.associateNumber;
  
  const distributorData = associateNumber 
    ? await getAssociateDashboard(associateNumber) 
    : null;

  // Ya no se necesitan Header, main, o BottomNavBar aquí.
  // El layout de (app) los proporciona.
  return (
      <Suspense fallback={<DistributorDashboardSkeleton />}>
        {distributorData ? (
           <DistributorDashboard distributorData={distributorData} />
        ) : (
          <div className="container mx-auto p-4 text-center">
              <p>No se pudieron cargar los datos del dashboard.</p>
          </div>
        )}
      </Suspense>
  );
}
