import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClientById, updateClientAction } from '@/actions/clients';
import { ClientForm } from '@/components/clients/client-form';

export default async function EditClientPage({
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

  const updateWithId = async (formData: FormData) => {
    'use server';
    return updateClientAction(id, formData);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/clients/${id}`}
        className="inline-flex items-center text-sm text-secondary hover:text-prune"
      >
        &larr; Retour à la fiche
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-prune">
        Modifier — {client.first_name} {client.last_name}
      </h1>

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <ClientForm
          action={updateWithId}
          client={client}
          submitLabel="Enregistrer les modifications"
        />
      </div>
    </div>
  );
}
