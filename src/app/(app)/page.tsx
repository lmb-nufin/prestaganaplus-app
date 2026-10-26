
import { Suspense } from 'react';
import DistributorDashboard, { DistributorDashboardSkeleton } from '@/components/distributor-dashboard';
import { getAssociateDashboard, getPhoneState } from '@/lib/data';
import { DemoBridgeSlot } from '@/components/demo-bridge-slot';
import { auth } from '@/lib/auth';
import { issuancePauseFor } from '@/lib/phone';
import { isPhoneEnabled } from '@/lib/features';

// Esta es ahora la página principal de la APLICACIÓN
export default async function AppPage() {
  const session = await auth();
  const associateNumber = session?.user?.associateNumber;
  
  const [dashboard, phoneState] = associateNumber
    ? await Promise.all([getAssociateDashboard(associateNumber), getPhoneState(associateNumber)])
    : [null, null];
  // Con el Teléfono apagado no se muestra el desglose de su cuota aunque la API la mande.
  const distributorData = dashboard && !isPhoneEnabled() ? { ...dashboard, telefono: undefined } : dashboard;

  // Ya no se necesitan Header, main, o BottomNavBar aquí.
  // El layout de (app) los proporciona.
  return (
    <>
      <DemoBridgeSlot />
      <Suspense fallback={<DistributorDashboardSkeleton />}>
        {distributorData ? (
           <DistributorDashboard
             distributorData={distributorData}
             phoneState={phoneState}
             issuancePause={issuancePauseFor(phoneState)}
           />
        ) : (
          <div className="container mx-auto p-4 text-center">
              <p>No se pudieron cargar los datos del dashboard.</p>
          </div>
        )}
      </Suspense>
    </>
  );
}
