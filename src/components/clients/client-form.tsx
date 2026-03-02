'use client';

import { useActionState } from 'react';
import type { Client } from '@/types';

type ClientFormProps = {
  action: (formData: FormData) => Promise<{ error: string } | void>;
  client?: Client;
  submitLabel: string;
};

const initialState = { error: '' };

export function ClientForm({ action, client, submitLabel }: ClientFormProps) {
  function formAction(
    _prevState: { error: string },
    formData: FormData,
  ) {
    return action(formData) as Promise<{ error: string }>;
  }

  const [state, dispatchAction, isPending] = useActionState(
    formAction,
    initialState,
  );

  return (
    <form action={dispatchAction} className="space-y-5">
      {/* Nom / Prénom */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-prune"
          >
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            defaultValue={client?.first_name ?? ''}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
          />
        </div>
        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-prune"
          >
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            defaultValue={client?.last_name ?? ''}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
          />
        </div>
      </div>

      {/* Téléphone / Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-prune"
          >
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={client?.phone ?? ''}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-prune"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ''}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
          />
        </div>
      </div>

      {/* Date d'anniversaire */}
      <div>
        <label
          htmlFor="birthday"
          className="block text-sm font-medium text-prune"
        >
          Date d&apos;anniversaire
        </label>
        <input
          id="birthday"
          name="birthday"
          type="date"
          defaultValue={client?.birthday ?? ''}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune sm:max-w-xs"
        />
        <p className="mt-1 text-xs text-secondary">
          Une réduction de 5€ est appliquée pendant le mois d&apos;anniversaire.
        </p>
      </div>

      {/* Adresse (domicile) */}
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-prune"
        >
          Adresse
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={client?.address ?? ''}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
        />
        <p className="mt-1 text-xs text-secondary">
          Utilisée uniquement pour les prestations à domicile.
        </p>
      </div>

      {/* Notes internes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-prune"
        >
          Notes internes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={client?.notes ?? ''}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
        />
      </div>

      {/* Error */}
      {state.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-prune px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-prune-light focus:outline-none focus:ring-2 focus:ring-prune focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Enregistrement…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
