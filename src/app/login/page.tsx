'use client';

import { useRef, useState } from 'react';
import Logo from '@/components/logo';
import { LoginForm } from './login-form';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [isAnimating, setIsAnimating] = useState(false);
  // Distancia (px) del centro del logo al centro de la pantalla, medida al dar clic.
  const [offsetY, setOffsetY] = useState(0);
  const logoRef = useRef<HTMLDivElement>(null);

  const handleLoginClick = () => {
    const rect = logoRef.current?.getBoundingClientRect();
    if (rect) {
      setOffsetY(window.innerHeight / 2 - (rect.top + rect.height / 2));
    }
    setIsAnimating(true);
    // This timeout is a fallback in case auth fails and we stay on the page.
    setTimeout(() => setIsAnimating(false), 3000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      <div className="relative w-full max-w-sm">
        {/* The logo travels to the vertical center of the screen and grows a little. */}
        <div
          className="relative z-10 mb-8 flex justify-center transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
          style={{ transform: isAnimating ? `translateY(${offsetY}px) scale(1.4)` : 'translateY(0) scale(1)' }}
        >
          <div ref={logoRef}>
            <Logo animatePlus={isAnimating} />
          </div>
        </div>

        {/* This div contains the form and handles the fade-out */}
        <div className={cn(
          "w-full transition-opacity duration-500",
          isAnimating ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <LoginForm onLoginClick={handleLoginClick} />
        </div>
      </div>
    </div>
  );
}
