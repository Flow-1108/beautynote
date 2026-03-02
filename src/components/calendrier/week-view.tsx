import Link from 'next/link';
import { formatCents } from '@/lib/utils';

type ServiceInfo = { id: string; name: string; category: string; duration_minutes: number; buffer_minutes: number };

type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  buffer_ends_at: string;
  status: string;
  final_price_cents: number;
  forced_overlap: boolean;
  is_home_service: boolean;
  client: { id: string; first_name: string; last_name: string } | null;
  service: ServiceInfo | null;
  appointment_services?: { id: string; service: ServiceInfo }[];
};

type Props = {
  startDate: string;
  appointments: AppointmentRow[];
};

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getWeekDays(startDate: string) {
  const days: Date[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMonday(dateStr: string): Date {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function WeekView({ startDate, appointments }: Props) {
  const monday = getMonday(startDate);
  const days = getWeekDays(monday.toISOString().slice(0, 10));

  const prevMonday = new Date(monday);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const formatNav = (d: Date) => d.toISOString().slice(0, 10);

  // Group appointments by day
  const byDay = new Map<string, AppointmentRow[]>();
  for (const day of days) {
    byDay.set(day.toISOString().slice(0, 10), []);
  }
  for (const apt of appointments) {
    const dayKey = new Date(apt.starts_at).toISOString().slice(0, 10);
    if (byDay.has(dayKey)) {
      byDay.get(dayKey)!.push(apt);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/calendrier?view=week&date=${formatNav(prevMonday)}`}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-muted"
        >
          &larr; Sem. préc.
        </Link>
        <h2 className="text-lg font-semibold text-prune">
          Semaine du {monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h2>
        <Link
          href={`/calendrier?view=week&date=${formatNav(nextMonday)}`}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-muted"
        >
          Sem. suiv. &rarr;
        </Link>
      </div>

      {/* Week grid */}
      <div className="mt-4 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const dayAppts = byDay.get(key) ?? [];
          const isToday = key === today;
          const dayName = day.toLocaleDateString('fr-FR', { weekday: 'short' });
          const dayNum = day.getDate();

          return (
            <div
              key={key}
              className={`min-h-[120px] rounded-lg border p-2 ${
                isToday
                  ? 'border-prune bg-surface'
                  : 'border-border bg-surface'
              }`}
            >
              {/* Day header */}
              <Link
                href={`/calendrier?view=day&date=${key}`}
                className="mb-1 block text-center"
              >
                <span className="text-xs uppercase text-secondary">{dayName}</span>
                <span
                  className={`ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? 'bg-prune text-white'
                      : 'text-foreground'
                  }`}
                >
                  {dayNum}
                </span>
              </Link>

              {/* Appointments */}
              <div className="space-y-1">
                {dayAppts.slice(0, 4).map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/calendrier/${apt.id}`}
                    className={`block rounded px-1.5 py-0.5 text-xs transition-opacity hover:opacity-80 ${
                      apt.forced_overlap
                        ? 'border-l-2 border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-l-2 border-prune bg-surface-muted text-foreground'
                    }`}
                  >
                    <span className="font-medium">{formatTime(apt.starts_at)}</span>
                    <span className="ml-1 truncate">
                      {apt.client?.first_name?.charAt(0)}. {apt.client?.last_name}
                    </span>
                  </Link>
                ))}
                {dayAppts.length > 4 && (
                  <Link
                    href={`/calendrier?view=day&date=${key}`}
                    className="block text-center text-xs font-medium text-prune hover:underline"
                  >
                    +{dayAppts.length - 4} autres
                  </Link>
                )}
                {dayAppts.length === 0 && (
                  <p className="text-center text-xs text-secondary/50">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
