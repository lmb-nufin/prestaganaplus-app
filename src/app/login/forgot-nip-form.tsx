
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MessageCircle, Phone, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { DialogClose } from '@/components/ui/dialog';
import { getMaskedPhoneForReset, requestNipResetOtp, verifyOtpAndResetNip } from '@/app/actions';

type Step = 'enter-associate-id' | 'confirm-phone' | 'enter-otp' | 'reset-success' | 'support';

// OTP Input Component (sin cambios)
const OtpInput = ({ value, onChange, onComplete }) => {
  const inputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, 6);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value: val } = e.target;
    if (/^[0-9]$/.test(val)) {
      const newOtp = value.split('');
      newOtp[index] = val;
      const newValue = newOtp.join('');
      onChange(newValue);
      if (index < 5 && inputsRef.current[index + 1]) {
        inputsRef.current[index + 1].focus();
      } else if (newValue.length === 6) {
        onComplete(newValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0 && inputsRef.current[index - 1]) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    if (/^[0-9]{6}$/.test(paste)) {
      onChange(paste);
      onComplete(paste);
      inputsRef.current.forEach((input, i) => {
        if (input) input.value = paste[i] || '';
      });
      if(inputsRef.current[5]) inputsRef.current[5].focus();
    }
  };

  return (
    <div className="flex justify-center space-x-2" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Input
          key={i}
          ref={(el) => (inputsRef.current[i] = el as HTMLInputElement)}
          type="tel" // Use tel for numeric keyboard on mobile
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-12 h-12 text-center text-lg bg-gray-100 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      ))}
    </div>
  );
};

