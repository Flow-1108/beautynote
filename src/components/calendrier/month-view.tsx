import Link from 'next/link';
import { formatTime, getParisDay } from '@/lib/utils';

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
  year: number;
  month: number;
  appointments: AppointmentRow[];
};

function getCalendarGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Leading nulls
  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    currentWeek.push(new Date(year, month - 1, d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Trailing nulls
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export function MonthView({ year, month, appointments }: Props) {
  const weeks = getCalendarGrid(year, month);

  // Navigation
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const monthName = new Date(year, month - 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  // Group appointments by day (en timezone Paris)
  const byDay = new Map<number, typeof appointments>();
  for (const apt of appointments) {
    const d = getParisDay(apt.starts_at);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(apt);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/calendrier?view=month&year=${prevYear}&month=${prevMonth}`}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-muted"
        >
          &larr; Mois préc.
        </Link>
        <h2 className="text-lg font-semibold capitalize text-prune">
          {monthName}
        </h2>
        <Link
          href={`/calendrier?view=month&year=${nextYear}&month=${nextMonth}`}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-muted"
        >
          Mois suiv. &rarr;
        </Link>
      </div>

      {/* Calendar grid */}
      <div className="mt-4">
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((name) => (
            <div key={name} className="text-center text-xs font-semibold uppercase text-secondary py-1">
              {name}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day) {
                  return <div key={di} className="min-h-[80px] rounded-lg border border-border/30 bg-surface-muted/30" />;
                }

                const dayNum = day.getDate();
                const dayAppts = byDay.get(dayNum) ?? [];
                const isToday = isCurrentMonth && dayNum === todayDate;
                const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                return (
                  <div
                    key={di}
                    className={`min-h-[80px] rounded-lg border p-1 ${
                      isToday
                        ? 'border-prune bg-surface'
                        : 'border-border bg-surface'
                    }`}
                  >
                    {/* Day number */}
                    <Link
                      href={`/calendrier?view=day&date=${dateKey}`}
                      className="mb-0.5 block text-right"
                    >
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                          isToday
                            ? 'bg-prune text-white'
                            : 'text-foreground hover:bg-surface-muted'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </Link>

                    {/* Appointments */}
                    <div className="space-y-0.5">
                      {dayAppts.slice(0, 3).map((apt) => (
                        <Link
                          key={apt.id}
                          href={`/calendrier/${apt.id}`}
                          className={`block truncate rounded px-1 py-0.5 text-[10px] leading-tight transition-opacity hover:opacity-80 ${
                            apt.forced_overlap
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-surface-muted text-foreground'
                          }`}
                        >
                          <span className="font-medium">{formatTime(apt.starts_at)}</span>{' '}
                          {apt.client?.last_name}
                        </Link>
                      ))}
                      {dayAppts.length > 3 && (
                        <Link
                          href={`/calendrier?view=day&date=${dateKey}`}
                          className="block text-center text-[10px] font-medium text-prune hover:underline"
                        >
                          +{dayAppts.length - 3}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
