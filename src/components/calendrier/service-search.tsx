'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { formatCents } from '@/lib/utils';

type ServiceOption = {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
  buffer_minutes: number;
  base_price_cents: number;
};

type Props = {
  services: ServiceOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function ServiceSearch({ services, selectedIds, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sort services alphabetically by category, then name
  const sorted = useMemo(
    () =>
      [...services].sort((a, b) => {
        const cmp = a.category.localeCompare(b.category, 'fr');
        return cmp !== 0 ? cmp : a.name.localeCompare(b.name, 'fr');
      }),
    [services],
  );

  // Filter by query (search in name + category)
  const filtered = useMemo(() => {
    if (!query.trim()) return sorted;
    const q = query.toLowerCase().trim();
    return sorted.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        `${s.category} ${s.name}`.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  function toggleService(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          toggleService(filtered[highlightIndex].id);
        }
        break;
      case 'Escape':
        setOpen(false);
        setQuery('');
        break;
    }
  }

  // Selected services details
  const selectedServices = services.filter((s) => selectedSet.has(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalBuffer = selectedServices.length > 0 ? Math.max(...selectedServices.map((s) => s.buffer_minutes)) : 0;
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.base_price_cents, 0);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        autoComplete="off"
        placeholder="Rechercher et ajouter des services…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlightIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
      />

      {/* Hidden inputs for form submission (one per selected service) */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="service_ids" value={id} />
      ))}

      {/* Selected services chips */}
      {selectedServices.length > 0 && (
        <div className="mt-2 space-y-1">
          {selectedServices.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm"
            >
              <div>
                <span className="text-xs font-medium uppercase text-secondary">{s.category}</span>
                {' — '}
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="ml-2 text-xs text-secondary">
                  {s.duration_minutes} min · {formatCents(s.base_price_cents)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleService(s.id)}
                className="ml-2 text-secondary hover:text-red-500"
                aria-label={`Retirer ${s.name}`}
              >
                &times;
              </button>
            </div>
          ))}
          <p className="text-xs font-medium text-prune">
            Total : {totalDuration} min (+{totalBuffer} min battement) · {formatCents(totalPrice)}
          </p>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-secondary">
              Aucun service trouvé
            </li>
          ) : (
            filtered.map((s, i) => {
              const isSelected = selectedSet.has(s.id);
              return (
                <li
                  key={s.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggleService(s.id);
                  }}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    i === highlightIndex
                      ? 'bg-prune text-white'
                      : isSelected
                        ? 'bg-surface-muted text-foreground'
                        : 'text-foreground hover:bg-surface-muted'
                  }`}
                >
                  <span className="mr-2">{isSelected ? '\u2713' : '\u00A0\u00A0'}</span>
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    {s.category}
                  </span>
                  {' — '}
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-xs opacity-70">
                    {s.duration_minutes} min · {formatCents(s.base_price_cents)}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
