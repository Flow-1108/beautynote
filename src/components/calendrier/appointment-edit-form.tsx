'use client';

import { useState, useEffect, useActionState } from 'react';
import { updateAppointmentAction } from '@/actions/appointments';
import { previewPricing } from '@/actions/pricing';
import { formatCents } from '@/lib/utils';
import { ClientSearch } from './client-search';
import { ServiceSearch } from './service-search';
import { useRouter } from 'next/navigation';
import type { Client, CatalogueService, PricingBreakdown, AppointmentWithRelations } from '@/types';

type Props = {
  appointmentId: string;
  appointment: AppointmentWithRelations;
  clients: Pick<Client, 'id' | 'first_name' | 'last_name'>[];
  services: Pick<CatalogueService, 'id' | 'name' | 'category' | 'duration_minutes' | 'buffer_minutes' | 'base_price_cents'>[];
};

type FormState = {
  error?: string;
  success?: boolean;
  overlap?: boolean;
  conflicts?: { id: string; starts_at: string; buffer_ends_at: string; client_first_name: string; client_last_name: string; service_name: string }[];
  message?: string;
};

const initialState: FormState = {};

export function AppointmentEditForm({ appointmentId, appointment, clients, services }: Props) {
  const router = useRouter();
  
  const formAction = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    return updateAppointmentAction(appointmentId, formData) as Promise<FormState>;
  };

  const [state, dispatchAction, isPending] = useActionState(formAction, initialState);

  // Extraire les IDs des services existants
  const existingServiceIds = appointment.appointment_services?.map(as => as.service_id) ?? [];

  // Sélections pour la prévisualisation
  const [clientId, setClientId] = useState(appointment.client_id);
  const [serviceIds, setServiceIds] = useState<string[]>(existingServiceIds);
  const [loyaltyPoints, setLoyaltyPoints] = useState(appointment.loyalty_points_used);
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [forceOverlap, setForceOverlap] = useState(false);

  // Date et heure initiales
  const appointmentDate = new Date(appointment.starts_at);
  const [date, setDate] = useState(appointmentDate.toISOString().slice(0, 10));
  const [time, setTime] = useState(
    appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  // Rediriger après succès
  useEffect(() => {
    if (state.success) {
      router.push(`/calendrier/${appointmentId}`);
    }
  }, [state.success, appointmentId, router]);

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

  // Reset forceOverlap quand on change de paramètres
  useEffect(() => {
    setForceOverlap(false);
  }, [clientId, serviceIds]);

  return (
    <form action={dispatchAction} className="space-y-5">
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
        <input type="hidden" name="client_id" value={clientId} />
      </div>

      {/* Services */}
      <div>
        <label className="block text-sm font-medium text-prune">
          Service(s) <span className="text-red-500">*</span>
        </label>
        <ServiceSearch
          services={services}
          selectedIds={serviceIds}
          onChange={setServiceIds}
        />
      </div>

      {/* Date et Heure */}
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

      {/* Hidden: starts_at combiné par JS dans un hidden field */}
      <input type="hidden" name="starts_at" id="starts_at_hidden" />

      {/* Domicile */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_home_service"
          name="is_home_service"
          defaultChecked={appointment.is_home_service}
          className="h-4 w-4 rounded border-border text-prune focus:ring-prune"
        />
        <label htmlFor="is_home_service" className="text-sm text-foreground">
          Prestation à domicile
        </label>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-prune">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={appointment.notes ?? ''}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
        />
      </div>

      {/* Aperçu tarification */}
      {pricingLoading && (
        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <p className="text-sm text-secondary">Calcul en cours…</p>
        </div>
      )}

      {pricing && !pricingLoading && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold text-prune">Aperçu tarification</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-secondary">Prix de base</dt>
              <dd className="font-medium text-foreground">{formatCents(pricing.base_price_cents)}</dd>
            </div>
            {pricing.is_birthday_month && (
              <div className="flex justify-between text-green-700">
                <dt>Réduction anniversaire</dt>
                <dd className="font-medium">-{formatCents(pricing.birthday_discount_cents)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-secondary">
                Points disponibles : {pricing.loyalty_points_available}
              </dt>
              <dd className="text-xs text-secondary">
                Max utilisable : {pricing.max_loyalty_points_usable}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="loyalty_points_to_spend" className="text-secondary">
                Utiliser
              </label>
              <input
                type="range"
                id="loyalty_points_to_spend"
                name="loyalty_points_to_spend"
                min={0}
                max={pricing.max_loyalty_points_usable}
                step={100}
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-foreground">{loyaltyPoints} points</span>
            </div>
            {pricing.loyalty_discount_cents > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>Réduction fidélité</dt>
                <dd className="font-medium">-{formatCents(pricing.loyalty_discount_cents)}</dd>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-border pt-2">
              <dt className="font-semibold text-prune">Prix final</dt>
              <dd className="text-lg font-bold text-prune">{formatCents(pricing.final_price_cents)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-secondary">
            Durée totale avec battement : {totalMinutes} min
          </p>
        </div>
      )}

      {/* Erreur */}
      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {/* Chevauchement */}
      {state.overlap && state.conflicts && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-800">{state.message}</p>
          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
            {state.conflicts.map((c) => (
              <li key={c.id}>
                {c.client_first_name} {c.client_last_name} — {c.service_name} (
                {new Date(c.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} →{' '}
                {new Date(c.buffer_ends_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="force_overlap"
              name="force_overlap"
              value="true"
              checked={forceOverlap}
              onChange={(e) => setForceOverlap(e.target.checked)}
              className="h-4 w-4 rounded border-border text-prune focus:ring-prune"
            />
            <label htmlFor="force_overlap" className="text-sm font-medium text-yellow-800">
              Je confirme vouloir créer ce RDV malgré le chevauchement
            </label>
          </div>
        </div>
      )}

      {/* Bouton submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          onClick={(e) => {
            const form = e.currentTarget.form;
            if (form) {
              const date = (form.elements.namedItem('date') as HTMLInputElement).value;
              const time = (form.elements.namedItem('time') as HTMLInputElement).value;
              (form.elements.namedItem('starts_at') as HTMLInputElement).value = `${date}T${time}:00`;
            }
          }}
          className="flex-1 rounded-md bg-prune px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-prune-light focus:outline-none focus:ring-2 focus:ring-prune focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Modification en cours…' : 'Enregistrer les modifications'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-prune hover:bg-surface-muted"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
