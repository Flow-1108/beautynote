'use client';

import Link from 'next/link';
import { formatCents, formatTime, getParisDecimalHours } from '@/lib/utils';
import { Pencil } from 'lucide-react';

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
  client: { id: string; first_name: string; last_name: string; phone: string | null } | null;
  service: ServiceInfo | null;
  appointment_services?: { id: string; service: ServiceInfo }[];
};

function getServiceNames(apt: AppointmentRow): string {
  if (apt.appointment_services && apt.appointment_services.length > 0) {
    return apt.appointment_services.map((as) => as.service.name).join(', ');
  }
  return apt.service?.name ?? '';
}

type Props = {
  date: string;
  appointments: AppointmentRow[];
};

const HOUR_START = 8;
const HOUR_END = 20;
const SLOT_HEIGHT_PX = 60; // pixels par heure

function timeToOffset(isoString: string): number {
  const hours = getParisDecimalHours(isoString);
  return (hours - HOUR_START) * SLOT_HEIGHT_PX;
}

export function DayView({ date, appointments }: Props) {
  const hours = Array.from(
    { length: HOUR_END - HOUR_START },
    (_, i) => HOUR_START + i,
  );

  const totalHeight = (HOUR_END - HOUR_START) * SLOT_HEIGHT_PX;

  // Navigation dates
  const currentDate = new Date(date);
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const formatNav = (d: Date) => d.toISOString().slice(0, 10);
  const formatDisplay = (d: Date) =>
    d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div>
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/calendrier?date=${formatNav(prevDate)}`}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-muted">
          &larr; Veille
        </Link>
        <h2 className="text-lg font-semibold capitalize text-prune">
          {formatDisplay(currentDate)}
        </h2>
        <Link
          href={`/calendrier?date=${formatNav(nextDate)}`}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-muted">
          Lendemain &rarr;
        </Link>
      </div>

      {/* Timeline */}
      <div className="relative mt-4 rounded-lg border border-border bg-surface" style={{ height: totalHeight }}>
        {/* Hour lines */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-border/50"
            style={{ top: (hour - HOUR_START) * SLOT_HEIGHT_PX }}
          >
            <span className="absolute -top-2.5 left-2 text-xs text-secondary">
              {String(hour).padStart(2, '0')}:00
            </span>
          </div>
        ))}

        {/* Appointments */}
        {appointments.map((apt) => {
          const top = Math.max(0, timeToOffset(apt.starts_at));
          const bottom = timeToOffset(apt.buffer_ends_at);
          const serviceEnd = timeToOffset(apt.ends_at);
          const height = Math.max(20, bottom - top);
          const bufferHeight = bottom - serviceEnd;

          return (
            <div
              key={apt.id}
              className="group absolute left-14 right-2 overflow-hidden rounded-md border shadow-sm transition-shadow hover:shadow-md"
              style={{
                top,
                height,
                borderColor: apt.forced_overlap ? '#f59e0b' : '#4A314C',
                backgroundColor: apt.forced_overlap ? '#fffbeb' : '#ede4ee',
              }}
            >
              <Link
                href={`/calendrier/${apt.id}`}
                className="block px-2 py-1"
              >
                <p className="truncate text-xs font-semibold text-foreground">
                  {formatTime(apt.starts_at)} – {formatTime(apt.ends_at)}
                  {apt.is_home_service && ' (domicile)'}
                </p>
                <p className="truncate text-xs text-prune">
                  {apt.client?.first_name} {apt.client?.last_name}
                </p>
                <p className="truncate text-xs text-secondary">
                  {getServiceNames(apt)} — {formatCents(apt.final_price_cents)}
                </p>
              </Link>
              {apt.status === 'scheduled' && (
                <Link
                  href={`/calendrier/${apt.id}/modifier`}
                  className="absolute right-1 top-1 rounded bg-white/90 p-1 opacity-0 shadow-sm transition-opacity hover:bg-prune hover:text-white group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil className="h-3 w-3" />
                </Link>
              )}
              {/* Buffer zone visual */}
              {bufferHeight > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 border-t border-dashed opacity-40"
                  style={{
                    height: bufferHeight,
                    borderColor: apt.forced_overlap ? '#f59e0b' : '#4A314C',
                    backgroundColor: apt.forced_overlap ? '#fef3c7' : '#D4BDD5',
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {appointments.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-secondary">Aucun rendez-vous ce jour</p>
          </div>
        )}
      </div>
    </div>
  );
}
