
import Image from 'next/image';
import { CheckCircle, Share2, ListChecks } from 'lucide-react';
import type { Vale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export const DigitalVale = ({ vale, associateName }: { vale: Vale, associateName: string }) => {
  if (!vale) return null;

  const baseUrl = process.env.API_BASE_URL || '';
  const valeUrl = `${baseUrl}ValeView/${vale.folio}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(valeUrl)}`;
  const isPersonal = vale.tipoVale === 'PERSONAL';
  // En el préstamo personal, vale.phone ya es el teléfono de la asociada.
  const whatsappMessage = isPersonal
    ? `Hola ${vale.firstName}! 👋\n\nTu préstamo personal PrestaGana+ ha sido autorizado.\n\nPuedes consultarlo aqui 👇\n\n${valeUrl}`
    : `Hola ${vale.firstName}! 👋\n\nTu vale PrestaGana+ ha sido autorizado por ${associateName}.\n\nPuedes consultarlo aqui 👇\n\n${valeUrl}`;
  const whatsappUrl = `https://wa.me/${vale.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="space-y-4">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground py-0.5 px-2 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold text-xs">Vale Firmado y Autorizado</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Este vale está listo para ser utilizado en sucursal.
            </p>
            <div className="pt-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                      <Share2 className="mr-2"/>
                      Enviar por WhatsApp
                  </Button>
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-lg border">
            <Image src={qrCodeUrl} alt="Código QR del Vale" width={100} height={100} data-ai-hint="qr code"/>
            <p className="text-xs text-muted-foreground font-mono">Escanéame</p>
          </div>
        </div>
      </div>
      
      <Alert variant="default" className="bg-blue-50 border-blue-200">
          <ListChecks className="h-5 w-5 text-blue-600"/>
          <AlertTitle className="text-blue-800 font-headline">{isPersonal ? 'Próximos Pasos' : 'Próximos Pasos para tu Cliente'}</AlertTitle>
          <AlertDescription className="text-blue-700 text-xs">
              {isPersonal ? 'Acude a sucursal y presenta:' : 'Tu cliente debe acudir a sucursal y presentar:'}
              <ul className="list-disc space-y-1 pl-4 mt-2">
                  <li>El vale digital (código QR).</li>
                  <li>Su INE vigente.</li>
                  <li>Comprobante de Cuenta donde se depositará el crédito.</li>
              </ul>
          </AlertDescription>
      </Alert>
    </div>
  );
};
