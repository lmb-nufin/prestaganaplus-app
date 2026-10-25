'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SubPageHeaderProps = {
  title: string;
  backLabel: string;
} & ({ backHref: string; onBack?: never } | { onBack: () => void; backHref?: never });

// Header de las pantallas que salen de la navegación principal (Vale Nuevo, firma, teléfono):
// flecha de regreso a la izquierda y el título de la pantalla. Fijo, como el Header principal,
// con un espacio del mismo alto para que el contenido empiece debajo.
export function SubPageHeader({ title, backLabel, backHref, onBack }: SubPageHeaderProps) {
  const icon = (
    <>
      <ArrowLeft className="size-5" />
      <span className="sr-only">{backLabel}</span>
    </>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-md items-center gap-1 px-2">
          {backHref ? (
            <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
              <Link href={backHref}>{icon}</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onBack}>
              {icon}
            </Button>
          )}
          <h1 className="truncate font-headline text-base font-semibold" data-testid="sub-page-title">{title}</h1>
        </div>
      </header>
      <div aria-hidden="true" className="h-[57px] flex-shrink-0" />
    </>
  );
}
