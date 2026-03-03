'use client';

import { useState } from 'react';
import { AddPaymentModal } from './add-payment-modal';
import { Plus } from 'lucide-react';

type Client = {
  id: string;
  first_name: string;
  last_name: string;
};

type AddPaymentButtonProps = {
  clients: Client[];
};

export function AddPaymentButton({ clients }: AddPaymentButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 rounded-md bg-prune px-4 py-2 text-sm font-medium text-white hover:bg-prune-light"
      >
        <Plus className="h-4 w-4" />
        Ajouter un paiement
      </button>

      {showModal && (
        <AddPaymentModal
          clients={clients}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
