
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { UserPlus, UserCog, HandCoins } from 'lucide-react';
import type { PersonalLoanBlockReason, PersonalLoanOption } from '@/lib/types';

interface NewOrRenewedChoiceProps {
  onChoice: (choice: 'new' | 'renewed' | 'personal') => void;
  personalLoan: PersonalLoanOption;
  // La opción se abre si hay efectivo o teléfono disponible.
  phoneOfferAvailable?: boolean;
}

const blockLabels: Record<PersonalLoanBlockReason, string> = {
  ATRASADA: 'Necesitas estar al día',
  ANTIGUEDAD: 'Disponible al cumplir 3 meses',
  ACTIVO: 'Ya tienes un préstamo activo',
  NO_DISPONIBLE: 'Servicio no disponible',
};

export function NewOrRenewedChoice({ onChoice, personalLoan, phoneOfferAvailable = false }: NewOrRenewedChoiceProps) {
  const personalEnabled = personalLoan.eligible || phoneOfferAvailable;
  return (
    <div className="p-4 space-y-3">
      <Button
        variant="outline"
        className="w-full h-auto min-h-20 flex items-center justify-start p-4 whitespace-normal"
        onClick={() => onChoice('new')}
      >
        <div className="flex items-center gap-3 w-full">
          <UserPlus className="h-6 w-6 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-semibold">Cliente Nuevo</h3>
            <p className="text-xs text-muted-foreground">
              Crear vale para cliente nuevo
            </p>
          </div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="w-full h-auto min-h-20 flex items-center justify-start p-4 whitespace-normal"
        onClick={() => onChoice('renewed')}
      >
        <div className="flex items-center gap-3 w-full">
          <UserCog className="h-6 w-6 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-semibold">Cliente Existente</h3>
            <p className="text-xs text-muted-foreground">
              Buscar un cliente existente por su CURP.
            </p>
          </div>
        </div>
      </Button>
      <div className="space-y-1">
        <Button
          variant="outline"
          className="w-full h-auto min-h-20 flex items-center justify-start p-4 whitespace-normal border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60"
          onClick={() => onChoice('personal')}
          disabled={!personalEnabled}
        >
          <div className="flex items-center gap-3 w-full">
            <HandCoins className="h-6 w-6 text-indigo-600 flex-shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-semibold text-indigo-900">Préstamo Personal</h3>
              <p className="text-xs text-indigo-700">
                Efectivo o equipo a tu nombre, no usa tu línea
              </p>
            </div>
          </div>
        </Button>
        {!personalEnabled && !personalLoan.eligible && (
          <p className="px-1 text-xs text-muted-foreground">
            {blockLabels[personalLoan.reason]}
            {personalLoan.reason === 'ACTIVO' && personalLoan.folioActivo && (
              <>
                {' · '}
                <Link href={`/sign/${personalLoan.folioActivo}`} className="font-semibold text-indigo-700 underline">
                  Ver folio {personalLoan.folioActivo}
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
