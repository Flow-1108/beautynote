'use client';

import { useState, useActionState } from 'react';
import { deleteClientAction } from '@/actions/clients';

type DeleteClientButtonProps = {
  clientId: string;
};

const initialState = { error: '' };

export function DeleteClientButton({ clientId }: DeleteClientButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const result = await deleteClientAction(clientId);
      if (result?.error) {
        return { error: result.error };
      }
      return { error: '' };
    },
    initialState
  );

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-md bg-surface px-3 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-border hover:bg-red-50"
      >
        Supprimer
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {state.error && (
        <div className="rounded-md bg-red-50 p-2 text-xs text-red-600">
          {state.error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="rounded-md bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-sm ring-1 ring-border hover:bg-surface-muted disabled:opacity-50"
        >
          Annuler
        </button>
        <form action={formAction}>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Suppression...' : 'Confirmer'}
          </button>
        </form>
      </div>
    </div>
  );
}
