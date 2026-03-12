'use client';

import { useState } from 'react';
import { prepareCardPaymentAction } from '@/actions/payments';
import { buildSumUpPaymentUrl } from '@/lib/sumup';

export function SumUpPaymentButton({ appointmentId }: { appointmentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);

  const affiliateKey = process.env.NEXT_PUBLIC_SUMUP_AFFILIATE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  const handlePayment = async () => {
    if (!affiliateKey) {
      setError('Clé d\'affiliation SumUp manquante. Contactez l\'administrateur.');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugUrl(null);

    try {
      // 1. Créer le paiement pending en BDD
      const result = await prepareCardPaymentAction(appointmentId);

      if ('error' in result && result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (!('amountEuros' in result) || !result.amountEuros || !result.foreignTxId) {
        setError('Erreur inattendue lors de la préparation du paiement.');
        setLoading(false);
        return;
      }

      // 2. Construire l'URL SumUp
      const callbackBase = `${appUrl}/sumup-callback`;
      const callbackSuccess = `${callbackBase}?result=success&appointmentId=${appointmentId}`;
      const callbackFail = `${callbackBase}?result=failed&appointmentId=${appointmentId}`;

      const sumupUrl = buildSumUpPaymentUrl({
        amount: result.amountEuros,
        title: 'BeautyNote',
        foreignTxId: result.foreignTxId,
        affiliateKey,
        callbackSuccess,
        callbackFail,
      });

      console.log('[SumUp] Generated URL:', sumupUrl);
      setDebugUrl(sumupUrl);

      // 3. Ouvrir l'app SumUp
      window.location.href = sumupUrl;

      // Si on est toujours là après 3s, SumUp ne s'est pas ouvert
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    } catch (err) {
      setError('Erreur lors de la préparation du paiement.');
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-2 rounded-md bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}
      {debugUrl && (
        <details className="mb-2">
          <summary className="cursor-pointer text-xs text-secondary">Debug: URL SumUp</summary>
          <p className="mt-1 break-all text-xs font-mono text-secondary bg-surface-muted p-2 rounded">
            {debugUrl}
          </p>
        </details>
      )}
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className="rounded-md bg-prune px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-prune-light disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Ouverture de SumUp…' : 'Payer par carte (SumUp)'}
      </button>
    </div>
  );
}
