import React from 'react';
import { cn } from '@/lib/utils';

type LogoProps = {
  animatePlus?: boolean;
}

const Logo = ({ animatePlus = false }: LogoProps) => {
  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-headline font-bold text-gray-800">
        PrestaGana
        <span className={cn(
          "text-primary font-bold inline-block",
          animatePlus && "animate-plus-spin-once"
        )}>
          +
        </span>
      </h1>
    </div>
  );
};

export default Logo;
