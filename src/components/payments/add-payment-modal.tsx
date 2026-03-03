'use client';

import { useState, useActionState } from 'react';
import { createManualPaymentAction } from '@/actions/payments';
import { X } from 'lucide-react';

type Client = {
  id: string;
  first_name: string;
  last_name: string;
};

type AddPaymentModalProps = {
  clients: Client[];
  onClose: () => void;
};

const initialState = { error: '', success: false };

export function AddPaymentModal({ clients, onClose }: AddPaymentModalProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const result = await createManualPaymentAction(formData);
      if (result.success) {
        // Force page reload to show new payment
        window.location.reload();
        return { error: '', success: true };
      }
      return { error: result.error || 'Erreur inconnue', success: false };
    },
    initialState
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-prune">Ajouter un paiement</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Cliente
            </label>
            <select
              name="client_id"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="">Sélectionner une cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Montant (€)
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Méthode de paiement
            </label>
            <select
              name="method"
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
              Date et heure
            </label>
            <input
              type="datetime-local"
              name="created_at"
              defaultValue={new Date().toISOString().slice(0, 16)}
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Description (optionnel)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Note sur ce paiement..."
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>

          {state.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {state.error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-md bg-prune px-4 py-2 text-sm font-medium text-white hover:bg-prune-light disabled:opacity-50"
            >
              {isPending ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
