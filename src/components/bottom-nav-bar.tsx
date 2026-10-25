
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, LifeBuoy, UserCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import type { IssuancePause } from '@/lib/types';

const navItemsLeft = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/vales', label: 'Vales', icon: List },
];

const navItemsRight = [
  { href: '/perfil', label: 'Perfil', icon: UserCircle },
  { href: '/soporte', label: 'Soporte', icon: LifeBuoy },
];

const NavLink = ({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) => {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link href={href} passHref className="flex-1">
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
          isActive
            ? 'text-primary font-bold'
            : 'text-muted-foreground hover:text-primary'
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
    </Link>
  );
};

const NewValeButton = ({ issuancePause }: { issuancePause?: IssuancePause | null }) => {
  const { toast } = useToast();

  // Emisión en pausa: el botón se ve gris, no navega y explica por qué.
  if (issuancePause) {
    return (
      <button
        type="button"
        aria-disabled="true"
        data-testid="nav-new-vale-paused"
        onClick={() => toast({ title: issuancePause.title, description: issuancePause.message })}
        className="flex flex-col items-center"
      >
        <span className="relative z-10 flex h-16 w-16 -translate-y-6 items-center justify-center rounded-full bg-muted shadow-lg ring-4 ring-background">
          <PlusCircle className="h-7 w-7 text-muted-foreground" />
          <span className="sr-only">Crear Vale Nuevo (en pausa)</span>
        </span>
        <span className="text-xs font-bold -translate-y-5 text-muted-foreground">
          Vale Nuevo
        </span>
      </button>
    );
  }

  return (
    <Link href="/vales/nuevo" className="flex flex-col items-center">
        <Button
            size="default"
            className="relative z-10 h-16 w-16 flex-col gap-0.5 rounded-full bg-primary p-2 shadow-lg ring-4 ring-background -translate-y-6"
            asChild
        >
            <div>
                <PlusCircle className="h-7 w-7 text-primary-foreground" />
                <span className="sr-only">Crear Vale Nuevo</span>
            </div>
        </Button>
        <span className="text-xs font-bold -translate-y-5 text-primary">
            Vale Nuevo
        </span>
    </Link>
  );
};

export default function BottomNavBar({ issuancePause = null }: { issuancePause?: IssuancePause | null }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="container mx-auto flex h-16 items-center justify-between px-0">
        <div className="flex flex-1 justify-around">
          {navItemsLeft.map(item => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        <div className="relative z-50 flex-shrink-0">
          <NewValeButton issuancePause={issuancePause} />
        </div>

        <div className="flex flex-1 justify-around">
          {navItemsRight.map(item => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </div>
    </nav>
  );
}
