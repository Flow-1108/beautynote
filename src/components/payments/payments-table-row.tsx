'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCents, formatDate } from '@/lib/utils';
import { EditPaymentModal } from './edit-payment-modal';
import { Pencil } from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  success: { label: 'Payé', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulé', color: 'bg-surface-muted text-secondary' },
};

const methodLabels: Record<string, string> = {
  card_sumup: 'Carte (SumUp)',
  cash: 'Espèces',
  free: 'Gratuit',
};

type PaymentRowProps = {
  payment: any;
};

export function PaymentTableRow({ payment }: PaymentRowProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  const apt = payment.appointment as {
    id: string;
    starts_at: string;
    final_price_cents: number;
    client: { id: string; first_name: string; last_name: string } | null;
    appointment_services?: { id: string; service: { id: string; name: string } }[];
  } | null;

  const status = statusLabels[payment.status] ?? statusLabels.pending;
  
  const serviceNames = apt?.appointment_services
    ?.map(as => as.service?.name)
    .filter(Boolean)
    .join(', ') || '—';

  return (
    <>
      <tr className="hover:bg-surface-muted">
        <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
          {formatDate(payment.created_at)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm">
          {apt?.client ? (
            <Link
              href={`/clients/${apt.client.id}`}
              className="text-prune hover:underline"
            >
              {apt.client.first_name} {apt.client.last_name}
            </Link>
          ) : (
            '—'
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
          {serviceNames}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
          {formatCents(payment.amount_cents)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-secondary">
          {methodLabels[payment.method] ?? payment.method}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
          >
            {status.label}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-md p-1 text-prune hover:bg-prune-light hover:text-white"
            title="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </td>
      </tr>

      {showEditModal && (
        <EditPaymentModal
          payment={payment}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
