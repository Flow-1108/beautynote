'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

type ClientOption = {
  id: string;
  first_name: string;
  last_name: string;
};

type Props = {
  clients: ClientOption[];
  value: string;
  onChange: (id: string) => void;
};

export function ClientSearch({ clients, value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sort clients alphabetically by last name, then first name
  const sorted = useMemo(
    () =>
      [...clients].sort((a, b) => {
        const cmp = a.last_name.localeCompare(b.last_name, 'fr');
        return cmp !== 0 ? cmp : a.first_name.localeCompare(b.first_name, 'fr');
      }),
    [clients],
  );

  // Filter by query (search in first_name + last_name)
  const filtered = useMemo(() => {
    if (!query.trim()) return sorted;
    const q = query.toLowerCase().trim();
    return sorted.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  // Display name for selected client
  const selectedClient = clients.find((c) => c.id === value);
  const displayValue = selectedClient
    ? `${selectedClient.first_name} ${selectedClient.last_name}`
    : '';

  // Sync input text with selection
  useEffect(() => {
    if (value && !open) {
      setQuery(displayValue);
    }
  }, [value, open, displayValue]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Reset query to selected value if closing without selection
        if (value) setQuery(displayValue);
        else setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [value, displayValue]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  function handleSelect(id: string) {
    onChange(id);
    const c = clients.find((cl) => cl.id === id);
    if (c) setQuery(`${c.first_name} ${c.last_name}`);
    setOpen(false);
    setHighlightIndex(-1);
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
          handleSelect(filtered[highlightIndex].id);
        }
        break;
      case 'Escape':
        setOpen(false);
        if (value) setQuery(displayValue);
        break;
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        autoComplete="off"
        placeholder="Rechercher un client…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlightIndex(-1);
          // Clear selection if user edits the text
          if (value) onChange('');
        }}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onKeyDown={handleKeyDown}
        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
      />

      {/* Hidden input for form submission */}
      <input type="hidden" name="client_id" value={value} />

      {/* Dropdown */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-secondary">
              Aucun client trouvé
            </li>
          ) : (
            filtered.map((c, i) => (
              <li
                key={c.id}
                role="option"
                aria-selected={c.id === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(c.id);
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === highlightIndex
                    ? 'bg-prune text-white'
                    : c.id === value
                      ? 'bg-surface-muted text-foreground'
                      : 'text-foreground hover:bg-surface-muted'
                }`}
              >
                <span className="font-medium">{c.last_name}</span>{' '}
                <span>{c.first_name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
