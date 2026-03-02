import Link from 'next/link';
import { createServiceAction } from '@/actions/services';
import { ServiceForm } from '@/components/services/service-form';

export default function NewServicePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/services"
        className="inline-flex items-center text-sm text-secondary hover:text-prune"
      >
        &larr; Retour au catalogue
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-prune">
        Nouveau service
      </h1>

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <ServiceForm
          action={createServiceAction}
          submitLabel="Créer le service"
        />
      </div>
    </div>
  );
}
