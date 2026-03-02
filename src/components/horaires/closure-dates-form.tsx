'use client';

import { useActionState } from 'react';
import { createClosureDateAction, deleteClosureDateAction } from '@/actions/schedule';
import type { ClosureDate } from '@/types';

type FormState = { success?: boolean; error?: string };
const initialState: FormState = {};

function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return createClosureDateAction(formData) as Promise<FormState>;
}

function formatDateFR(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type Props = {
  closures: ClosureDate[];
};

export function ClosureDatesForm({ closures }: Props) {
  const [state, dispatchAction, isPending] = useActionState(formAction, initialState);

  // Séparer passées vs futures
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = closures.filter((c) => c.end_date >= today);
  const past = closures.filter((c) => c.end_date < today);

  return (
    <div className="space-y-6">
      {/* Formulaire d'ajout */}
      <form action={dispatchAction} className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-prune">Ajouter une fermeture</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="start_date" className="block text-xs font-medium text-secondary">
              Du
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-xs font-medium text-secondary">
              Au
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              required
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
            />
          </div>
          <div>
            <label htmlFor="reason" className="block text-xs font-medium text-secondary">
              Motif
            </label>
            <input
              id="reason"
              name="reason"
              type="text"
              placeholder="Congés, formation…"
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
            />
          </div>
        </div>

        {state.error && (
          <p className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-600">{state.error}</p>
        )}
        {state.success && (
          <p className="mt-2 rounded-md bg-green-50 p-2 text-sm font-medium text-green-700">
            Fermeture ajoutée !
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-3 rounded-md bg-prune px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-prune-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Ajout…' : 'Ajouter'}
        </button>
      </form>

      {/* Liste des fermetures à venir */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-prune">Fermetures à venir</h3>
          <ul className="mt-2 space-y-2">
            {upcoming.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateFR(c.start_date)}
                    {c.start_date !== c.end_date && ` → ${formatDateFR(c.end_date)}`}
                  </p>
                  {c.reason && (
                    <p className="mt-0.5 text-xs text-secondary">{c.reason}</p>
                  )}
                </div>
                <form action={deleteClosureDateAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liste des fermetures passées */}
      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-secondary">Fermetures passées</h3>
          <ul className="mt-2 space-y-1">
            {past.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-4 py-2 opacity-60"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {formatDateFR(c.start_date)}
                    {c.start_date !== c.end_date && ` → ${formatDateFR(c.end_date)}`}
                  </p>
                  {c.reason && (
                    <p className="mt-0.5 text-xs text-secondary">{c.reason}</p>
                  )}
                </div>
                <form action={deleteClosureDateAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <p className="text-sm text-secondary">Aucune date de fermeture enregistrée.</p>
      )}
    </div>
  );
}
