'use client';

import { useState } from 'react';
import { updatePaymentAction } from '@/actions/payments';
import { formatCents } from '@/lib/utils';
import { X } from 'lucide-react';

type Payment = {
  id: string;
  amount_cents: number;
  method: string;
  status: string;
  created_at: string;
};

type EditPaymentModalProps = {
  payment: Payment;
  onClose: () => void;
};

export function EditPaymentModal({ payment, onClose }: EditPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const amountEuros = parseFloat(formData.get('amount') as string);
    const method = formData.get('method') as 'card_sumup' | 'cash' | 'free';
    const status = formData.get('status') as 'pending' | 'success' | 'failed' | 'cancelled';
    const createdAt = formData.get('created_at') as string;

    const result = await updatePaymentAction(payment.id, {
      amount_cents: Math.round(amountEuros * 100),
      method,
      status,
      created_at: createdAt,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      // Force page reload to show updated data
      window.location.reload();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-prune">Modifier le paiement</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Montant (€)
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              defaultValue={(payment.amount_cents / 100).toFixed(2)}
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Méthode de paiement
            </label>
            <select
              name="method"
              defaultValue={payment.method}
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="cash">Espèces</option>
              <option value="card_sumup">Carte (SumUp)</option>
              <option value="free">Gratuit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Statut
            </label>
            <select
              name="status"
              defaultValue={payment.status}
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="success">Payé</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Date
            </label>
            <input
              type="datetime-local"
              name="created_at"
              defaultValue={new Date(payment.created_at).toISOString().slice(0, 16)}
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-prune px-4 py-2 text-sm font-medium text-white hover:bg-prune-light disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
