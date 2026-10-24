
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getPersonalLoanEligibility, PERSONAL_LOAN_AMOUNTS, PERSONAL_LOAN_INSTALLMENTS } from '@/lib/personal-loan';
import { NewValeFlow } from '@/components/new-vale-flow';
import type { PersonalLoanOption } from '@/lib/types';

export default async function NewValePage() {
  const session = await auth();
  const associateNumber = session?.user?.associateNumber;
  if (!associateNumber) {
    redirect('/login');
  }

  const eligibility = await getPersonalLoanEligibility(associateNumber);

  // Los datos personales se quedan en el servidor; al cliente solo va el nombre para el diálogo.
  const personalLoan: PersonalLoanOption = eligibility.eligible
    ? {
        eligible: true,
        holderName: `${eligibility.cliente.firstName} ${eligibility.cliente.lastNameP} ${eligibility.cliente.lastNameM}`,
      }
    : { eligible: false, reason: eligibility.reason, folioActivo: eligibility.folioActivo ?? null };

  return (
    <NewValeFlow
      personalLoan={personalLoan}
      personalLoanAmounts={PERSONAL_LOAN_AMOUNTS}
      personalLoanInstallments={PERSONAL_LOAN_INSTALLMENTS}
    />
  );
}
