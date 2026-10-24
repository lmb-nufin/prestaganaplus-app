
'use client';

import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { KeyRound, ShieldCheck, Check, Info, Loader2, CircleAlert } from 'lucide-react';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';

type RegisterNipFormProps = {
  onNextStep: (nip: string) => void;
};

type ValidationState = {
    length: boolean;
    numeric: boolean;
    match: boolean;
};

const ValidationCriteria = ({ label, isValid }: { label: string; isValid: boolean }) => (
    <div className={`flex items-center text-xs transition-colors ${isValid ? 'text-green-600' : 'text-muted-foreground'}`}>
        <Check className={`mr-1.5 h-3.5 w-3.5 ${isValid ? 'opacity-100' : 'opacity-40'}`} />
        <span>{label}</span>
    </div>
);


export function RegisterNipForm({ onNextStep }: RegisterNipFormProps) {
  const [nip, setNip] = useState('');
  const [nipConfirm, setNipConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validation: ValidationState = useMemo(() => {
    const isNumeric = /^\d*$/.test(nip);
    const lengthValid = nip.length >= 4 && nip.length <= 6;
    const match = nip.length > 0 && nip === nipConfirm;

    return {
        length: isNumeric && lengthValid,
        numeric: isNumeric,
        match: match,
    };
  }, [nip, nipConfirm]);

  const isFormValid = Object.values(validation).every(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    // Simulate backend call
    setTimeout(() => {
      onNextStep(nip);
      setIsSubmitting(false);
    }, 1000);
  };
  
  const handleNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (/^\d*$/.test(e.target.value)) {
        setNip(e.target.value);
     }
  };

  const handleNipConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (/^\d*$/.test(e.target.value)) {
        setNipConfirm(e.target.value);
     }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600"/>
            <AlertTitle className="text-blue-800 font-headline">Crea tu NIP de Seguridad</AlertTitle>
            <AlertDescription className="text-blue-700">
               Este NIP se usará como tu firma electrónica para autorizar vales y otras operaciones.
            </AlertDescription>
        </Alert>

        <div className="space-y-2">
            <Label htmlFor="nip" className="text-xs">Crea tu NIP</Label>
            <Input 
                id="nip" 
                type="password" 
                inputMode="numeric" 
                pattern="\d*"
                value={nip} 
                onChange={handleNipChange} 
                maxLength={6}
                className="text-center tracking-[0.3em] font-mono text-lg"
                placeholder="••••"
            />
        </div>

        <div className="space-y-2">
             <Label htmlFor="nipConfirm" className="text-xs">Confirma tu NIP</Label>
            <Input 
                id="nipConfirm" 
                type="password" 
                inputMode="numeric"
                pattern="\d*"
                value={nipConfirm} 
                onChange={handleNipConfirmChange} 
                maxLength={6}
                className="text-center tracking-[0.3em] font-mono text-lg"
                placeholder="••••"
            />
        </div>

        <Card className="bg-muted/50 p-3 shadow-none">
            <CardContent className="p-0 space-y-1.5">
                <ValidationCriteria label="Entre 4 y 6 dígitos" isValid={validation.length} />
                <ValidationCriteria label="Solo números" isValid={validation.numeric} />
                <ValidationCriteria label="Los NIPs coinciden" isValid={validation.match} />
            </CardContent>
        </Card>
        
        {!validation.numeric && nip.length > 0 && (
             <Alert variant="destructive" className="p-2 text-xs">
                <CircleAlert className="h-4 w-4" />
                <AlertDescription>Por favor, ingresa solo números.</AlertDescription>
            </Alert>
        )}

      <div className="pt-2">
        <Button type="submit" disabled={!isFormValid || isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          Finalizar Registro
        </Button>
      </div>
    </form>
  );
}
