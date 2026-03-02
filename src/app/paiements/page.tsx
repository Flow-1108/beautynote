import Link from 'next/link';
import { getPayments } from '@/actions/payments';
import { formatCents, formatDate } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  success: { label: 'Payé', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulé', color: 'bg-surface-muted text-secondary' },
};

const methodLabels: Record<string, string> = {
  card_sumup: 'Carte (SumUp)',
  cash: 'Espèces',
  free: 'Gratuit',
};

export default async function PaiementsPage() {
  const payments = await getPayments();

  // Grouper les paiements par mois
  const paymentsByMonth = payments.reduce((acc, payment) => {
    const date = new Date(payment.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        payments: [],
        total: 0,
        totalSuccess: 0,
      };
    }
    
    acc[monthKey].payments.push(payment);
    acc[monthKey].total += payment.amount_cents;
    if (payment.status === 'success') {
      acc[monthKey].totalSuccess += payment.amount_cents;
    }
    
    return acc;
  }, {} as Record<string, { payments: typeof payments; total: number; totalSuccess: number }>);

  // Trier les mois du plus récent au plus ancien
  const sortedMonths = Object.keys(paymentsByMonth).sort((a, b) => b.localeCompare(a));

  // Calculer le total général
  const grandTotal = payments.reduce((sum, p) => sum + (p.status === 'success' ? p.amount_cents : 0), 0);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-prune">Paiements</h1>
          <p className="mt-1 text-sm text-secondary">
            Historique des {payments.length} dernier{payments.length !== 1 ? 's' : ''} paiement{payments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-secondary">CA Total</p>
          <p className="mt-1 text-2xl font-bold text-prune">{formatCents(grandTotal)}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="mt-8 text-center text-sm text-secondary">
          Aucun paiement enregistré.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {sortedMonths.map((monthKey) => {
            const monthData = paymentsByMonth[monthKey];
            const [year, month] = monthKey.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            });

            return (
              <div key={monthKey}>
                {/* En-tête du mois avec récap CA */}
                <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-border bg-surface-muted px-4 py-3">
                  <h2 className="text-lg font-semibold capitalize text-prune">{monthName}</h2>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-secondary">CA du mois</p>
                      <p className="text-lg font-bold text-green-600">{formatCents(monthData.totalSuccess)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-secondary">Total facturé</p>
                      <p className="text-lg font-bold text-prune">{formatCents(monthData.total)}</p>
                    </div>
                  </div>
                </div>

                {/* Table des paiements du mois */}
                <div className="overflow-hidden rounded-b-lg border border-border bg-surface">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-surface-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary">
                          Client
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary">
                          Service
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary">
                          Montant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary">
                          Méthode
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {monthData.payments.map((payment: any) => {
                        const apt = payment.appointment as {
                          id: string;
                          starts_at: string;
                          final_price_cents: number;
                          client: { id: string; first_name: string; last_name: string } | null;
                          appointment_services?: { id: string; service: { id: string; name: string } }[];
                        } | null;

                        const status = statusLabels[payment.status] ?? statusLabels.pending;
                        
                        // Récupérer les noms des services
                        const serviceNames = apt?.appointment_services
                          ?.map(as => as.service?.name)
                          .filter(Boolean)
                          .join(', ') || '—';

                        return (
                          <tr key={payment.id} className="hover:bg-surface-muted">
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                              {formatDate(payment.created_at)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                              {apt?.client ? (
                                <Link
                                  href={`/clients/${apt.client.id}`}
                                  className="text-prune hover:underline"
                                >
                                  {apt.client.first_name} {apt.client.last_name}
                                </Link>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                              {serviceNames}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                              {formatCents(payment.amount_cents)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-secondary">
                              {methodLabels[payment.method] ?? payment.method}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                              >
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
