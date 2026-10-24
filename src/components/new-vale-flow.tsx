
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HandCoins } from 'lucide-react';
import Link from 'next/link';

import { NewOrRenewedChoice } from '@/components/new-or-renewed-choice';
import { RenewClientCurpForm } from '@/components/renew-client-curp-form';
import { ValeCreationForm } from '@/components/vale-creation-form';
import { PersonalLoanForm } from '@/components/personal-loan-form';
import { PersonalLoanOptions } from '@/components/personal-loan-options';
import { DeviceGate } from '@/components/device-gate';
import type { ExistingClient, IssuanceMode, PersonalLoanOption, PhoneOfferOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Step = 'choice' | 'curp_input' | 'form' | 'personal' | 'personal_cash';

type NewValeFlowProps = {
  personalLoan: PersonalLoanOption;
  personalLoanAmounts: number[];
  personalLoanInstallments: number[];
  phoneOffer: PhoneOfferOption;
  issuance: IssuanceMode;
};

export function NewValeFlow({ personalLoan, personalLoanAmounts, personalLoanInstallments, phoneOffer, issuance }: NewValeFlowProps) {
  const [step, setStep] = useState<Step>('choice');
  const [existingClientData, setExistingClientData] = useState<ExistingClient | null>(null);
  const router = useRouter();

  const handleChoice = (choice: 'new' | 'renewed' | 'personal') => {
    if (choice === 'new') {
      setExistingClientData(null);
      setStep('form');
    } else if (choice === 'personal') {
      if (personalLoan.eligible || phoneOffer.available) setStep('personal');
    } else {
      setStep('curp_input');
    }
  };

  const handleCurpSuccess = (clientData: ExistingClient) => {
    setExistingClientData(clientData);
    setStep('form');
  };

  const handleFormSuccess = () => {
    router.push('/vales');
  };

  const handleBackToChoice = () => {
    setStep('choice');
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
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={handleBackToChoice} className="text-muted-foreground -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>
      <PersonalLoanOptions
        personalLoan={personalLoan}
        phoneOffer={phoneOffer}
        onCash={() => personalLoan.eligible && setStep('personal_cash')}
      />
    </div>
  );

  const renderPersonalCashStep = (deviceSignatureRequired: boolean) => {
    if (!personalLoan.eligible) return null;
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setStep('personal')} className="text-muted-foreground -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <PersonalLoanForm
          amounts={personalLoanAmounts}
          installments={personalLoanInstallments}
          holderName={personalLoan.holderName}
          deviceSignatureRequired={deviceSignatureRequired}
        />
      </div>
    );
  };

  const renderStep = (deviceSignatureRequired: boolean) => {
    const choice = (
      <NewOrRenewedChoice onChoice={handleChoice} personalLoan={personalLoan} phoneOfferAvailable={phoneOffer.available} />
    );
    switch (step) {
      case 'choice':
        return choice;
      case 'curp_input':
        return <RenewClientCurpForm onCurpSuccess={handleCurpSuccess} onBack={handleBackToChoice} />;
      case 'form':
        return (
          <ValeCreationForm
            onFormSuccess={handleFormSuccess}
            onBack={handleBackToChoice}
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
    <div className={cn('flex flex-col min-h-screen', isPersonalStep ? 'bg-indigo-50/40' : 'bg-muted/30')}>
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4">
                 <Button variant="ghost" asChild size="sm">
                    <Link href="/vales">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Vales
                    </Link>
                </Button>
            </div>
       </header>
       <main className="flex-grow w-full">
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
    </div>
  );
}
