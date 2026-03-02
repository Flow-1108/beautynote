'use client';

import { useState, useActionState } from 'react';
import { updateBusinessHoursAction } from '@/actions/schedule';
import type { BusinessHours } from '@/types';

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

type FormState = { success?: boolean; error?: string };
const initialState: FormState = {};

function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return updateBusinessHoursAction(formData) as Promise<FormState>;
}

type Props = {
  hours: BusinessHours[];
};

export function BusinessHoursForm({ hours }: Props) {
  const [state, dispatchAction, isPending] = useActionState(formAction, initialState);

  // Local state for each day
  const [days, setDays] = useState(
    DAY_LABELS.map((_, i) => {
      const row = hours.find((h) => h.day_of_week === i);
      return {
        isOpen: row?.is_open ?? true,
        openTime: row?.open_time?.slice(0, 5) ?? '09:00',
        closeTime: row?.close_time?.slice(0, 5) ?? '18:00',
      };
    }),
  );

  function updateDay(index: number, field: 'isOpen' | 'openTime' | 'closeTime', value: string | boolean) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  }

  return (
    <form action={dispatchAction} className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              <th className="px-4 py-2.5 text-left font-medium text-prune">Jour</th>
              <th className="px-4 py-2.5 text-center font-medium text-prune">Ouvert</th>
              <th className="px-4 py-2.5 text-center font-medium text-prune">Ouverture</th>
              <th className="px-4 py-2.5 text-center font-medium text-prune">Fermeture</th>
            </tr>
          </thead>
          <tbody>
            {DAY_LABELS.map((label, i) => (
              <tr key={i} className="border-b border-border last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-foreground">{label}</td>
                <td className="px-4 py-2.5 text-center">
                  <input type="hidden" name={`is_open_${i}`} value={days[i].isOpen ? 'true' : 'false'} />
                  <button
                    type="button"
                    onClick={() => updateDay(i, 'isOpen', !days[i].isOpen)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      days[i].isOpen ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    aria-label={days[i].isOpen ? 'Ouvert' : 'Fermé'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        days[i].isOpen ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <input
                    name={`open_time_${i}`}
                    type="time"
                    value={days[i].openTime}
                    onChange={(e) => updateDay(i, 'openTime', e.target.value)}
                    disabled={!days[i].isOpen}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-center focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-2.5 text-center">
                  <input
                    name={`close_time_${i}`}
                    type="time"
                    value={days[i].closeTime}
                    onChange={(e) => updateDay(i, 'closeTime', e.target.value)}
                    disabled={!days[i].isOpen}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-center focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.success && (
        <p className="rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
          Horaires enregistrés avec succès !
        </p>
      )}
      {state.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-prune px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-prune-light focus:outline-none focus:ring-2 focus:ring-prune focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer les horaires'}
      </button>
    </form>
  );
}
