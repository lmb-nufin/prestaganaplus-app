
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { NewOrRenewedChoice } from '@/components/new-or-renewed-choice';
import { RenewClientCurpForm } from '@/components/renew-client-curp-form';
import { ValeCreationForm } from '@/components/vale-creation-form';
import type { ExistingClient } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Step = 'choice' | 'curp_input' | 'form';

export default function NewValePage() {
  const [step, setStep] = useState<Step>('choice');
  const [existingClientData, setExistingClientData] = useState<ExistingClient | null>(null);
  const router = useRouter();

  const handleChoice = (choice: 'new' | 'renewed') => {
    if (choice === 'new') {
      setExistingClientData(null);
      setStep('form');
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
      case 'choice':
      default:
        return 'Selecciona el tipo de cliente para el que generarás el vale.';
    }
  }


  const renderStep = () => {
    switch (step) {
      case 'choice':
        return <NewOrRenewedChoice onChoice={handleChoice} />;
      case 'curp_input':
        return <RenewClientCurpForm onCurpSuccess={handleCurpSuccess} onBack={handleBackToChoice} />;
      case 'form':
        return <ValeCreationForm onFormSuccess={handleFormSuccess} onBack={handleBackToChoice} existingClientData={existingClientData} />;
      default:
        return <NewOrRenewedChoice onChoice={handleChoice} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
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
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{getTitle()}</CardTitle>
                    <CardDescription className="text-xs">{getDescription()}</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderStep()}
                </CardContent>
            </Card>
         </div>
       </main>
    </div>
  );
}
