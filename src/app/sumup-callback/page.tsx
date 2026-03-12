import { redirect } from 'next/navigation';
import Link from 'next/link';
import { handleSumUpCallbackAction } from '@/actions/payments';

export default async function SumUpCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  let params: { [key: string]: string | undefined } = {};
  try {
    params = await searchParams;
  } catch {
    // Si searchParams échoue, on continue avec un objet vide
  }

  const result = params.result ?? params['smp-status'];
  const appointmentId = params.appointmentId;
  const txCode = params['smp-tx-code'];
  const foreignTxId = params['foreign-tx-id'];

  console.log('[SumUp Callback] Params:', { result, appointmentId, txCode, foreignTxId });

  let callbackError: string | null = null;

  // Traiter le callback si on a un foreign-tx-id
  if (foreignTxId) {
    try {
      const isSuccess = result === 'success';
      await handleSumUpCallbackAction({
        foreignTxId,
        success: isSuccess,
        txCode: txCode ?? undefined,
      });
      console.log('[SumUp Callback] Payment processed:', isSuccess ? 'success' : 'failed');
    } catch (err) {
      console.error('[SumUp Callback] Error processing payment:', err);
      callbackError = err instanceof Error ? err.message : 'Erreur inconnue';
    }
  }

  // Rediriger vers la page du RDV si possible
  if (appointmentId && !callbackError) {
    redirect(`/calendrier/${appointmentId}`);
  }

  // Si pas d'appointmentId mais pas d'erreur, rediriger vers le calendrier
  if (!callbackError && !appointmentId) {
    redirect('/calendrier');
  }

  // Fallback : afficher un message si la redirection échoue
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-bold text-prune">Retour de paiement</h1>
      {callbackError ? (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Erreur lors du traitement : {callbackError}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-secondary">
          {result === 'success' ? 'Paiement enregistré.' : 'Paiement non abouti.'}
        </p>
      )}
      <Link
        href={appointmentId ? `/calendrier/${appointmentId}` : '/calendrier'}
        className="mt-6 inline-block rounded-md bg-prune px-4 py-2 text-sm font-medium text-white hover:bg-prune-light"
      >
        Retour
      </Link>
    </div>
  );
}
