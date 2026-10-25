
'use client';

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { authenticate } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ForgotNipForm } from './forgot-nip-form';


function LoginFormContent({ onLoginClick }: { onLoginClick: () => void }) {
  const [isForgotNipOpen, setIsForgotNipOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const { pending } = useFormStatus();


  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-xl">Bienvenida</CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="associateNumber">Número de Asociada</Label>
          <Input id="associateNumber" name="associateNumber" placeholder="Tu número" required />
        </div>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
              <Label htmlFor="nip">NIP</Label>
              {isClient && (
                  <Dialog open={isForgotNipOpen} onOpenChange={setIsForgotNipOpen}>
                  <DialogTrigger asChild>
                      <Button variant="link" size="sm" className="p-0 h-auto self-start text-xs">
                      ¿Olvidaste tu NIP?
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-0">
                      <DialogHeader className="p-4 pb-0">
                      <DialogTitle className="font-headline">Restablecer NIP</DialogTitle>
                      </DialogHeader>
                      <ForgotNipForm />
                  </DialogContent>
                  </Dialog>
              )}
          </div>
          <Input id="nip" name="nip" type="password" placeholder="****" required />
        </div>
        <Button 
            type="submit" 
            className="w-full" 
            aria-disabled={pending} 
            disabled={pending}
            onClick={(e) => {
              // Solo anima si el formulario se va a enviar (con campos vacíos el navegador lo detiene).
              if (e.currentTarget.form?.checkValidity()) onLoginClick();
            }}
        >
            {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
            Ingresar
        </Button>
      </CardContent>
    </>
  )
}


export function LoginForm({ onLoginClick, onAuthError }: { onLoginClick: () => void; onAuthError?: () => void }) {
  const [errorMessage, formAction] = useActionState(authenticate, undefined);
  // A dónde regresar después del login; el servidor solo acepta rutas internas.
  const [callbackUrl, setCallbackUrl] = useState('');

  useEffect(() => {
    setCallbackUrl(new URLSearchParams(window.location.search).get('callbackUrl') ?? '');
  }, []);

  // Si la autenticación falla, regresa el formulario de inmediato para mostrar el error.
  useEffect(() => {
    if (errorMessage) onAuthError?.();
  }, [errorMessage, onAuthError]);

  return (
    <div className="space-y-2">
        <Card>
            <form action={formAction} autoComplete="off">
                 <input type="hidden" name="callbackUrl" value={callbackUrl} />
                 <LoginFormContent onLoginClick={onLoginClick} />
            </form>
        </Card>
        {errorMessage && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de Autenticación</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        )}
    </div>
  );
}
