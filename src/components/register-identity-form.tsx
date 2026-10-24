'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowRight, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { IdentityFormData } from './register-flow';


type RegisterIdentityFormProps = {
  onNextStep: (data: IdentityFormData) => Promise<{ success: boolean; message: string }>;
  initialData: IdentityFormData;
};

export function RegisterIdentityForm({ onNextStep, initialData }: RegisterIdentityFormProps) {
  const [associateId, setAssociateId] = useState(initialData.associateId || '');
  const [phoneNumber, setPhoneNumber] = useState(initialData.phoneE164 ? initialData.phoneE164.replace('+52', '') : '');
  const [firstName, setFirstName] = useState(initialData.firstName || '');
  const [lastName, setLastName] = useState(initialData.lastName || '');
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    initialData.birthDate ? new Date(initialData.birthDate) : undefined
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneE164 = `+52${phoneNumber}`;
  const isFormValid = associateId && phoneNumber.length === 10 && /^\d{10}$/.test(phoneNumber) && firstName && lastName && birthDate;
  
  const whatsappMessage = `Hola, necesito ayuda para registrar mi cuenta. Mis datos son: Asociada: ${associateId}, Tel: ${phoneE164}.`;
  const whatsappUrl = `https://wa.me/5215532415220?text=${encodeURIComponent(whatsappMessage)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsLoading(true);
    setError(null);
    
    const result = await onNextStep({
      associateId,
      phoneE164,
      firstName,
      lastName,
      birthDate: birthDate ? format(birthDate, "yyyy-MM-dd") : '',
    });

    setIsLoading(false);

    if (!result.success) {
        setError(result.message);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setBirthDate(selectedDate);
    setIsCalendarOpen(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4">
        <p className="text-center text-xs text-muted-foreground pb-2">
            Ingresa los datos tal como aparecen en tu registro de asociada.
        </p>
      <div className="space-y-1.5">
        <Label htmlFor="associateId" className="text-xs">Número de Asociada</Label>
        <Input id="associateId" value={associateId} onChange={(e) => setAssociateId(e.target.value)} required disabled={isLoading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phoneE164" className="text-xs">Teléfono</Label>
        <div className="flex items-center gap-1">
          <span className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 text-base md:text-sm text-muted-foreground">
            +52
          </span>
          <Input 
            id="phoneE164" 
            name="phoneE164"
            type="tel" 
            value={phoneNumber} 
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && value.length <= 10) {
                  setPhoneNumber(value);
              }
            }} 
            placeholder="55 1234 5678" 
            required 
            pattern="\d{10}"
            title="Ingresa un número de 10 dígitos"
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="firstName" className="text-xs">Nombre(s)</Label>
        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isLoading}/>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lastName" className="text-xs">Apellidos</Label>
        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isLoading}/>
      </div>

      <Collapsible open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <div className="space-y-1.5">
          <Label htmlFor="birthDate" className="text-xs">Fecha de Nacimiento</Label>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !birthDate && "text-muted-foreground"
              )}
              disabled={isLoading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {birthDate ? format(birthDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="flex justify-center pt-2">
            <Calendar
              mode="single"
              selected={birthDate}
              onSelect={handleDateSelect}
              initialFocus
              locale={es}
              captionLayout="dropdown-buttons"
              fromYear={1930}
              toYear={new Date().getFullYear()}
              className="border rounded-md"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
        
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verificación Fallida</AlertTitle>
                <AlertDescription>
                    {error} Por favor, revisa tus datos o contacta a soporte si el problema persiste.
                </AlertDescription>
                <div className="mt-3">
                     <Button type="button" variant="secondary" className="w-full bg-white text-destructive border-destructive/50 hover:bg-destructive/10" asChild>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                           <MessageSquare className="mr-2" />
                           Contactar a Soporte
                        </a>
                    </Button>
                </div>
            </Alert>
        )}

        <div className="pt-2">
            <Button type="submit" disabled={!isFormValid || isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                Continuar
            </Button>
        </div>
    </form>
  );
}
