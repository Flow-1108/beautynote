'use client';

import { useActionState } from 'react';
import type { CatalogueService } from '@/types';

const CATEGORIES = [
  'Épilation',
  'Forfait',
  'Onglerie',
  'Soins corps',
  'Soins visage',
  'Maquillage',
  'Coiffure femme',
  'Plus beauté',
];

type ServiceFormProps = {
  action: (formData: FormData) => Promise<{ error: string } | void>;
  service?: CatalogueService;
  submitLabel: string;
};

const initialState = { error: '' };

export function ServiceForm({ action, service, submitLabel }: ServiceFormProps) {
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
      {/* Nom */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-prune"
        >
          Nom du service <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={service?.name ?? ''}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
        />
      </div>

      {/* Catégorie */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-prune"
        >
          Catégorie <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={service?.category ?? ''}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
        >
          <option value="" disabled>
            Sélectionner une catégorie
          </option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Durée / Battement / Prix */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="duration_minutes"
            className="block text-sm font-medium text-prune"
          >
            Durée (min) <span className="text-red-500">*</span>
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={1}
            required
            defaultValue={service?.duration_minutes ?? ''}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
          />
        </div>
        <div>
          <label
            htmlFor="buffer_minutes"
            className="block text-sm font-medium text-prune"
          >
            Battement (min)
          </label>
          <input
            id="buffer_minutes"
            name="buffer_minutes"
            type="number"
            min={0}
            defaultValue={service?.buffer_minutes ?? 0}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
          />
          <p className="mt-1 text-xs text-secondary">
            Temps de préparation après la prestation.
          </p>
        </div>
        <div>
          <label
            htmlFor="base_price"
            className="block text-sm font-medium text-prune"
          >
            Prix (€) <span className="text-red-500">*</span>
          </label>
          <input
            id="base_price"
            name="base_price"
            type="number"
            min={0}
            step={0.01}
            required
            defaultValue={
              service ? (service.base_price_cents / 100).toFixed(2) : ''
            }
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-prune"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={service?.description ?? ''}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
        />
      </div>

      {/* Error */}
      {state.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      {/* Submit */}
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
