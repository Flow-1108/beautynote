import Link from 'next/link';
import { getClients } from '@/actions/clients';
import { formatPhone, isBirthdayMonth, getInitials } from '@/lib/utils';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await getClients(q);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-prune">Clients</h1>
          <p className="mt-1 text-sm text-secondary">
            {clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/clients/nouveau"
          className="rounded-md bg-prune px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-prune-light"
        >
          Nouveau client
        </Link>
      </div>

      {/* Search */}
      <form className="mt-4">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="Rechercher par nom, téléphone ou email…"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-secondary focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune sm:max-w-md"
        />
      </form>

      {/* List */}
      {clients.length === 0 ? (
        <p className="mt-8 text-center text-sm text-secondary">
          {q ? 'Aucun résultat pour cette recherche.' : 'Aucun client enregistré.'}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
          {clients.map((client) => (
            <li key={client.id}>
              <Link
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-muted"
              >
                {/* Avatar initials */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-prune">
                  {getInitials(client.first_name, client.last_name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {client.first_name} {client.last_name}
                    {isBirthdayMonth(client.birthday) && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Anniversaire
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-secondary">
                    {client.phone ? formatPhone(client.phone) : '—'}
                    {client.email && ` · ${client.email}`}
                  </p>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {client.loyalty_points}
                  </p>
                  <p className="text-xs text-secondary">points</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
