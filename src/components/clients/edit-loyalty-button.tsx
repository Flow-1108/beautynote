'use client';

import { useState } from 'react';
import { EditLoyaltyModal } from './edit-loyalty-modal';
import { Pencil } from 'lucide-react';

type EditLoyaltyButtonProps = {
  clientId: string;
  currentPoints: number;
};

export function EditLoyaltyButton({ clientId, currentPoints }: EditLoyaltyButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="ml-2 rounded-md p-1 text-prune hover:bg-prune-light hover:text-white"
        title="Modifier les points"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {showModal && (
        <EditLoyaltyModal
          clientId={clientId}
          currentPoints={currentPoints}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
