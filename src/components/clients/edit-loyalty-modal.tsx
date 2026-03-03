'use client';

import { useState, useActionState } from 'react';
import { adjustLoyaltyPointsAction } from '@/actions/loyalty';
import { X } from 'lucide-react';

type EditLoyaltyModalProps = {
  clientId: string;
  currentPoints: number;
  onClose: () => void;
};

const initialState = { error: '', success: false, newPoints: 0 };

export function EditLoyaltyModal({ clientId, currentPoints, onClose }: EditLoyaltyModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  
  const [state, formAction, isPending] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const points = parseInt(formData.get('points') as string, 10);
      const reason = formData.get('reason') as string;
      const type = formData.get('type') as 'add' | 'remove';
      
      const adjustment = type === 'add' ? points : -points;
      
      const result = await adjustLoyaltyPointsAction(clientId, adjustment, reason);
      
      if (result.success) {
        // Force page reload to show updated points
        window.location.reload();
        return { error: '', success: true, newPoints: result.newPoints || 0 };
      }
      return { error: result.error || 'Erreur inconnue', success: false, newPoints: 0 };
    },
    initialState
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-prune">Modifier les points de fidélité</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <div className="rounded-lg bg-surface-muted p-4">
            <p className="text-sm text-secondary">Solde actuel</p>
            <p className="text-2xl font-bold text-prune">{currentPoints} points</p>
          </div>
        </div>

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="type" value={adjustmentType} />
          
          <div>
            <label className="block text-sm font-medium text-foreground">
              Action
            </label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  adjustmentType === 'add'
                    ? 'bg-green-600 text-white'
                    : 'bg-surface text-foreground ring-1 ring-border hover:bg-surface-muted'
                }`}
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('remove')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  adjustmentType === 'remove'
                    ? 'bg-red-600 text-white'
                    : 'bg-surface text-foreground ring-1 ring-border hover:bg-surface-muted'
                }`}
              >
                Retirer
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Nombre de points
            </label>
            <input
              type="number"
              name="points"
              min="0"
              step="1"
              required
              placeholder="0"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Raison (optionnel)
            </label>
            <textarea
              name="reason"
              rows={2}
              placeholder="Ex: Correction d'erreur, cadeau, compensation..."
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
              {isPending ? 'Enregistrement...' : 'Valider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
