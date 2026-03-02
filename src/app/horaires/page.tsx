import { getBusinessHours, getClosureDates } from '@/actions/schedule';
import { BusinessHoursForm } from '@/components/horaires/business-hours-form';
import { ClosureDatesForm } from '@/components/horaires/closure-dates-form';

export default async function HorairesPage() {
  const [hours, closures] = await Promise.all([
    getBusinessHours(),
    getClosureDates(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Horaires d'ouverture */}
      <section>
        <h1 className="text-2xl font-bold text-prune">Horaires d&apos;ouverture</h1>
        <p className="mt-1 text-sm text-secondary">
          Définissez vos jours et heures d&apos;ouverture habituels.
        </p>
        <div className="mt-4">
          <BusinessHoursForm hours={hours} />
        </div>
      </section>

      {/* Dates de fermeture */}
      <section>
        <h1 className="text-2xl font-bold text-prune">Fermetures &amp; Congés</h1>
        <p className="mt-1 text-sm text-secondary">
          Ajoutez des périodes de fermeture exceptionnelle ou de congés.
        </p>
        <div className="mt-4">
          <ClosureDatesForm closures={closures} />
        </div>
      </section>
    </div>
  );
}
