import Link from 'next/link';
import { createClientAction } from '@/actions/clients';
import { ClientForm } from '@/components/clients/client-form';

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/clients"
        className="inline-flex items-center text-sm text-secondary hover:text-prune"
      >
        &larr; Retour aux clients
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-prune">
        Nouveau client
      </h1>

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <ClientForm
          action={createClientAction}
          submitLabel="Créer le client"
        />
      </div>
    </div>
  );
}
