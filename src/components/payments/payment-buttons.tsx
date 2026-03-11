'use client';

import { useFormState, useFormStatus } from 'react-dom';

type PaymentState = {
  error?: string;
  details?: string;
  success?: boolean;
};

function SubmitButton({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
  const { pending } = useFormStatus();
  
  const baseClasses = "rounded-md px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = variant === 'primary' 
    ? "bg-prune text-white hover:bg-prune-light"
    : "bg-surface text-prune ring-1 ring-border hover:bg-surface-muted font-medium";
  
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${baseClasses} ${variantClasses}`}
    >
      {pending ? 'Traitement...' : children}
    </button>
  );
}

export function PaymentButtons({ 
  cardAction, 
  cashAction 
}: { 
  cardAction: (prevState: PaymentState, formData: FormData) => Promise<PaymentState>;
  cashAction: (prevState: PaymentState, formData: FormData) => Promise<PaymentState>;
}) {
  const [cardState, cardFormAction] = useFormState<PaymentState, FormData>(cardAction, {});
  const [cashState, cashFormAction] = useFormState<PaymentState, FormData>(cashAction, {});

  return (
    <div className="mt-3 space-y-3">
      {/* Affichage des erreurs de paiement carte */}
      {cardState.error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">{cardState.error}</p>
          {cardState.details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                Détails techniques
              </summary>
              <p className="mt-1 text-xs text-red-600 font-mono">{cardState.details}</p>
            </details>
          )}
        </div>
      )}

      {/* Affichage des erreurs de paiement espèces */}
      {cashState.error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">{cashState.error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <form action={cardFormAction}>
          <SubmitButton variant="primary">
            Payer par carte (SumUp)
          </SubmitButton>
        </form>
        
        <form action={cashFormAction}>
          <SubmitButton variant="secondary">
            Payer en espèces
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
