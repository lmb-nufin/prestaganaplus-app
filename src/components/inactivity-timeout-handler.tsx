'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { performSignOut } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function InactivityTimeoutHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  let inactivityTimer: NodeJS.Timeout;

  const handleSignOut = useCallback(() => {
    // Only sign out if not on a public page already
    if (pathname !== '/login' && pathname !== '/register') {
       toast({
        title: 'Sesión Expirada',
        description: 'Tu sesión se ha cerrado por inactividad.',
        className: 'bg-amber-500 text-white'
      });
      performSignOut();
    }
  }, [pathname, toast]);

  const resetTimer = useCallback(() => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(handleSignOut, INACTIVITY_TIMEOUT);
  }, [handleSignOut]);

  const onActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Attach event listeners only on the client
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', onActivity);
      window.addEventListener('keydown', onActivity);
      window.addEventListener('click', onActivity);
      window.addEventListener('scroll', onActivity);
      resetTimer();
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', onActivity);
        window.removeEventListener('keydown', onActivity);
        window.removeEventListener('click', onActivity);
        window.removeEventListener('scroll', onActivity);
        clearTimeout(inactivityTimer);
      }
    };
  }, [onActivity, resetTimer]);

  return null; // This component does not render anything
}
