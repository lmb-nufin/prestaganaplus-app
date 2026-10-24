'use client';

import Link from 'next/link';
import { Banknote, ChevronRight } from 'lucide-react';

import type { PersonalLoanBlockReason, PersonalLoanOption, PhoneOfferOption } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from './ui/button';

const cashBlockLabels: Record<PersonalLoanBlockReason, string> = {
  ATRASADA: 'Necesitas estar al día',
  ANTIGUEDAD: 'Disponible al cumplir 3 meses',
  ACTIVO: 'Ya tienes un préstamo activo',
  NO_DISPONIBLE: 'Servicio no disponible',
};

/** Dentro de "Préstamo Personal": Efectivo (flujo actual) o el teléfono financiado. */
export function PersonalLoanOptions({
  personalLoan,
  phoneOffer,
  onCash,
}: {
  personalLoan: PersonalLoanOption;
  phoneOffer: PhoneOfferOption;
  onCash: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Button
          variant="outline"
          className="w-full h-auto min-h-20 flex items-center justify-start p-4 whitespace-normal border-indigo-200 disabled:opacity-60"
          onClick={onCash}
          disabled={!personalLoan.eligible}
        >
          <div className="flex items-center gap-3 w-full">
            <Banknote className="h-6 w-6 text-indigo-600 flex-shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-semibold text-indigo-900">Efectivo</h3>
              <p className="text-xs text-indigo-700">De $4,500 a $8,500, a 8–14 quincenas</p>
            </div>
            <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0" />
          </div>
        </Button>
        {!personalLoan.eligible && (
          <p className="px-1 text-xs text-muted-foreground">
            {cashBlockLabels[personalLoan.reason]}
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

      <PhoneOfferCard phoneOffer={phoneOffer} />
    </div>
  );
}

function PhoneOfferCard({ phoneOffer }: { phoneOffer: PhoneOfferOption }) {
  const offer = phoneOffer.offer;
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border border-indigo-200 bg-white p-3 text-left',
        phoneOffer.available ? 'hover:bg-indigo-50' : 'opacity-60'
      )}
    >
      {offer?.modelo.imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={offer.modelo.imagenUrl} alt={offer.modelo.nombre} className="h-16 w-12 flex-shrink-0 object-contain" />
      ) : (
        <div className="h-16 w-12 flex-shrink-0 rounded bg-indigo-100" />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-indigo-900">{offer ? `${offer.modelo.nombre} ${offer.modelo.almacenamiento}` : 'Samsung Galaxy A17'}</h3>
        {offer ? (
          <>
            <p className="text-xs text-indigo-700">
              Precio {formatCurrency(offer.precio)} · Enganche {formatCurrency(offer.engancheMonto)}
            </p>
            <p className="text-xs text-muted-foreground">Herramienta de trabajo, a {offer.planes.map((p) => p.quincenas).join(' o ')} quincenas</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Equipo financiado como herramienta de trabajo</p>
        )}
      </div>
      {phoneOffer.available && <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
    </div>
  );

  return (
    <div className="space-y-1" data-testid="phone-offer-option">
      {phoneOffer.available ? (
        <Link href="/telefono" aria-label="Ver oferta del Samsung Galaxy A17">
          {content}
        </Link>
      ) : (
        <div aria-disabled="true">{content}</div>
      )}
      {!phoneOffer.available && (
        <p className="px-1 text-xs text-muted-foreground">
          {phoneOffer.message}
          {phoneOffer.reason === 'SOLICITUD_ABIERTA' && phoneOffer.folio && <> · Folio {phoneOffer.folio}</>}
        </p>
      )}
    </div>
  );
}
