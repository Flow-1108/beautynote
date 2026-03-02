import Link from 'next/link';
import { getServices, getServiceCategories, toggleServiceActiveAction } from '@/actions/services';
import { formatCents } from '@/lib/utils';

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const { q, cat } = await searchParams;
  const [services, categories] = await Promise.all([
    getServices(q, cat),
    getServiceCategories(),
  ]);

  // Grouper par catégorie pour l'affichage
  const grouped = services.reduce<Record<string, typeof services>>(
    (acc, service) => {
      const key = service.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(service);
      return acc;
    },
    {},
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-prune">
            Catalogue de services
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {services.length} service{services.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/services/nouveau"
          className="rounded-md bg-prune px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-prune-light"
        >
          Nouveau service
        </Link>
      </div>

      {/* Filters */}
      <form className="mt-4 flex flex-wrap items-center gap-3">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="Rechercher un service…"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-secondary focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune sm:w-72"
        />
        <select
          name="cat"
          defaultValue={cat ?? ''}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-surface-muted px-3 py-2 text-sm font-medium text-prune hover:bg-border"
        >
          Filtrer
        </button>
      </form>

      {/* Services grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <p className="mt-8 text-center text-sm text-secondary">
          {q || cat
            ? 'Aucun résultat pour cette recherche.'
            : 'Aucun service enregistré.'}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-secondary">
                {category}
                <span className="ml-2 text-xs font-normal text-secondary/70">
                  ({items.length})
                </span>
              </h2>
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
                {items.map((service) => (
                  <li
                    key={service.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      !service.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/services/${service.id}/modifier`}
                        className="text-sm font-medium text-foreground hover:text-prune"
                      >
                        {service.name}
                      </Link>
                      <p className="text-sm text-secondary">
                        {service.duration_minutes} min
                        {service.buffer_minutes > 0 &&
                          ` + ${service.buffer_minutes} min battement`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCents(service.base_price_cents)}
                      </p>

                      {/* Toggle active */}
                      <form
                        action={async () => {
                          'use server';
                          await toggleServiceActiveAction(
                            service.id,
                            service.is_active,
                          );
                        }}
                      >
                        <button
                          type="submit"
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            service.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-surface-muted text-secondary hover:bg-border'
                          }`}
                        >
                          {service.is_active ? 'Actif' : 'Inactif'}
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
