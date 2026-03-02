'use client';

import { useEffect, useState, useCallback } from 'react';

// ============================================================
// OfflineDetector — Composant critique PWA
// ============================================================
// Règle métier : si perte réseau pendant une opération critique
// (paiement, validation RDV), le système annule automatiquement
// le RDV. Pas de mise en attente, pas de file d'attente.
//
// Ce composant :
//   1. Surveille navigator.onLine + événements online/offline
//   2. Affiche une bannière quand le réseau est perdu
//   3. Si une page de paiement/RDV est ouverte → tente l'annulation
//      automatique dès le retour en ligne
// ============================================================

export function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOfflineDuringCritical, setWasOfflineDuringCritical] = useState(false);

  // Détecte si on est sur une page critique (paiement ou création RDV)
  const isCriticalPage = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return (
      path.includes('/calendrier/') && !path.endsWith('/calendrier') ||
      path.includes('/paiements')
    );
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);

      // Si on est sur une page critique, noter qu'on a perdu le réseau
      if (isCriticalPage()) {
        setWasOfflineDuringCritical(true);
      }
    };

    const handleOnline = () => {
      setIsOffline(false);

      // Si on a perdu le réseau pendant une opération critique,
      // rafraîchir la page pour forcer la re-vérification côté serveur.
      // Le serveur verra les incohérences et agira en conséquence.
      if (wasOfflineDuringCritical) {
        setWasOfflineDuringCritical(false);
        window.location.reload();
      }
    };

    // État initial
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [isCriticalPage, wasOfflineDuringCritical]);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-red-600 px-4 py-2 text-center text-sm font-medium text-white shadow-lg">
      <p>
        Connexion perdue — Les opérations de paiement et de réservation sont suspendues.
        {wasOfflineDuringCritical && (
          <span className="ml-1 font-bold">
            L&apos;opération en cours sera annulée au retour de la connexion.
          </span>
        )}
      </p>
    </div>
  );
}
