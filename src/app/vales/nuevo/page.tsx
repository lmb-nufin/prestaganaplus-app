
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getPersonalLoanEligibility, PERSONAL_LOAN_AMOUNTS, PERSONAL_LOAN_INSTALLMENTS } from '@/lib/personal-loan';
import { getIssuanceMode, getPhoneOfferOption } from '@/lib/phone';
import { NewValeFlow } from '@/components/new-vale-flow';
import { DemoBridgeSlot } from '@/components/demo-bridge-slot';
import { getFeatures } from '@/lib/features';
import type { PersonalLoanEligibility, PersonalLoanOption, PhoneOfferOption } from '@/lib/types';

export default async function NewValePage() {
  const session = await auth();
  const associateNumber = session?.user?.associateNumber;
  if (!associateNumber) {
    redirect('/login');
  }

  // Con un interruptor apagado no se consulta esa función (ver src/lib/features.ts).
  const features = getFeatures();
  const personalOff: PersonalLoanEligibility = { eligible: false, reason: 'NO_DISPONIBLE', message: 'No disponible.' };
  const phoneOff: PhoneOfferOption = { available: false, reason: 'NO_DISPONIBLE', message: 'No disponible.' };
  const [eligibility, phoneOffer, issuance] = await Promise.all([
    features.personalLoan ? getPersonalLoanEligibility(associateNumber) : personalOff,
    features.phone ? getPhoneOfferOption(associateNumber) : phoneOff,
    getIssuanceMode(associateNumber),
  ]);

  // Los datos personales se quedan en el servidor; al cliente solo va el nombre para el diálogo.
  const personalLoan: PersonalLoanOption = eligibility.eligible
    ? {
        eligible: true,
        holderName: `${eligibility.cliente.firstName} ${eligibility.cliente.lastNameP} ${eligibility.cliente.lastNameM}`,
      }
    : { eligible: false, reason: eligibility.reason, folioActivo: eligibility.folioActivo ?? null };

  return (
    <>
    <DemoBridgeSlot />
    <NewValeFlow
      personalLoan={personalLoan}
      personalLoanAmounts={PERSONAL_LOAN_AMOUNTS}
      personalLoanInstallments={PERSONAL_LOAN_INSTALLMENTS}
      phoneOffer={phoneOffer}
      issuance={issuance}
      features={features}
    />
    </>
  );
}
