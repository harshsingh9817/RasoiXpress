"use client";

import { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

export default function LayoutClientManager({ children }: { children: React.ReactNode }) {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    const hasBeenShown = sessionStorage.getItem('splashShown') === 'true';
    if (hasBeenShown) {
      setIsSplashVisible(false);
    }
  }, []);

  const handleAnimationFinish = () => {
    setIsSplashVisible(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  return (
    <>
      {isSplashVisible && <SplashScreen onAnimationFinish={handleAnimationFinish} />}
      {!isSplashVisible && children}
    </>
  );
}
