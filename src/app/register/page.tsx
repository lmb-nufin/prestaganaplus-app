import Logo from '@/components/logo';
import { RegisterFlow } from '@/components/register-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-lg relative">
             <Link href="/login" passHref>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10">
                    <X className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">Cerrar</span>
                </Button>
            </Link>
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-xl">Crear Nueva Cuenta</CardTitle>
                <CardDescription>Sigue los pasos para registrarte.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <RegisterFlow />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
