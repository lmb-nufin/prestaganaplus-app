
'use client';

import { useState } from 'react';
import Logo from '@/components/logo';
import { LoginForm } from './login-form';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLoginClick = () => {
    setIsAnimating(true);
    // This timeout is a fallback in case auth fails and we stay on the page.
    setTimeout(() => setIsAnimating(false), 3000); 
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      <div className="relative w-full max-w-sm">
        {/* This div holds the initial position and animates */}
        <div className={cn(
          "transition-transform duration-1000 ease-in-out",
          isAnimating ? "translate-y-[100%]" : "translate-y-0" // Moves down by 100% of its own height
        )}>
           <div className="mb-8 flex justify-center">
              <Logo animatePlus={isAnimating} />
          </div>
        </div>
       
        {/* This div contains the form and handles the fade-out */}
        <div className={cn(
          "w-full transition-opacity duration-500",
           // The form fades out by setting its opacity to 0
          isAnimating ? "opacity-0" : "opacity-100"
        )}>
           <LoginForm onLoginClick={handleLoginClick} />
        </div>
      </div>
    </div>
  );
}
