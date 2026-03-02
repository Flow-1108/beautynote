'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Démarre le fade-out après 2 secondes
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    // Démonte le composant après la fin de la transition (2s + 1s transition)
    const unmountTimer = setTimeout(() => {
      setShouldRender(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-1000"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="flex flex-col items-center">
        <Image
          src="/splash-logo.png"
          alt="Anthéa Cauchois - Esthéticienne à domicile"
          width={400}
          height={400}
          priority
          className="animate-fade-in"
        />
      </div>
    </div>
  );
}
