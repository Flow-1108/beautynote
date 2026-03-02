import Link from 'next/link';
import { getClients } from '@/actions/clients';
import { getServices } from '@/actions/services';
import { AppointmentForm } from '@/components/calendrier/appointment-form';

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const [clients, services] = await Promise.all([
    getClients(),
    getServices(),
  ]);

  // Filtrer uniquement les services actifs
  const activeServices = services.filter((s: { is_active: boolean }) => s.is_active);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/calendrier${date ? `?date=${date}` : ''}`}
        className="inline-flex items-center text-sm text-secondary hover:text-prune"
      >
        &larr; Retour au calendrier
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-prune">
        Nouveau rendez-vous
      </h1>

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <AppointmentForm
          clients={clients}
          services={activeServices}
          defaultDate={date}
        />
      </div>
    </div>
  );
}
