'use client';

import { useState } from 'react';
import { confirmCardPaymentAction } from '@/actions/payments';

export function SumUpPaymentButton({
  appointmentId,
  amountFormatted,
}: {
  appointmentId: string;
  amountFormatted: string;
}) {
  const [step, setStep] = useState<'idle' | 'instructions' | 'confirming'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setStep('instructions');
    setError(null);
  };

  const handleConfirm = async () => {
    setStep('confirming');
    setError(null);

    const result = await confirmCardPaymentAction(appointmentId);

    if (result && 'error' in result && result.error) {
      setError(result.error);
      setStep('instructions');
      return;
    }

    // Succès — la page se recharge via revalidatePath
  };

  const handleCancel = () => {
    setStep('idle');
    setError(null);
  };

  if (step === 'idle') {
    return (
      <button
        type="button"
        onClick={handleStart}
        className="rounded-md bg-prune px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-prune-light"
      >
        Payer par carte (SumUp)
      </button>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="rounded-md bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-800">
          Montant à encaisser : {amountFormatted}
        </p>
        <ol className="mt-2 space-y-1 text-sm text-blue-700">
          <li>1. Ouvrez SumUp, saisissez <strong>{amountFormatted}</strong> et encaissez</li>
          <li>2. Une fois le paiement réussi, confirmez ci-dessous</li>
        </ol>
        <a
          href="sumupmerchant://pay/1.0"
          className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Ouvrir SumUp
        </a>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={step === 'confirming'}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 'confirming' ? 'Enregistrement…' : 'Paiement effectué'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={step === 'confirming'}
          className="rounded-md bg-surface px-4 py-2 text-sm font-medium text-secondary shadow-sm ring-1 ring-border hover:bg-surface-muted disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
