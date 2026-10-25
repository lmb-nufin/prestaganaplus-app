
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/label-input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { getClientByCurp } from '@/app/actions';
import type { ExistingClient } from '@/lib/types';
import { Label } from './ui/label';

interface RenewClientCurpFormProps {
  onCurpSuccess: (clientData: ExistingClient, curp: string) => void;
  initialCurp?: string;
}

export function RenewClientCurpForm({ onCurpSuccess, initialCurp = '' }: RenewClientCurpFormProps) {
  const [curp, setCurp] = useState(initialCurp);
  const [curpConfirm, setCurpConfirm] = useState(initialCurp);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stricter regex based on the provided format.
  const curpPattern = "[A-Z][AEIOUX][A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[HM](AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9][0-9]";
  const showMismatchError = curp.length > 0 && curpConfirm.length > 0 && curp !== curpConfirm;
  const showFormatError = curp.length > 0 && !(new RegExp(`^${curpPattern}$`).test(curp));


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (curp !== curpConfirm) {
      setError('Los CURP no coinciden. Por favor, verifica.');
      return;
    }
    if (!(new RegExp(`^${curpPattern}$`).test(curp))) {
      setError('El formato del CURP no es válido. Debe tener 18 caracteres y seguir el formato oficial.');
      return;
    }
    
    setIsLoading(true);

    const result = await getClientByCurp(curp);
    
    setIsLoading(false);

    if (result.success && result.data) {
      onCurpSuccess(result.data, curp);
    } else {
      setError(result.message);
    }
  };

  const handleCurpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurp(e.target.value.toUpperCase());
  }

  const handleCurpConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurpConfirm(e.target.value.toUpperCase());
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="curp">CURP del Cliente</Label>
        <Input
          id="curp"
          value={curp}
          onChange={handleCurpChange}
          placeholder="Ingresa el CURP"
          required
          disabled={isLoading}
          maxLength={18}
          className="uppercase"
          autoComplete="off"
        />
         {showFormatError && (
            <p className="text-xs text-destructive">Formato de CURP inválido (18 caracteres).</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="curp-confirm">Confirmar CURP</Label>
        <Input
          id="curp-confirm"
          value={curpConfirm}
          onChange={handleCurpConfirmChange}
          placeholder="Confirma el CURP"
          required
          disabled={isLoading}
          maxLength={18}
          className="uppercase"
          autoComplete="off"
        />
        {showMismatchError && (
            <p className="text-xs text-destructive">Los CURP no coinciden.</p>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de Búsqueda</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2 pt-2">
        <Button type="submit" disabled={isLoading || !curp || !curpConfirm || showMismatchError || showFormatError} className="w-full">
          {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
          Buscar Cliente
        </Button>
      </div>
    </form>
  );
}
