'use client';

import { CheckCircle2, PartyPopper } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

export function RegisterSuccess() {
  return (
    <div className="p-6 text-center space-y-4 flex flex-col items-center">
        <div className="p-3 bg-green-100 rounded-full inline-block">
            <PartyPopper className="h-10 w-10 text-green-600" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-1">
            <h2 className="text-xl font-headline font-semibold">¡Registro Completado!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Tu cuenta ha sido creada y este dispositivo ha sido registrado como confiable.
            </p>
        </div>

        <div className="pt-4 w-full">
            <Button asChild className="w-full">
                <Link href="/">
                    <CheckCircle2 />
                    Ir al Inicio
                </Link>
            </Button>
        </div>
    </div>
  );
}
