'use client';

import { useState, useEffect, useActionState } from 'react';
import { createAppointmentAction } from '@/actions/appointments';
import { previewPricing } from '@/actions/pricing';
import { formatCents, formatTime, formatDateKey } from '@/lib/utils';
import { ClientSearch } from './client-search';
import { ServiceSearch } from './service-search';
import type { Client, CatalogueService, PricingBreakdown } from '@/types';

type Props = {
  clients: Pick<Client, 'id' | 'first_name' | 'last_name'>[];
  services: Pick<CatalogueService, 'id' | 'name' | 'category' | 'duration_minutes' | 'buffer_minutes' | 'base_price_cents'>[];
  defaultDate?: string;
};

type FormState = {
  error?: string;
  success?: boolean;
  appointmentId?: string;
  overlap?: boolean;
  conflicts?: { id: string; starts_at: string; buffer_ends_at: string; client_first_name: string; client_last_name: string; service_name: string }[];
  closedDate?: boolean;
  reason?: string;
  message?: string;
};

const initialState: FormState = {};

function formAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return createAppointmentAction(formData) as Promise<FormState>;
}

export function AppointmentForm({ clients, services, defaultDate }: Props) {
  const [state, dispatchAction, isPending] = useActionState(formAction, initialState);

  // Sélections pour la prévisualisation
  const [clientId, setClientId] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [forceOverlap, setForceOverlap] = useState(false);
  const [forceClosedDate, setForceClosedDate] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState(false);
  const today = defaultDate ?? formatDateKey(new Date().toISOString());
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('09:00');

  // Reset le formulaire après création réussie
  useEffect(() => {
    if (state.success) {
      setClientId('');
      setServiceIds([]);
      setLoyaltyPoints(0);
      setPricing(null);
      setForceOverlap(false);
      setDate(today);
      setTime('09:00');
      setFormKey((k) => k + 1);
      setSuccessMsg(true);
      const timer = setTimeout(() => setSuccessMsg(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.appointmentId]);

  // Charger la prévisualisation quand client + au moins 1 service sélectionnés
  useEffect(() => {
    if (!clientId || serviceIds.length === 0) {
      setPricing(null);
      return;
    }

    setPricingLoading(true);
    previewPricing(serviceIds, clientId, loyaltyPoints)
      .then(setPricing)
      .catch(() => setPricing(null))
      .finally(() => setPricingLoading(false));
  }, [clientId, serviceIds, loyaltyPoints]);

  // Calculer la durée totale pour info
  const selectedServices = services.filter((s) => serviceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  const maxBuffer = selectedServices.length > 0 ? Math.max(...selectedServices.map((s) => s.buffer_minutes)) : 0;
  const totalMinutes = totalDuration + maxBuffer;

  // Reset forceOverlap et forceClosedDate quand on change de paramètres
  useEffect(() => {
    setForceOverlap(false);
    setForceClosedDate(false);
  }, [clientId, serviceIds, date]);

  return (
    <>
      {/* Message de confirmation */}
      {successMsg && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-700">
            Rendez-vous créé avec succès !
          </p>
        </div>
      )}

    <form key={formKey} action={dispatchAction} className="space-y-5">
      {/* Client */}
      <div>
        <label className="block text-sm font-medium text-prune">
          Client <span className="text-red-500">*</span>
        </label>
        <ClientSearch
          clients={clients}
          value={clientId}
          onChange={setClientId}
        />
      </div>

      {/* Service */}
      <div>
        <label className="block text-sm font-medium text-prune">
          Service <span className="text-red-500">*</span>
        </label>
        <ServiceSearch
          services={services}
          selectedIds={serviceIds}
          onChange={(ids) => {
            setServiceIds(ids);
            setLoyaltyPoints(0);
          }}
        />
        {selectedServices.length > 0 && (
          <p className="mt-1 text-xs text-secondary">
            Durée totale avec battement : {totalMinutes} min
          </p>
        )}
      </div>

      {/* Date / Heure */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-prune">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-prune">
            Heure <span className="text-red-500">*</span>
          </label>
          <input
            id="time"
            name="time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            step={300}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
          />
        </div>
      </div>

      {/* Domicile */}
      <div className="flex items-center gap-2">
        <input
          id="is_home_service"
          name="is_home_service"
          type="checkbox"
          className="h-4 w-4 rounded border-border text-prune focus:ring-prune"
        />
        <label htmlFor="is_home_service" className="text-sm text-prune">
          Prestation à domicile
        </label>
      </div>

      {/* Pricing preview */}
      {pricing && (
        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <h3 className="text-sm font-semibold text-foreground">
            Aperçu tarification
          </h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-secondary">Prix de base</dt>
              <dd className="font-medium">{formatCents(pricing.base_price_cents)}</dd>
            </div>

            {pricing.is_birthday_month && (
              <div className="flex justify-between text-amber-700">
                <dt>Réduction anniversaire</dt>
                <dd className="font-medium">-{formatCents(pricing.birthday_discount_cents)}</dd>
              </div>
            )}

            {pricing.loyalty_points_available > 0 && (
              <div className="mt-2 border-t border-border pt-2">
                <div className="flex items-center justify-between">
                  <dt className="text-secondary">
                    Points disponibles : {pricing.loyalty_points_available}
                  </dt>
                  <dd className="text-xs text-secondary">
                    Max utilisable : {pricing.max_loyalty_points_usable}
                  </dd>
                </div>
                <div className="mt-1">
                  <label htmlFor="loyalty_slider" className="sr-only">
                    Points à utiliser
                  </label>
                  <input
                    id="loyalty_slider"
                    type="range"
                    min={0}
                    max={pricing.max_loyalty_points_usable}
                    step={100}
                    value={loyaltyPoints}
                    onChange={(e) => setLoyaltyPoints(parseInt(e.target.value, 10))}
                    className="w-full accent-prune"
                  />
                  <p className="text-xs text-secondary">
                    Utiliser <strong>{loyaltyPoints}</strong> points
                    {loyaltyPoints > 0 && (
                      <> → réduction de <strong>{formatCents(pricing.loyalty_discount_cents)}</strong></>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>Prix final</dt>
              <dd className={pricing.final_price_cents === 0 ? 'text-green-600' : 'text-foreground'}>
                {formatCents(pricing.final_price_cents)}
                {pricing.final_price_cents === 0 && (
                  <span className="ml-1 text-xs font-normal">(offert)</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {pricingLoading && (
        <p className="text-sm text-secondary">Calcul du prix…</p>
      )}

      <input type="hidden" name="loyalty_points_to_spend" value={loyaltyPoints} />

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-prune">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
        />
      </div>

      {/* Date fermée */}
      {state.closedDate && (
        <div className="rounded-md border border-orange-300 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-orange-800">{state.message}</p>
          <p className="mt-1 text-sm text-orange-700">{state.reason}</p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="force_closed_date"
              name="force_closed_date"
              value="true"
              checked={forceClosedDate}
              onChange={(e) => setForceClosedDate(e.target.checked)}
              className="h-4 w-4 rounded border-border text-prune focus:ring-prune"
            />
            <label htmlFor="force_closed_date" className="text-sm font-medium text-orange-800">
              Je confirme vouloir créer ce RDV malgré la fermeture
            </label>
          </div>
        </div>
      )}

      {/* Overlap warning */}
      {state.overlap && state.conflicts && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">{state.message}</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {state.conflicts.map((c) => (
              <li key={c.id}>
                {c.client_first_name} {c.client_last_name} — {c.service_name}
                {' '}({formatTime(c.starts_at)} - {formatTime(c.buffer_ends_at)})
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="force_confirm"
              checked={forceOverlap}
              onChange={(e) => setForceOverlap(e.target.checked)}
              className="h-4 w-4 rounded border-border text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="force_confirm" className="text-sm font-medium text-amber-800">
              Je confirme vouloir créer ce RDV malgré le chevauchement
            </label>
          </div>
        </div>
      )}

      <input type="hidden" name="force_overlap" value={forceOverlap ? 'true' : 'false'} />

      {/* Error */}
      {state.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-prune px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-prune-light focus:outline-none focus:ring-2 focus:ring-prune focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Création en cours…' : 'Créer le rendez-vous'}
      </button>
    </form>
    </>
  );
}
