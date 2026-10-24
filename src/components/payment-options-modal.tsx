
'use client';

import Image from 'next/image';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, AlertCircle, Star } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface PaymentOptionsModalProps {
  stpClabe: string;
  cieConvenio: string;
  cieReference: string;
  payCashReference: string;
}

const InfoRow = ({
  label,
  value,
  canCopy = false,
}: {
  label: string;
  value: string;
  canCopy?: boolean;
}) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: 'Copiado',
      description: `${label} copiado al portapapeles.`,
      className: 'bg-accent text-accent-foreground',
    });
  };

  return (
    <div className="flex justify-between items-center py-2 border-b border-dashed">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-sm font-semibold">{value}</p>
      </div>
      {canCopy && (
        <Button size="icon" variant="ghost" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

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
           <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-auto p-1">
             <TabsTrigger value="stp" className="text-xs px-1 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Star className="h-3 w-3" />
                Transferencia STP
            </TabsTrigger>
            <TabsTrigger value="cie" className="text-xs px-1 data-[state=active]:bg-blue-800 data-[state=active]:text-white">BBVA CIE</TabsTrigger>
            <TabsTrigger value="paycash" className="text-xs px-1 data-[state=active]:bg-amber-500 data-[state=active]:text-black">Efectivo (PayCash)</TabsTrigger>
          </TabsList>

           <TabsContent value="stp" className="border border-primary/20 bg-primary/10 rounded-b-md p-4 space-y-1.5">
              <p className="text-xs text-center text-primary/80 mb-3 font-medium">
                  Realiza una transferencia SPEI desde cualquier app bancaria con los
                  siguientes datos.
              </p>
              <InfoRow label="Banco" value="STP (Sistema de Transferencias y Pagos)" />
              <InfoRow label="CLABE" value={stpClabe} canCopy />
          </TabsContent>
          
          <TabsContent value="cie" className="border border-blue-800/20 bg-blue-900/10 rounded-b-md p-4 space-y-1.5">
              <p className="text-xs text-center text-blue-900/80 mb-3">
                Paga en ventanilla o app BBVA con ‘Pago de Servicios – Convenio CIE’.
              </p>
              <InfoRow label="Banco" value="BBVA" />
              <InfoRow label="Beneficiario" value="DEEHOCK SAPI DE CV" />
              <InfoRow label="Convenio CIE" value={cieConvenio} canCopy/>
              <InfoRow label="Referencia" value={cieReference} canCopy/>
          </TabsContent>
          
          <TabsContent value="paycash" className="border border-amber-500/20 bg-amber-500/10 rounded-b-md p-4 space-y-3">
              <p className="text-xs text-center text-amber-900/80">
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
