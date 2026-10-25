
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, AlertCircle, Check, Landmark, Building2, Banknote } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface PaymentOptionsModalProps {
  stpClabe: string;
  cieConvenio: string;
  cieReference: string;
  payCashReference: string;
}

// Las referencias numéricas (CLABE, convenio, referencia) se pueden copiar y van en dígitos
// tabulares y espaciados para leerlas fácil; el resto es texto normal.
const InfoRow = ({
  label,
  value,
  canCopy = false,
}: {
  label: string;
  value: string;
  canCopy?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-semibold break-words', canCopy && 'tabular-nums tracking-wider text-base')}>
          {value}
        </p>
      </div>
      {canCopy && (
        <Button
          type="button"
          size="sm"
          variant={copied ? 'secondary' : 'outline'}
          onClick={handleCopy}
          className="h-8 flex-shrink-0 gap-1 px-2 text-xs"
          aria-label={`Copiar ${label}`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      )}
    </div>
  );
};

const MethodTab = ({ value, icon: Icon, title, subtitle }: { value: string; icon: React.ElementType; title: string; subtitle: string }) => (
  <TabsTrigger
    value={value}
    className="flex h-auto flex-col items-center gap-0.5 whitespace-normal rounded-md px-1 py-2 text-center leading-tight data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow"
  >
    <Icon className="h-4 w-4" />
    <span className="text-xs font-semibold">{title}</span>
    <span className="text-[10px] font-normal text-muted-foreground">{subtitle}</span>
  </TabsTrigger>
);

export function PaymentOptionsModal({
  stpClabe,
  cieConvenio,
  cieReference,
  payCashReference,
}: PaymentOptionsModalProps) {
  
  return (
    <ScrollArea className="max-h-[80vh]">
      <div className="p-4">
        <DialogHeader className="p-2 pb-0">
          <DialogTitle className="font-headline text-lg">
            Opciones de Pago
          </DialogTitle>
          <DialogDescription className="text-xs">
            Elige el método que más te convenga para realizar tu pago.
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800 my-3 p-3">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="font-headline text-sm">Importante</AlertTitle>
          <AlertDescription className="text-amber-700 text-xs">
             <ul className="list-disc space-y-1 pl-4">
                <li>Usa siempre la <strong>referencia correcta</strong> para cada método de pago.</li>
                <li className="font-semibold">Nunca deposites a cuentas que no sean las oficiales de PrestaGana.</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="stp" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted p-1">
            <MethodTab value="stp" icon={Landmark} title="Transferencia" subtitle="SPEI · Recomendado" />
            <MethodTab value="cie" icon={Building2} title="BBVA" subtitle="Convenio CIE" />
            <MethodTab value="paycash" icon={Banknote} title="Efectivo" subtitle="PayCash" />
          </TabsList>

          <TabsContent value="stp" className="mt-3 rounded-lg border p-3">
              <p className="mb-1 text-xs text-muted-foreground">
                  Transfiere desde cualquier app bancaria con estos datos.
              </p>
              <div className="divide-y">
                <InfoRow label="Banco" value="STP (Sistema de Transferencias y Pagos)" />
                <InfoRow label="CLABE" value={stpClabe} canCopy />
              </div>
          </TabsContent>

          <TabsContent value="cie" className="mt-3 rounded-lg border p-3">
              <p className="mb-1 text-xs text-muted-foreground">
                Paga en ventanilla o en la app BBVA con “Pago de Servicios – Convenio CIE”.
              </p>
              <div className="divide-y">
                <InfoRow label="Banco" value="BBVA" />
                <InfoRow label="Beneficiario" value="DEEHOCK SAPI DE CV" />
                <InfoRow label="Convenio CIE" value={cieConvenio} canCopy />
                <InfoRow label="Referencia" value={cieReference} canCopy />
              </div>
          </TabsContent>

          <TabsContent value="paycash" className="mt-3 rounded-lg border p-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                  Paga con el código de barras PayCash en los siguientes comercios.
              </p>
              <div className="flex justify-center bg-white p-2 rounded-lg">
                  <Image 
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${payCashReference}&size=200x50&format=png&barcode=true`} 
                    alt="Código de barras PayCash"
                    width={200}
                    height={50}
                    data-ai-hint="barcode"
                  />
              </div>
              <div className="grid grid-cols-3 gap-2 items-center justify-items-center">
                  <Image
                  src="https://placehold.co/80x30/00833D/FFFFFF/png?text=Bodega+A"
                  alt="Bodega Aurrera"
                  width={80}
                  height={30}
                  data-ai-hint="logo"
                  className="object-contain"
                  />
                  <Image
                  src="https://placehold.co/80x30/0071CE/FFFFFF/png?text=Walmart"
                  alt="Walmart"
                  width={80}
                  height={30}
                  data-ai-hint="logo"
                  className="object-contain"
                  />
                  <Image
                  src="https://placehold.co/80x30/D62828/FFFFFF/png?text=Soriana"
                  alt="Soriana"
                  width={80}
                  height={30}
                  data-ai-hint="logo"
                  className="object-contain"
                  />
                  <Image
                  src="https://placehold.co/80x30/ED1C24/FFFFFF/png?text=Circle+K"
                  alt="Circle K"
                  width={80}
                  height={30}
                  data-ai-hint="logo"
                  className="object-contain"
                  />
                  <Image
                  src="https://placehold.co/80x30/6A2C8B/FFFFFF/png?text=FINABIEN"
                  alt="FINABIEN (antes Telecomm)"
                  width={80}
                  height={30}
                  data-ai-hint="logo"
                  className="object-contain"
                  />
              </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
