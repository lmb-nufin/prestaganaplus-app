
'use client';

import { useActionState, useState, useEffect, useRef, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Send, KeyRound, CheckCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';

import type { Vale } from '@/lib/types';
import { sendValeOtp, signValeWithOtp } from '@/app/actions';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Label } from './ui/label';
import { useDeviceSignedSubmit } from '@/hooks/use-device-bridge';
import { DeviceSignatureError, DeviceSignatureFields } from './device-gate';


export function ValeSigningForm({ vale, deviceSignatureRequired = false }: { vale: Vale; deviceSignatureRequired?: boolean }) {
  // D2: con equipo, la firma del dispositivo se suma al OTP + NIP.
  const deviceSignature = useDeviceSignedSubmit(
    deviceSignatureRequired,
    useCallback(() => ({ operacion: 'FIRMAR_VALE' as const, folio: vale.folio, monto: vale.loanAmount }), [vale.folio, vale.loanAmount])
  );
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [signState, formAction] = useActionState(signValeWithOtp, { success: false, message: '' });
  const { toast } = useToast();
  const router = useRouter();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  
   useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      setIsResendDisabled(true);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(60);
  };
  
  useEffect(() => {
    if (signState.success) {
      toast({
        title: '¡Éxito!',
        description: signState.message,
        className: 'bg-accent text-accent-foreground',
      });
      router.refresh();
    } else if (signState.message && !signState.errors) {
       toast({
        title: 'Error al Firmar',
        description: signState.message,
        variant: 'destructive',
      });
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [signState, vale.folio, toast, router]);

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const result = await sendValeOtp();
      if (result.success) {
        toast({
            title: 'Código Enviado',
            description: result.message,
        });
        setIsOtpSent(true); 
        startCountdown();
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
         toast({
            title: 'Error',
            description: result.message || 'No se pudo enviar el código.',
            variant: 'destructive',
        });
      }
    } catch (error) {
       toast({
            title: 'Error Inesperado',
            description: 'No se pudo enviar el código. Intenta de nuevo.',
            variant: 'destructive',
        });
    } finally {
        setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
      setOtp(new Array(6).fill(""));
      await handleSendOtp();
  };
  
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus on next input
    if (element.nextSibling && element.value) {
        (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // On backspace, if the input is empty, move to the previous input
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]!.focus();
    }
  };

  return (
    <div className="p-4 space-y-4 w-full">
        <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600"/>
            <AlertTitle className="text-blue-800 font-headline">Firma de la Asociada</AlertTitle>
            <AlertDescription className="text-blue-700">
                Para autorizar este vale, se enviará un código de verificación (OTP) a <strong>tu número de teléfono</strong> registrado.
            </AlertDescription>
        </Alert>
        
        {!isOtpSent ? (
            <Button onClick={handleSendOtp} disabled={isSendingOtp} className="w-full">
                {isSendingOtp ? <Loader2 className="animate-spin" /> : <Send />}
                Enviar Código de Firma
            </Button>
        ) : (
            <form action={formAction} onSubmit={deviceSignature.onSubmit} className="space-y-4">
                <DeviceSignatureFields signature={deviceSignature.signature} />
                 <Alert variant="default" className="bg-accent/10 border-accent/20 text-accent/90">
                    <CheckCircle className="h-4 w-4 text-accent"/>
                    <AlertTitle className="font-headline text-accent">¡Código Enviado!</AlertTitle>
                    <AlertDescription>
                        Ingresa el código OTP que recibiste por SMS y tu NIP de seguridad.
                    </AlertDescription>
                </Alert>
            
                <input type="hidden" name="folio" value={vale.folio} />
                <input type="hidden" name="otp" value={otp.join("")} />
                
                <div className="space-y-1">
                    <Label htmlFor="otp" className="text-xs">Código de Verificación (OTP)</Label>
                    <div className="flex justify-center gap-2" dir="ltr">
                        {otp.map((data, index) => {
                            return (
                                <Input
                                    key={index}
                                    id={index === 0 ? 'otp' : undefined}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d{1}"
                                    value={data}
                                    maxLength={1}
                                    className="w-10 h-12 text-center text-lg font-mono"
                                    onChange={e => handleOtpChange(e.target, index)}
                                    onFocus={e => e.target.select()}
                                    onKeyDown={e => handleKeyDown(e, index)}
                                    ref={el => inputRefs.current[index] = el}
                                />
                            );
                        })}
                    </div>
                    {signState?.errors?.otp && <p className="text-xs text-destructive text-center pt-1">{signState.errors.otp[0]}</p>}
                </div>
                 
                 <div className="space-y-1">
                    <Label htmlFor="nip" className="text-xs">NIP de Seguridad</Label>
                    <Input id="nip" name="nip" type="password" placeholder="****" required className="text-center tracking-[0.3em]" inputMode="numeric" pattern="\d*"/>
                    {signState?.errors?.nip && <p className="text-xs text-destructive text-center pt-1">{signState.errors.nip[0]}</p>}
                 </div>


                 <div className="text-center text-xs text-muted-foreground h-5">
                    {countdown > 0 ? (
                        <span>Puedes reenviar el código en <span className="font-bold font-mono">{countdown}s</span></span>
                    ) : (
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs"
                            onClick={handleResendOtp}
                            disabled={isSendingOtp || isResendDisabled}
                        >
                            {isSendingOtp ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                            Reenviar código
                        </Button>
                    )}
                 </div>

                <SubmitButton />

                <DeviceSignatureError message={deviceSignature.error} />
                {signState.message && !signState.success && !signState.errors && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error de Verificación</AlertTitle>
                        <AlertDescription>{signState.message}</AlertDescription>
                    </Alert>
                )}
            </form>
        )}
    </div>
  );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
            Verificar y Firmar Vale
        </Button>
    )
}
