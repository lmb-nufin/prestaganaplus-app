'use client';

import { useState } from 'react';
import { RegisterIdentityForm } from './register-identity-form';
import { RegisterOtpForm } from './register-otp-form';
import { RegisterNipForm } from './register-nip-form';
import { RegisterSuccess } from './register-success';
import { verifyAssociateIdentity } from '@/app/actions';

type Step = 'identity' | 'otp' | 'nip' | 'success';

export type IdentityFormData = {
  associateId: string;
  phoneE164: string;
  firstName: string;
  lastName: string;
  birthDate: string;
};


export function RegisterFlow() {
  const [step, setStep] = useState<Step>('identity');
  const [formData, setFormData] = useState<IdentityFormData>({
      associateId: '',
      phoneE164: '',
      firstName: '',
      lastName: '',
      birthDate: '',
  });

  const handleIdentitySuccess = async (data: IdentityFormData) => {
    // Here we call the backend to validate identity
    const result = await verifyAssociateIdentity(data);
    
    if (result.success) {
        console.log('Identity data submitted:', data);
        setFormData(data);
        setStep('otp');
        return { success: true, message: '' };
    } else {
        // Return error to the form
        return { success: false, message: result.message };
    }
  };

  const handleOtpSuccess = (otp: string) => {
    console.log('OTP verified:', otp);
    setStep('nip');
  };

  const handleNipSuccess = (nip: string) => {
    // In a real app, this would call the backend to set the NIP.
    // Also, generate and save deviceId here.
    console.log('NIP set successfully:', nip);
    const deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
    console.log('Device ID saved to localStorage:', deviceId);
    setStep('success');
  };

  const handleBackToIdentity = () => {
    setStep('identity');
  };

  switch (step) {
    case 'identity':
      return <RegisterIdentityForm onNextStep={handleIdentitySuccess} initialData={formData} />;
    case 'otp':
      return <RegisterOtpForm 
                onNextStep={handleOtpSuccess} 
                onBack={handleBackToIdentity} 
                phone={formData.phoneE164} 
              />;
    case 'nip':
      return <RegisterNipForm onNextStep={handleNipSuccess} />;
    case 'success':
      return <RegisterSuccess />;
    default:
      return <RegisterIdentityForm onNextStep={handleIdentitySuccess} initialData={formData} />;
  }
}
