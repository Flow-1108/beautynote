import Link from 'next/link';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Users, Sparkles, CalendarDays, CreditCard, Clock, TrendingUp } from 'lucide-react';
import { getCurrentMonthRevenue } from '@/actions/payments';
import { getUpcomingWeekAppointments } from '@/actions/appointments';
import { formatCents } from '@/lib/utils';

export default async function DashboardPage() {
  const [revenue, upcomingAppointments] = await Promise.all([
    getCurrentMonthRevenue(),
    getUpcomingWeekAppointments(),
  ]);

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <DashboardShell>
      <h1 className="text-2xl font-bold text-prune">Tableau de bord</h1>
      <p className="mt-1 text-sm text-secondary">
        Bienvenue sur BeautyNote
      </p>

      {/* CA du mois */}
      <div className="mt-6 rounded-lg border border-border bg-gradient-to-r from-prune to-prune-light p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <h2 className="text-lg font-semibold capitalize">CA de {currentMonth}</h2>
        </div>
        <div className="mt-3 flex items-baseline gap-4">
          <p className="text-4xl font-bold">{formatCents(revenue.total)}</p>
          <p className="text-sm opacity-90">{revenue.count} paiement{revenue.count !== 1 ? 's' : ''} réussi{revenue.count !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Quick access cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/clients"
          className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <Users className="h-4 w-4" />
            Clients
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground group-hover:text-prune">
            Gérer les clients &rarr;
          </p>
        </Link>

        <Link
          href="/services"
          className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <Sparkles className="h-4 w-4" />
            Services
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground group-hover:text-prune">
            Catalogue &rarr;
          </p>
        </Link>

        <Link
          href="/calendrier"
          className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <CalendarDays className="h-4 w-4" />
            Calendrier
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground group-hover:text-prune">
            Rendez-vous &rarr;
          </p>
        </Link>

        <Link
          href="/paiements"
          className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <CreditCard className="h-4 w-4" />
            Paiements
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground group-hover:text-prune">
            Historique &rarr;
          </p>
        </Link>

        <Link
          href="/horaires"
          className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <Clock className="h-4 w-4" />
            Horaires
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground group-hover:text-prune">
            Gérer les horaires &rarr;
          </p>
        </Link>
      </div>

      {/* RDV de la semaine à venir */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-prune">Rendez-vous de la semaine</h2>
        {upcomingAppointments.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">Aucun rendez-vous prévu cette semaine</p>
        ) : (
          <div className="mt-3 space-y-2">
            {upcomingAppointments.map((apt: any) => {
              const client = apt.client as { id: string; first_name: string; last_name: string } | null;
              const services = apt.appointment_services ?? [];
              const serviceNames = services.map((as: any) => as.service?.name).filter(Boolean).join(', ');
              const date = new Date(apt.starts_at);
              const isToday = date.toDateString() === new Date().toDateString();

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
                          {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        {isToday && (
                          <span className="inline-flex rounded-full bg-prune px-2 py-0.5 text-xs font-medium text-white">
                            Aujourd'hui
                          </span>
                        )}
                        {apt.is_home_service && (
                          <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            Domicile
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-secondary">
                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} —{' '}
                        {client ? `${client.first_name} ${client.last_name}` : 'Client inconnu'}
                      </p>
                      <p className="mt-1 text-sm text-prune">{serviceNames}</p>
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
    </DashboardShell>
  );
}
