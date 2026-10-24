'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone } from 'lucide-react';

const SupportCard = ({ icon, title, description, buttonText, buttonLink }: { icon: React.ElementType, title: string, description: string, buttonText: string, buttonLink: string }) => {
    const Icon = icon;
    return (
        <Card className="flex flex-col text-center shadow-sm">
            <CardHeader className="p-3 pb-2">
                <div className="mx-auto flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="pt-2 font-headline text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-3 pt-0 pb-2">
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardContent>
            <CardFooter className="mt-auto border-t p-2">
                <Button className="w-full" asChild size="sm">
                    <a href={buttonLink} target="_blank" rel="noopener noreferrer">
                        {buttonText}
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function SoportePage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
            <h1 className="text-base font-bold font-headline">Centro de Soporte</h1>
            <p className="font-headline text-sm text-muted-foreground">¿Cómo podemos ayudarte? Estamos aquí para resolver tus dudas y ayudarte a sacar el máximo provecho.</p>
        </div>

        <div className="mx-auto grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            <SupportCard
                icon={MessageCircle}
                title="WhatsApp"
                description="La forma más rápida de obtener ayuda."
                buttonText="Iniciar Chat"
                buttonLink="https://wa.me/5215532415220"
            />
            <SupportCard
                icon={Phone}
                title="Teléfono"
                description="Llámanos para soporte directo."
                buttonText="Llamar Ahora"
                buttonLink="tel:8000830898"
            />
        </div>
    </div>
  );
}
