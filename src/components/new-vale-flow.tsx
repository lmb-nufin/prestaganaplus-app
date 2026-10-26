
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HandCoins } from 'lucide-react';

import { NewOrRenewedChoice } from '@/components/new-or-renewed-choice';
import { RenewClientCurpForm } from '@/components/renew-client-curp-form';
import { ValeCreationForm } from '@/components/vale-creation-form';
import { PersonalLoanForm } from '@/components/personal-loan-form';
import { PersonalLoanOptions } from '@/components/personal-loan-options';
import { DeviceGate } from '@/components/device-gate';
import { SubPageHeader } from '@/components/sub-page-header';
import { AppShell } from '@/components/app-shell';
import type { ExistingClient, IssuanceMode, PersonalLoanOption, PhoneOfferOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Step = 'choice' | 'curp_input' | 'form' | 'personal' | 'personal_cash';

// Cada paso vive en la URL (?paso=...) para que el botón de atrás del navegador o de Android
// regrese un paso en lugar de salir del asistente.
const STEP_PARAM: Record<Exclude<Step, 'choice'>, string> = {
  curp_input: 'curp',
  form: 'datos',
  personal: 'personal',
  personal_cash: 'efectivo',
};
const PARAM_STEP: Record<string, Step> = Object.fromEntries(
  Object.entries(STEP_PARAM).map(([step, param]) => [param, step as Step])
);
// A dónde regresa la flecha del header desde cada paso.
const PARENT_STEP: Record<Exclude<Step, 'choice'>, Step> = {
  curp_input: 'choice',
  form: 'choice',
  personal: 'choice',
  personal_cash: 'personal',
};

// Conserva los demás parámetros de la URL (p. ej. ?demoDevice=1 de la miniapp simulada).
const stepUrl = (step: Step) => {
  const params = new URLSearchParams(window.location.search);
  if (step === 'choice') params.delete('paso');
  else params.set('paso', STEP_PARAM[step]);
  const query = params.toString();
  return query ? `/vales/nuevo?${query}` : '/vales/nuevo';
};

type NewValeFlowProps = {
  personalLoan: PersonalLoanOption;
  personalLoanAmounts: number[];
  personalLoanInstallments: number[];
  phoneOffer: PhoneOfferOption;
  issuance: IssuanceMode;
  // Interruptores del servidor: una función apagada no se muestra.
  features?: { personalLoan: boolean; phone: boolean };
};

export function NewValeFlow({ personalLoan, personalLoanAmounts, personalLoanInstallments, phoneOffer, issuance, features = { personalLoan: true, phone: true } }: NewValeFlowProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [existingClientData, setExistingClientData] = useState<ExistingClient | null>(null);
  // El CURP buscado se conserva para que regresar a la búsqueda no obligue a escribirlo otra vez.
  const [lastCurp, setLastCurp] = useState('');
  // Pasos que este asistente agregó al historial; con ellos la flecha usa history.back().
  const pushedSteps = useRef(0);

  const personalAvailable = personalLoan.eligible || phoneOffer.available;
  let step: Step = PARAM_STEP[searchParams.get('paso') ?? ''] ?? 'choice';
  // Pasos que no se pueden mostrar sin lo anterior (p. ej. al recargar) regresan a donde sí se puede.
  if ((step === 'personal' || step === 'personal_cash') && !personalAvailable) step = 'choice';
  if (step === 'personal_cash' && !personalLoan.eligible) step = 'personal';

  useEffect(() => {
    const onPop = () => {
      pushedSteps.current = Math.max(0, pushedSteps.current - 1);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goTo = (next: Step) => {
    pushedSteps.current += 1;
    window.history.pushState(null, '', stepUrl(next));
  };

  const handleBack = () => {
    if (step === 'choice') {
      router.push('/vales');
      return;
    }
    if (pushedSteps.current > 0) {
      window.history.back();
      return;
    }
    // Se llegó directo a un paso (por ejemplo desde la pantalla del teléfono): sube al paso padre.
    const parent = step === 'form' && existingClientData ? 'curp_input' : PARENT_STEP[step];
    window.history.replaceState(null, '', stepUrl(parent));
  };

  const handleChoice = (choice: 'new' | 'renewed' | 'personal') => {
    if (choice === 'new') {
      setExistingClientData(null);
      goTo('form');
    } else if (choice === 'personal') {
      if (personalAvailable) goTo('personal');
    } else {
      goTo('curp_input');
    }
  };

  const handleCurpSuccess = (clientData: ExistingClient, curp: string) => {
    setExistingClientData(clientData);
    setLastCurp(curp);
    goTo('form');
  };

  const getTitle = () => {
    switch (step) {
      case 'form':
        return existingClientData ? 'Vale para Cliente Existente' : 'Vale para Cliente Nuevo';
      case 'curp_input':
        return 'Buscar Cliente por CURP';
      case 'personal':
      case 'personal_cash':
        return 'Préstamo Personal';
      case 'choice':
      default:
        return 'Crear Nuevo Vale';
    }
  };

  const getDescription = () => {
     switch (step) {
      case 'form':
        return 'Completa los datos para generar el vale.';
      case 'curp_input':
        return 'Ingresa el CURP del cliente para cargar sus datos.';
      case 'personal':
        return 'Elige efectivo o un equipo de trabajo. Ninguno usa tu línea de crédito.';
      case 'personal_cash':
        return 'Un préstamo a tu nombre que no usa tu línea de crédito.';
      case 'choice':
      default:
        return 'Selecciona el tipo de cliente para el que generarás el vale.';
    }
  }

  const renderPersonalOptions = () => (
    <PersonalLoanOptions
      personalLoan={personalLoan}
      phoneOffer={phoneOffer}
      features={features}
      onCash={() => personalLoan.eligible && goTo('personal_cash')}
    />
  );

  const renderPersonalCashStep = (deviceSignatureRequired: boolean) => {
    if (!personalLoan.eligible) return null;
    return (
      <PersonalLoanForm
        amounts={personalLoanAmounts}
        installments={personalLoanInstallments}
        holderName={personalLoan.holderName}
        deviceSignatureRequired={deviceSignatureRequired}
      />
    );
  };

  const renderStep = (deviceSignatureRequired: boolean) => {
    const choice = (
      <NewOrRenewedChoice
        onChoice={handleChoice}
        personalLoan={personalLoan}
        phoneOfferAvailable={phoneOffer.available}
        showPersonal={features.personalLoan || features.phone}
      />
    );
    switch (step) {
      case 'choice':
        return choice;
      case 'curp_input':
        return <RenewClientCurpForm onCurpSuccess={handleCurpSuccess} initialCurp={lastCurp} />;
      case 'form':
        return (
          <ValeCreationForm
            existingClientData={existingClientData}
            deviceSignatureRequired={deviceSignatureRequired}
          />
        );
      case 'personal':
        return renderPersonalOptions();
      case 'personal_cash':
        return renderPersonalCashStep(deviceSignatureRequired);
      default:
        return choice;
    }
  };

  const isPersonalStep = step === 'personal' || step === 'personal_cash';

  return (
    <AppShell
       className={isPersonalStep ? 'bg-indigo-50/40' : 'bg-muted/30'}
       header={
         <SubPageHeader
           title="Vale Nuevo"
           backLabel={step === 'choice' ? 'Volver a Vales' : 'Regresar al paso anterior'}
           onBack={handleBack}
         />
       }
    >
       <main className="w-full">
         <div className="w-full max-w-md mx-auto py-4 px-2">
             <Card className={cn('shadow-lg', isPersonalStep && 'border-indigo-200')}>
                <CardHeader className={cn(isPersonalStep && 'rounded-t-lg bg-indigo-600 text-white')}>
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                      {isPersonalStep && <HandCoins className="h-5 w-5" />}
                      {getTitle()}
                    </CardTitle>
                    <CardDescription className={cn('text-xs', isPersonalStep && 'text-indigo-100')}>{getDescription()}</CardDescription>
                </CardHeader>
                <CardContent className={cn(isPersonalStep && 'pt-6')}>
                    {/* Con emisión restringida, fuera de la miniapp solo se ve el aviso (sin formulario). */}
                    <DeviceGate issuance={issuance}>{renderStep}</DeviceGate>
                </CardContent>
            </Card>
         </div>
       </main>
    </AppShell>
  );
}
