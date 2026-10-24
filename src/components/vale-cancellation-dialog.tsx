
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/label-input';
import { Label } from './ui/label';
import { cancelVale } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ValeCancellationDialogProps {
  folio: string;
  onOpenChange?: (open: boolean) => void;
  }
  
  const initialState = {
  success: false,
  message: '',
  };
  
  
  function SubmitButton() {
  const { pending } = useFormStatus();
  return (
  <Button type="submit" variant="destructive" disabled={pending} className="w-full sm:w-auto">
  {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
  Confirmar Cancelación
  </Button>
  );
  }
  
  export function ValeCancellationDialog({ folio, onOpenChange }: ValeCancellationDialogProps) {
  const [state, formAction] = useActionState(cancelVale, initialState);
  const { toast } = useToast();
  const router = useRouter(); 
  
  useEffect(() => {
  if (state.message) {
  if (state.success) {
  // 1. Cierre FORZADO e INMEDIATO del modal
  if (onOpenChange) {
  onOpenChange(false);
  }
  
        // 2. Redirección Asíncrona Agresiva
        // Usamos setTimeout(0) para asegurar que router.push se ejecute
        // en el siguiente tick del event loop, después de que React complete 
        // cualquier limpieza, forzando la navegación antes de que la página de fondo
        // intente recargarse y falle con el 404.
        setTimeout(() => {
            router.push('/vales'); 
        }, 0);
  
        // 3. Mostrar el toast (Puede ser después de la redirección)
  toast({
  title: 'Éxito',
  description: state.message,
  className: 'bg-accent text-accent-foreground',
  });
  
  } else {
  // Manejo de error
  toast({
  title: 'Error',
  description: state.message,
  variant: 'destructive',
  });
  }
  }
  // Se remueve 'router' de las dependencias ya que lo llamamos asíncronamente
  }, [state, toast, onOpenChange]); 
  
  // ID único para el formulario
  const formId = `cancel-vale-form-${folio}`;
  
  return (
  <DialogContent className="sm:max-w-md p-0">
  <form id={formId} action={formAction}>
   <DialogHeader className="p-4 pb-2">
   <DialogTitle className="font-headline text-lg">Cancelar Vale</DialogTitle>
   <DialogDescription>
   Estás a punto de cancelar permanentemente el vale con folio <strong>{folio}</strong>.
   </DialogDescription>
   </DialogHeader>
   
   <div className="px-4 pb-4 space-y-4">
   <Alert variant="destructive" className="p-3">
  <ShieldAlert className="h-4 w-4" />
  <AlertTitle className="text-sm font-headline">¡Acción Irreversible!</AlertTitle>
  <AlertDescription className="text-xs">
  Una vez cancelado, no podrás recuperar este vale. Para continuar, ingresa tu NIP de seguridad.
  </AlertDescription>
   </Alert>
   <div className="space-y-1.5">
  <Label htmlFor={`nip-cancel-${folio}`}>NIP de Seguridad</Label>
  <Input
  id={`nip-cancel-${folio}`}
  name="nip"
  type="password"
  placeholder="****"
  required
  className="text-center tracking-[0.3em]"
  inputMode="numeric"
  minLength={4}
  />
   </div>
   </div>
   <DialogFooter className="p-4 bg-muted/50 rounded-b-lg">
  <DialogClose asChild>
  <Button type="button" variant="ghost">Mejor no</Button>
  </DialogClose>
  <SubmitButton />
   </DialogFooter>
  <input type="hidden" name="folio" value={folio} />
   </form>
  </DialogContent>
  );
}
