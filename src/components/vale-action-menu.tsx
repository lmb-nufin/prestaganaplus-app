
'use client';

import { PenSquare, View, MoreVertical, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog } from '@/components/ui/dialog';
import type { Vale } from '@/lib/types';
import { ValeCancellationDialog } from './vale-cancellation-dialog';

export const ValeActionMenu = ({ vale }: { vale?: Vale }) => {
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    if (!vale) return null;
    
    const canBeCancelled = vale.status === 'PENDIENTE' || vale.status === 'FIRMADO';

    return (
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem asChild>
                <Link href={`/sign/${vale.folio}`}>
                  <View className="mr-2 h-4 w-4" />
                  <span>Ver Detalle</span>
                </Link>
            </DropdownMenuItem>
            {vale.status === 'PENDIENTE' && (
                <DropdownMenuItem asChild>
                  <Link href={`/sign/${vale.folio}`}>
                      <PenSquare className="mr-2 h-4 w-4" />
                      <span>Firmar Vale</span>
                  </Link>
              </DropdownMenuItem>
            )}
            {canBeCancelled && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsCancelDialogOpen(true);
                  }}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Cancelar Vale</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {isCancelDialogOpen && (
          <ValeCancellationDialog
            folio={vale.folio}
            onOpenChange={setIsCancelDialogOpen}
          />
        )}
      </Dialog>
    );
  };
