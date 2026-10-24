
import { Suspense } from 'react';
import DistributorDashboard, { DistributorDashboardSkeleton } from '@/components/distributor-dashboard';
import { getAssociateDashboard } from '@/lib/data';
import { getPersonalLoanEligibility } from '@/lib/personal-loan';
import { auth } from '@/lib/auth';
import type { PersonalLoanCardStatus } from '@/components/distributor-dashboard';

// Esta es ahora la página principal de la APLICACIÓN
export default async function AppPage() {
  const session = await auth();
  const associateNumber = session?.user?.associateNumber;

  const [distributorData, eligibility] = associateNumber
    ? await Promise.all([getAssociateDashboard(associateNumber), getPersonalLoanEligibility(associateNumber)])
    : [null, null];

  // Al cliente solo le pasamos el estado, no los datos personales.
  const personalLoan: PersonalLoanCardStatus = eligibility?.eligible
    ? { eligible: true }
    : {
        eligible: false,
        message: eligibility?.message ?? 'Servicio no disponible. Intenta más tarde.',
        folioActivo: eligibility?.folioActivo ?? null,
      };

  // Ya no se necesitan Header, main, o BottomNavBar aquí.
  // El layout de (app) los proporciona.
  return (
      <Suspense fallback={<DistributorDashboardSkeleton />}>
        {distributorData ? (
           <DistributorDashboard distributorData={distributorData} personalLoan={personalLoan} />
        ) : (
          <div className="container mx-auto p-4 text-center">
              <p>No se pudieron cargar los datos del dashboard.</p>
          </div>
        )}
      </Suspense>
  );
}
