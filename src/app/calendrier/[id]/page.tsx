import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAppointmentById, completeAppointmentAction, cancelAppointmentAction } from '@/actions/appointments';
import { getPaymentByAppointment, initiateCardPaymentAction, recordCashPaymentAction, checkPaymentStatusAction } from '@/actions/payments';
import { formatCents, formatDate } from '@/lib/utils';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let appointment;
  try {
    appointment = await getAppointmentById(id);
  } catch {
    notFound();
  }

  const payment = await getPaymentByAppointment(id);

  const client = appointment.client as {
    id: string; first_name: string; last_name: string;
    phone: string | null; email: string | null;
  } | null;

  const service = appointment.service as {
    id: string; name: string; category: string;
    duration_minutes: number; buffer_minutes: number;
  } | null;

  const appointmentServices = (appointment.appointment_services ?? []) as {
    id: string;
    base_price_cents: number;
    duration_minutes: number;
    buffer_minutes: number;
    service: { id: string; name: string; category: string; duration_minutes: number; buffer_minutes: number };
  }[];

  const hasMultiServices = appointmentServices.length > 0;

  const statusLabels: Record<string, { label: string; color: string }> = {
    scheduled: { label: 'Planifié', color: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Terminé', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
  };

  const status = statusLabels[appointment.status] ?? statusLabels.scheduled;

  const completeWithId = async () => {
    'use server';
    await completeAppointmentAction(id);
  };

  const cancelWithId = async () => {
    'use server';
    await cancelAppointmentAction(id);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/calendrier"
        className="inline-flex items-center text-sm text-secondary hover:text-prune"
      >
        &larr; Retour au calendrier
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-prune">
            Rendez-vous
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            {appointment.forced_overlap && (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Chevauchement forcé
              </span>
            )}
            {appointment.is_home_service && (
              <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                Domicile
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {appointment.status === 'scheduled' && (
          <div className="flex items-center gap-2">
            <Link
              href={`/calendrier/${id}/modifier`}
              className="rounded-md bg-prune px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-prune-light"
            >
              Modifier
            </Link>
            <form action={completeWithId}>
              <button
                type="submit"
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500"
              >
                Terminer
              </button>
            </form>
            <form action={cancelWithId}>
              <button
                type="submit"
                className="rounded-md bg-surface px-3 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-border hover:bg-red-50"
              >
                Annuler
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="mt-6 rounded-lg border border-border bg-surface">
        <dl className="divide-y divide-border">
          {/* Client */}
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">Client</dt>
            <dd className="col-span-2 text-sm text-foreground">
              {client ? (
                <Link href={`/clients/${client.id}`} className="text-prune hover:underline">
                  {client.first_name} {client.last_name}
                </Link>
              ) : '—'}
            </dd>
          </div>

          {/* Service(s) */}
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">
              {hasMultiServices && appointmentServices.length > 1 ? 'Services' : 'Service'}
            </dt>
            <dd className="col-span-2 text-sm text-foreground">
              {hasMultiServices ? (
                <ul className="space-y-1">
                  {appointmentServices.map((as) => (
                    <li key={as.id}>
                      {as.service.name}
                      <span className="ml-1 text-xs text-secondary">
                        ({as.service.category} — {as.duration_minutes} min — {formatCents(as.base_price_cents)})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : service ? (
                `${service.name} (${service.category})`
              ) : '—'}
            </dd>
          </div>

          {/* Horaires */}
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">Date</dt>
            <dd className="col-span-2 text-sm text-foreground">
              {formatDate(appointment.starts_at)}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">Horaire</dt>
            <dd className="col-span-2 text-sm text-foreground">
              {formatTime(appointment.starts_at)} – {formatTime(appointment.ends_at)}
              {appointment.buffer_ends_at !== appointment.ends_at && (
                <span className="text-secondary">
                  {' '}(+ battement jusqu&apos;à {formatTime(appointment.buffer_ends_at)})
                </span>
              )}
            </dd>
          </div>

          {/* Tarification */}
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">Prix de base</dt>
            <dd className="col-span-2 text-sm text-foreground">
              {formatCents(appointment.base_price_cents)}
            </dd>
          </div>

          {appointment.birthday_discount_cents > 0 && (
            <div className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-sm font-medium text-amber-600">Réduction anniversaire</dt>
              <dd className="col-span-2 text-sm text-amber-600">
                -{formatCents(appointment.birthday_discount_cents)}
              </dd>
            </div>
          )}

          {appointment.loyalty_discount_cents > 0 && (
            <div className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-sm font-medium text-prune">
                Réduction fidélité ({appointment.loyalty_points_used} pts)
              </dt>
              <dd className="col-span-2 text-sm text-prune">
                -{formatCents(appointment.loyalty_discount_cents)}
              </dd>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-bold text-foreground">Prix final</dt>
            <dd className="col-span-2 text-sm font-bold text-foreground">
              {formatCents(appointment.final_price_cents)}
              {appointment.final_price_cents === 0 && (
                <span className="ml-1 text-xs font-normal text-green-600">(offert)</span>
              )}
            </dd>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-sm font-medium text-secondary">Notes</dt>
              <dd className="col-span-2 whitespace-pre-wrap text-sm text-foreground">
                {appointment.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Payment section */}
      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Paiement</h2>

        {payment?.status === 'success' ? (
          <div className="mt-3 rounded-md bg-green-50 p-3">
            <p className="text-sm font-medium text-green-700">
              Payé — {formatCents(payment.amount_cents)}
              {payment.method === 'card_sumup' && ' (Carte SumUp)'}
              {payment.method === 'cash' && ' (Espèces)'}
              {payment.method === 'free' && ' (Gratuit)'}
            </p>
            {payment.sumup_transaction_id && (
              <p className="mt-1 text-xs text-green-600">
                Réf. SumUp : {payment.sumup_transaction_id}
              </p>
            )}
          </div>
        ) : payment?.status === 'pending' ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-md bg-yellow-50 p-3">
              <p className="text-sm font-medium text-yellow-700">
                Paiement en attente sur le terminal SumUp…
              </p>
            </div>
            <form
              action={async () => {
                'use server';
                await checkPaymentStatusAction(id);
              }}
            >
              <button
                type="submit"
                className="rounded-md bg-surface px-3 py-2 text-sm font-medium text-prune shadow-sm ring-1 ring-border hover:bg-surface-muted"
              >
                Vérifier le statut
              </button>
            </form>
          </div>
        ) : payment?.status === 'failed' ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">Le paiement a échoué.</p>
            </div>
            {appointment.status === 'scheduled' && (
              <PaymentButtons appointmentId={id} />
            )}
          </div>
        ) : (
          /* Pas encore de paiement */
          appointment.status === 'scheduled' ? (
            <PaymentButtons appointmentId={id} />
          ) : appointment.status === 'cancelled' ? (
            <p className="mt-3 text-sm text-secondary">RDV annulé — aucun paiement.</p>
          ) : null
        )}
      </div>
    </div>
  );
}

function PaymentButtons({ appointmentId }: { appointmentId: string }) {
  const cardAction = async () => {
    'use server';
    await initiateCardPaymentAction(appointmentId);
  };

  const cashAction = async () => {
    'use server';
    await recordCashPaymentAction(appointmentId);
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <form action={cardAction}>
        <button
          type="submit"
          className="rounded-md bg-prune px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-prune-light"
        >
          Payer par carte (SumUp)
        </button>
      </form>
      <form action={cashAction}>
        <button
          type="submit"
          className="rounded-md bg-surface px-4 py-2 text-sm font-medium text-prune shadow-sm ring-1 ring-border hover:bg-surface-muted"
        >
          Payer en espèces
        </button>
      </form>
    </div>
  );
}
