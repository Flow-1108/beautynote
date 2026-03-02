import { getAppointmentById } from '@/actions/appointments';
import { createClient } from '@/lib/supabase/server';
import { AppointmentEditForm } from '@/components/calendrier/appointment-edit-form';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModifierAppointmentPage({ params }: Props) {
  const { id } = await params;
  const appointment = await getAppointmentById(id);

  if (!appointment) {
    notFound();
  }

  // Charger clients et services pour les dropdowns
  const supabase = await createClient();
  
  const [{ data: clients }, { data: services }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, first_name, last_name')
      .order('last_name'),
    supabase
      .from('catalogue_services')
      .select('id, name, category, duration_minutes, buffer_minutes, base_price_cents')
      .eq('is_active', true)
      .order('category, name'),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-prune">Modifier le rendez-vous</h1>
      <p className="mt-1 text-sm text-secondary">
        Modifiez les informations du rendez-vous
      </p>

      <div className="mt-6">
        <AppointmentEditForm
          appointmentId={id}
          appointment={appointment}
          clients={clients ?? []}
          services={services ?? []}
        />
      </div>
    </div>
  );
}
