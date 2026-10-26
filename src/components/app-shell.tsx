import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Marco de las pantallas con header y/o barra inferior.
 * El documento no hace scroll: solo el contenido de en medio. Así, en iPhone (WebKit), el header y la
 * barra inferior no se desfasan cuando las barras del navegador cambian de alto, como pasaba con
 * `position: fixed`.
 */
export function AppShell({
  header,
  footer,
  className,
  children,
}: {
  header: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex h-screen flex-col overflow-hidden supports-[height:100dvh]:h-[100dvh]', className)}>
      {header}
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain" data-testid="app-scroll">
        {children}
      </div>
      {footer}
    </div>
  );
}
