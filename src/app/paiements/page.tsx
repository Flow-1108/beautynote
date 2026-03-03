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

const SUMUP_FEE_RATE = 0.0175; // 1.75%

type MonthStats = {
  payments: any[];
  totalBrut: number;
  cardBrut: number;
  cashBrut: number;
  cardNet: number;
  sumupFees: number;
};

export default async function PaiementsPage() {
  const payments = await getPayments();

  // Grouper les paiements par mois avec calculs détaillés
  const paymentsByMonth = payments.reduce((acc, payment) => {
    const date = new Date(payment.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        payments: [],
        totalBrut: 0,
        cardBrut: 0,
        cashBrut: 0,
        cardNet: 0,
        sumupFees: 0,
      };
    }
    
    acc[monthKey].payments.push(payment);
    
    if (payment.status === 'success') {
      const amount = payment.amount_cents;
      acc[monthKey].totalBrut += amount;
      
      if (payment.method === 'card_sumup') {
        acc[monthKey].cardBrut += amount;
        const fees = Math.round(amount * SUMUP_FEE_RATE);
        acc[monthKey].sumupFees += fees;
        acc[monthKey].cardNet += (amount - fees);
      } else if (payment.method === 'cash') {
        acc[monthKey].cashBrut += amount;
      }
    }
    
    return acc;
  }, {} as Record<string, MonthStats>);

  // Grouper par année pour récap annuel
  const paymentsByYear = payments.reduce((acc, payment) => {
    const date = new Date(payment.created_at);
    const year = date.getFullYear().toString();
    
    if (!acc[year]) {
      acc[year] = {
        totalBrut: 0,
        cardBrut: 0,
        cashBrut: 0,
        cardNet: 0,
        sumupFees: 0,
      };
    }
    
    if (payment.status === 'success') {
      const amount = payment.amount_cents;
      acc[year].totalBrut += amount;
      
      if (payment.method === 'card_sumup') {
        acc[year].cardBrut += amount;
        const fees = Math.round(amount * SUMUP_FEE_RATE);
        acc[year].sumupFees += fees;
        acc[year].cardNet += (amount - fees);
      } else if (payment.method === 'cash') {
        acc[year].cashBrut += amount;
      }
    }
    
    return acc;
  }, {} as Record<string, Omit<MonthStats, 'payments'>>);

  // Trier les mois du plus récent au plus ancien
  const sortedMonths = Object.keys(paymentsByMonth).sort((a, b) => b.localeCompare(a));
  const sortedYears = Object.keys(paymentsByYear).sort((a, b) => b.localeCompare(a));

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
          <p className="text-sm text-secondary">CA Total Brut</p>
          <p className="mt-1 text-2xl font-bold text-prune">{formatCents(grandTotal)}</p>
        </div>
      </div>

      {/* Récap annuel */}
      {sortedYears.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-prune">Récapitulatif par année</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedYears.map((year) => {
              const yearData = paymentsByYear[year];
              const totalNet = yearData.cardNet + yearData.cashBrut;
              
              return (
                <div key={year} className="rounded-lg border border-border bg-surface p-4">
                  <h3 className="text-xl font-bold text-prune">{year}</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary">CA Brut</span>
                      <span className="font-semibold text-foreground">{formatCents(yearData.totalBrut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">• Carte bancaire</span>
                      <span className="text-foreground">{formatCents(yearData.cardBrut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">• Espèces</span>
                      <span className="text-foreground">{formatCents(yearData.cashBrut)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="text-secondary">Frais SumUp (1,75%)</span>
                      <div className="text-right">
                        <span className="text-red-600">-{formatCents(yearData.sumupFees)}</span>
                        <span className="ml-2 text-xs text-gray-400">({formatCents(yearData.cardBrut)} × 1,75% = {formatCents(yearData.sumupFees)})</span>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-semibold text-prune">CA Net</span>
                      <span className="text-lg font-bold text-green-600">{formatCents(totalNet)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                {/* En-tête du mois avec récap CA détaillé */}
                <div className="rounded-t-lg border border-b-0 border-border bg-surface-muted px-4 py-3">
                  <h2 className="text-lg font-semibold capitalize text-prune">{monthName}</h2>
                  <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <div>
                      <p className="text-xs text-secondary">CA Brut</p>
                      <p className="text-base font-bold text-prune">{formatCents(monthData.totalBrut)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">CB Brut</p>
                      <p className="text-base font-semibold text-foreground">{formatCents(monthData.cardBrut)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Espèces</p>
                      <p className="text-base font-semibold text-foreground">{formatCents(monthData.cashBrut)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Frais SumUp</p>
                      <p className="text-base font-semibold text-red-600">-{formatCents(monthData.sumupFees)}</p>
                      <p className="text-xs text-gray-400">({formatCents(monthData.cardBrut)} × 1,75% = {formatCents(monthData.sumupFees)})</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">CA Net</p>
                      <p className="text-base font-bold text-green-600">{formatCents(monthData.cardNet + monthData.cashBrut)}</p>
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
