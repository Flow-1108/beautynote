import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServiceById, updateServiceAction } from '@/actions/services';
import { ServiceForm } from '@/components/services/service-form';

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let service;
  try {
    service = await getServiceById(id);
  } catch {
    notFound();
  }

  const updateWithId = async (formData: FormData) => {
    'use server';
    return updateServiceAction(id, formData);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/services"
        className="inline-flex items-center text-sm text-secondary hover:text-prune"
      >
        &larr; Retour au catalogue
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-prune">
        Modifier — {service.name}
      </h1>

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <ServiceForm
          action={updateWithId}
          service={service}
          submitLabel="Enregistrer les modifications"
        />
      </div>
    </div>
  );
}
