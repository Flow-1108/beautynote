import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClientById, getClientHistory, getClientStats } from '@/actions/clients';
import { formatPhone, formatDate, formatCents, formatTime, isBirthdayMonth, getInitials } from '@/lib/utils';
import { DeleteClientButton } from '@/components/clients/delete-client-button';
import { EditLoyaltyButton } from '@/components/clients/edit-loyalty-button';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let client;
  try {
    client = await getClientById(id);
  } catch {
    notFound();
  }

  const [history, stats] = await Promise.all([
    getClientHistory(id),
    getClientStats(id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back link */}
      <Link
        href="/clients"
        className="inline-flex items-center text-sm text-secondary hover:text-prune"
      >
        &larr; Retour aux clients
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-lg font-bold text-prune">
            {getInitials(client.first_name, client.last_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-prune">
              {client.first_name} {client.last_name}
            </h1>
            {isBirthdayMonth(client.birthday) && (
              <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Mois d&apos;anniversaire — Réduction 5€
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/modifier`}
            className="rounded-md bg-surface px-3 py-2 text-sm font-medium text-prune shadow-sm ring-1 ring-border hover:bg-surface-muted"
          >
            Modifier
          </Link>
          <DeleteClientButton clientId={id} />
        </div>
      </div>

      {/* Info card */}
      <div className="mt-6 rounded-lg border border-border bg-surface">
        <dl className="divide-y divide-border">
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">Téléphone</dt>
            <dd className="col-span-2 text-sm text-foreground">
              {client.phone ? formatPhone(client.phone) : '—'}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">Email</dt>
            <dd className="col-span-2 text-sm text-foreground">
              {client.email ?? '—'}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">Anniversaire</dt>
            <dd className="col-span-2 text-sm text-foreground">
              {client.birthday ? formatDate(client.birthday) : '—'}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">Adresse</dt>
            <dd className="col-span-2 text-sm text-foreground">
              {client.address ?? '—'}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">
              Points de fidélité
            </dt>
            <dd className="col-span-2 flex items-center text-sm font-semibold text-prune">
              {client.loyalty_points} points
              <EditLoyaltyButton clientId={id} currentPoints={client.loyalty_points} />
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">Notes</dt>
            <dd className="col-span-2 whitespace-pre-wrap text-sm text-foreground">
              {client.notes ?? '—'}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-secondary">
              Client depuis
            </dt>
            <dd className="col-span-2 text-sm text-foreground">
              {formatDate(client.created_at)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Statistiques */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-prune">Statistiques</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-secondary">Total dépensé</p>
            <p className="mt-1 text-2xl font-bold text-prune">{formatCents(stats.totalSpent)}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-secondary">RDV terminés</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{stats.totalCompleted}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-secondary">RDV planifiés</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.totalScheduled}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-secondary">Points utilisés</p>
            <p className="mt-1 text-2xl font-bold text-secondary">{stats.totalLoyaltyUsed}</p>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-prune">Historique des rendez-vous</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">Aucun rendez-vous pour le moment</p>
        ) : (
          <div className="mt-3 space-y-3">
            {history.map((apt: any) => {
              const services = apt.appointment_services ?? [];
              const serviceNames = services.map((as: any) => as.service?.name).filter(Boolean).join(', ');
              const payment = Array.isArray(apt.payment) ? apt.payment[0] : apt.payment;
              
              const statusLabels: Record<string, { label: string; color: string }> = {
                scheduled: { label: 'Planifié', color: 'bg-blue-100 text-blue-700' },
                completed: { label: 'Terminé', color: 'bg-green-100 text-green-700' },
                cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
              };
              const status = statusLabels[apt.status] || { label: apt.status, color: 'bg-gray-100 text-gray-700' };

              const paymentLabels: Record<string, string> = {
                pending: 'En attente',
                completed: 'Payé',
                failed: 'Échec',
              };

              return (
                <Link
                  key={apt.id}
                  href={`/calendrier/${apt.id}`}
                  className="block rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {new Date(apt.starts_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        {apt.is_home_service && (
                          <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            Domicile
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-secondary">
                        {formatTime(apt.starts_at)} →{' '}
                        {formatTime(apt.ends_at)}
                      </p>
                      <p className="mt-1 text-sm text-prune">{serviceNames}</p>
                      {payment && (
                        <p className="mt-1 text-xs text-secondary">
                          Paiement : {paymentLabels[payment.status] || payment.status}
                          {payment.method && ` (${payment.method === 'card' ? 'Carte' : 'Espèces'})`}
                        </p>
                      )}
                      {apt.loyalty_points_used > 0 && (
                        <p className="mt-1 text-xs text-green-600">
                          {apt.loyalty_points_used} points utilisés
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-prune">{formatCents(apt.final_price_cents)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
