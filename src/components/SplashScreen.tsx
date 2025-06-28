"use client";

import RasoiXpressLogo from '@/components/icons/RasoiXpressLogo';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000); // Start fading out after 2 seconds

    const finishTimer = setTimeout(() => {
      onAnimationFinish();
    }, 2500); // Complete animation after 2.5 seconds (2000ms visible + 500ms fade-out)

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onAnimationFinish]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-500',
        isFadingOut ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="animate-fade-in-up">
        <RasoiXpressLogo />
      </div>
    </div>
  );
};

export default SplashScreen;
