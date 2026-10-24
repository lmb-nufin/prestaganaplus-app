
'use client';

import { Button } from './ui/button';
import { UserPlus, UserCog } from 'lucide-react';

interface NewOrRenewedChoiceProps {
  onChoice: (choice: 'new' | 'renewed') => void;
}

export function NewOrRenewedChoice({ onChoice }: NewOrRenewedChoiceProps) {
  return (
    <div className="p-4 space-y-3">
      <Button
        variant="outline"
        className="w-full h-20 flex items-center justify-start p-4"
        onClick={() => onChoice('new')}
      >
        <div className="flex items-center gap-3 w-full">
          <UserPlus className="h-6 w-6 text-primary flex-shrink-0" />
          <div className="flex-1 text-left">
            <h3 className="font-semibold">Cliente Nuevo</h3>
            <p className="text-xs text-muted-foreground">
              Crear vale para cliente nuevo
            </p>
          </div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="w-full h-20 flex items-center justify-start p-4"
        onClick={() => onChoice('renewed')}
      >
        <div className="flex items-center gap-3 w-full">
          <UserCog className="h-6 w-6 text-accent flex-shrink-0" />
          <div className="flex-1 text-left">
            <h3 className="font-semibold">Cliente Existente</h3>
            <p className="text-xs text-muted-foreground">
              Buscar un cliente existente por su CURP.
            </p>
          </div>
        </div>
      </Button>
    </div>
  );
}
