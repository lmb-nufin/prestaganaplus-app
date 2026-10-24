'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { RefreshCw, ArrowLeft, KeyRound, Info, Loader2 } from 'lucide-react';

type RegisterOtpFormProps = {
  phone: string;
  onNextStep: (otp: string) => void;
  onBack: () => void;
};

export function RegisterOtpForm({ phone, onNextStep, onBack }: RegisterOtpFormProps) {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus on the first input when the component mounts
    inputRefs.current[0]?.focus();
  }, []);
  
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
  
  const handleResendOtp = () => {
    // In a real app, this would call the function to send a new OTP.
    console.log('Resending OTP...');
    startCountdown();
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
        // Maybe show a toast or error message
        return;
    }
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
        onNextStep(otpCode);
        setIsSubmitting(false);
    }, 1000);
  };

  const maskPhoneNumber = (phone: string) => {
    if (!phone) return '';
    return phone.slice(0, 4) + '...' + phone.slice(-2);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
       <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600"/>
            <AlertTitle className="text-blue-800 font-headline">Verifica tu Teléfono</AlertTitle>
            <AlertDescription className="text-blue-700">
                Hemos enviado un código de 6 dígitos a tu teléfono terminado en <strong>{maskPhoneNumber(phone)}</strong>.
            </AlertDescription>
        </Alert>

      <div className="space-y-2">
        <div className="flex justify-center gap-2" dir="ltr">
          {otp.map((data, index) => (
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
              disabled={isSubmitting}
            />
          ))}
        </div>
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
            disabled={isResendDisabled}
          >
            <RefreshCw />
            Reenviar código
          </Button>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <Button type="submit" disabled={isSubmitting || otp.join("").length !== 6} className="w-full">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
          Verificar Código
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft />
            Volver
        </Button>
      </div>
    </form>
  );
}