export function ForgotNipForm() {
  const [step, setStep] = useState<Step>('enter-associate-id');
  const [associateId, setAssociateId] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  // Evita mandar dos veces la verificación o el SMS al tocar el botón repetido.
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleAssociateIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!birthDay || !birthMonth || !birthYear || birthYear.length !== 4) {
        setError('Por favor, ingresa una fecha de nacimiento completa (DD, MM, AAAA).');
        return;
    }

    const day = parseInt(birthDay, 10);
    const month = parseInt(birthMonth, 10);
    const year = parseInt(birthYear, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 1930 || year > new Date().getFullYear() - 18) {
         setError('La fecha de nacimiento no es válida.');
         return;
    }

    const paddedMonth = birthMonth.padStart(2, '0');
    const paddedDay = birthDay.padStart(2, '0');
    const birthDateString = `${birthYear}-${paddedMonth}-${paddedDay}`;

    setIsSubmitting(true);
    try {
      const phone = await getMaskedPhoneForReset(associateId, birthDateString);
      if (phone) {
        setMaskedPhone(phone);
        setStep('confirm-phone');
      } else {
        setError('Los datos no coinciden. No se encontró ninguna cuenta con ese número de asociada y fecha de nacimiento.');
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

 const handlePhoneConfirm = async () => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      const result = await requestNipResetOtp(associateId);
      if (!result.success) {
        setError(result.message || 'No se pudo enviar el código. Intenta de nuevo.');
        return;
      }
      setResendCooldown(120); // Inicia cooldown de 2 minutos
      setStep('enter-otp');
    } catch (err) {
      setError('No se pudo enviar el código. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerOtpVerification(otp);
  };
  const [isVerifying, setIsVerifying] = useState(false);

  /*const triggerOtpVerification = async (finalOtp: string) => {
    if (finalOtp.length !== 6) return;
    setError('');
    try {
      const result = await verifyOtpAndResetNip(associateId, finalOtp);
      if (result.success) {
        setSuccess('¡Tu NIP ha sido restablecido! Recibirás un SMS con tu nuevo NIP.');
        setStep('reset-success');
      } else {
        setError(result.message || 'El código OTP es incorrecto o ha expirado.');
      }
    } catch (err) {
      setError('Ocurrió un error al verificar el código. Intenta de nuevo.');
    }
  };*/
  const triggerOtpVerification = async (finalOtp: string) => {
    if (finalOtp.length !== 6 || isVerifying) return; // BLOQUEO CRÍTICO
    
    setIsVerifying(true); 
    setError('');
    
    try {
      const result = await verifyOtpAndResetNip(associateId, finalOtp);
      if (result.success) {
        setSuccess('Te enviaremos tu nuevo NIP por SMS al número que confirmaste.');
        setStep('reset-success');
      } else {
        setError(result.message);
        setIsVerifying(false); // Liberar solo si hay error
      }
    } catch (err) {
      setError('Error de red');
      setIsVerifying(false);
    }
};

  const handleResendOtp = async () => {
    if (resendCooldown === 0) {
      setError('');
      try {
        const result = await requestNipResetOtp(associateId);
        if (!result.success) {
          setError(result.message || 'No se pudo reenviar el código. Intenta de nuevo.');
          return;
        }
        setResendCooldown(120);
      } catch (err) {
        setError('No se pudo reenviar el código OTP. Intenta de nuevo.');
      }
    }
  };

 const renderSupport = () => (
    <div className="p-6 space-y-4">
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 font-headline">Contacta a Soporte</AlertTitle>
      </Alert>
      
      <p className="text-sm text-muted-foreground text-center pt-2">
        Para proteger tu cuenta, es necesario que contactes a nuestro equipo para actualizar tu número de teléfono o restablecer tu NIP.
      </p>

      <div className="space-y-2 pt-2">
         <Button className="w-full bg-green-600 hover:bg-green-700 text-white" asChild>
          <a href="https://wa.me/5215532415220" target="_blank" rel="noopener noreferrer">
            <MessageCircle className='w-4 h-4 mr-2'/>
            Iniciar Chat por WhatsApp
          </a>
        </Button>
        <Button className="w-full" asChild variant="outline">
          <a href="tel:8000830898">
            <Phone className='w-4 h-4 mr-2'/>
            Llamar a Soporte
          </a>
        </Button>
        <Button variant="link" onClick={() => setStep('enter-associate-id')}>
          Regresar
        </Button>
      </div>
    </div>
  );

  if (step === 'support') return renderSupport();

  if (step === 'reset-success') {
    return (
      <div className="p-6 space-y-4 text-center">
        <Alert className="border-green-200 bg-green-50 text-left text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="font-headline">Tu NIP se restableció</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
        <DialogClose asChild>
          <Button className="w-full">Listo</Button>
        </DialogClose>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 'enter-associate-id' && (
        <form onSubmit={handleAssociateIdSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">Ingresa tus datos para verificar tu identidad.</p>
          <div>
            <Label htmlFor="associateId">Número de Asociada</Label>
            <Input
              id="associateId"
              value={associateId}
              onChange={(e) => setAssociateId(e.target.value)}
              placeholder="Ej. 12345678"
              required
            />
          </div>
           <div>
                <Label>Fecha de Nacimiento</Label>
                <div className="flex space-x-2">
                    <div className="w-1/3">
                        <Label htmlFor="birthDay" className="text-xs font-normal text-muted-foreground">Día</Label>
                        <Input
                            id="birthDay"
                            value={birthDay}
                            onChange={(e) => setBirthDay(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="DD"
                            maxLength={2}
                            type="tel"
                            required
                        />
                    </div>
                    <div className="w-1/3">
                        <Label htmlFor="birthMonth" className="text-xs font-normal text-muted-foreground">Mes</Label>
                        <Input
                            id="birthMonth"
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="MM"
                            maxLength={2}
                            type="tel"
                            required
                        />
                    </div>
                    <div className="w-1/3">
                        <Label htmlFor="birthYear" className="text-xs font-normal text-muted-foreground">Año</Label>
                        <Input
                            id="birthYear"
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="AAAA"
                            maxLength={4}
                            type="tel"
                            required
                        />
                    </div>
                </div>
            </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Continuar
          </Button>
          <Button type="button" variant='outline' className='w-full' onClick={() => setStep('support')}>
              Contactar Soporte
          </Button>
        </form>
      )}

      {step === 'confirm-phone' && (
         <div className="space-y-4 text-center border-t pt-6 mt-6">
            <h3 className="font-semibold text-lg">Confirma tu Teléfono</h3>
            <p className="text-sm text-muted-foreground">
                Enviaremos un código de verificación al número terminado en:
            </p>
            <p className="font-bold text-xl tracking-widest">{maskedPhone}</p>
            <p className="text-xs text-muted-foreground">Si no reconoces este número, contacta a soporte.</p>
            <div className="flex flex-col space-y-2 pt-2">
                <Button onClick={handlePhoneConfirm} className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Sí, es mi número. Enviar código.
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setStep('support')}>Mi número es incorrecto</Button>
                <Button variant="link" size="sm" onClick={() => setStep('enter-associate-id')}>
                  Regresar
                </Button>
            </div>
        </div>
      )}

      {step === 'enter-otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-6 border-t pt-6 mt-6">
          <div className='text-center'>
             <h3 className="font-semibold text-lg">Código de Verificación</h3>
             <p className="text-sm text-muted-foreground">Ingresa el código de 6 dígitos que enviamos a tu teléfono.</p>
          </div>
          <OtpInput value={otp} onChange={setOtp} onComplete={triggerOtpVerification} />
          
          <Button type="submit" disabled={isVerifying} className="w-full">
    {isVerifying ? 'Verificando...' : 'Verificar y Restablecer NIP'}
</Button>
          <div className="text-center text-sm">
            {resendCooldown > 0 ? (
              <p className="text-muted-foreground">Puedes solicitar otro código en {resendCooldown} segundos.</p>
            ) : (
              <Button variant="link" type="button" onClick={handleResendOtp}>
                Reenviar código
              </Button>
            )}
          </div>
          <Button type="button" variant="link" className="w-full -mt-2" onClick={() => setStep('support')}>
            Contactar a Soporte
          </Button>
        </form>
      )}
    </div>
  );
}
