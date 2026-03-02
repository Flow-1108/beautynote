import Link from 'next/link';
import { getAppointmentsByDate, getAppointmentsForWeek, getAppointmentsForMonth } from '@/actions/appointments';
import { DayView } from '@/components/calendrier/day-view';
import { WeekView } from '@/components/calendrier/week-view';
import { MonthView } from '@/components/calendrier/month-view';

type CalendarView = 'day' | 'week' | 'month';

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string; year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const view: CalendarView = (['day', 'week', 'month'].includes(params.view ?? '') ? params.view : 'day') as CalendarView;
  const today = new Date();
  const selectedDate = params.date ?? today.toISOString().slice(0, 10);
  const selectedYear = params.year ? parseInt(params.year, 10) : today.getFullYear();
  const selectedMonth = params.month ? parseInt(params.month, 10) : today.getMonth() + 1;

  // Fetch data based on current view
  let dayAppointments: Awaited<ReturnType<typeof getAppointmentsByDate>> = [];
  let weekAppointments: Awaited<ReturnType<typeof getAppointmentsForWeek>> = [];
  let monthAppointments: Awaited<ReturnType<typeof getAppointmentsForMonth>> = [];

  if (view === 'day') {
    dayAppointments = await getAppointmentsByDate(selectedDate);
  } else if (view === 'week') {
    weekAppointments = await getAppointmentsForWeek(selectedDate);
  } else {
    monthAppointments = await getAppointmentsForMonth(selectedYear, selectedMonth);
  }

  // Build view-specific "today" link
  const todayStr = today.toISOString().slice(0, 10);
  const todayLink =
    view === 'month'
      ? `/calendrier?view=month&year=${today.getFullYear()}&month=${today.getMonth() + 1}`
      : `/calendrier?view=${view}&date=${todayStr}`;

  // Build "nouveau RDV" link
  const newRdvDate = view === 'month'
    ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    : selectedDate;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-prune">Calendrier</h1>
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex rounded-md ring-1 ring-border">
            {(['day', 'week', 'month'] as const).map((v) => {
              const label = v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois';
              const isActive = view === v;
              const href =
                v === 'month'
                  ? `/calendrier?view=month&year=${selectedYear}&month=${selectedMonth}`
                  : `/calendrier?view=${v}&date=${selectedDate}`;
              return (
                <Link
                  key={v}
                  href={href}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                    isActive
                      ? 'bg-prune text-white'
                      : 'bg-surface text-prune hover:bg-surface-muted'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <Link
            href={todayLink}
            className="rounded-md bg-surface px-3 py-1.5 text-sm font-medium text-prune shadow-sm ring-1 ring-border hover:bg-surface-muted"
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href={`/calendrier/nouveau?date=${newRdvDate}`}
            className="rounded-md bg-prune px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-prune-light"
          >
            Nouveau RDV
          </Link>
        </div>
      </div>

      {/* View */}
      <div className="mt-4">
        {view === 'day' && (
          <DayView date={selectedDate} appointments={dayAppointments} />
        )}
        {view === 'week' && (
          <WeekView startDate={selectedDate} appointments={weekAppointments} />
        )}
        {view === 'month' && (
          <MonthView year={selectedYear} month={selectedMonth} appointments={monthAppointments} />
        )}
      </div>
    </div>
  );
}
