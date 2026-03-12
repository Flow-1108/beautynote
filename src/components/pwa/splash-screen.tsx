'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Ne montrer le splash que lors du premier chargement de la session
    const hasShownSplash = sessionStorage.getItem('splash-shown');
    
    if (!hasShownSplash) {
      setShouldRender(true);
      setIsVisible(true);
      sessionStorage.setItem('splash-shown', 'true');

      // Démarre le fade-out après 500ms
      const fadeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 500);

      // Démonte le composant après la transition (500ms + 300ms transition)
      const unmountTimer = setTimeout(() => {
        setShouldRender(false);
      }, 800);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-300"
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
