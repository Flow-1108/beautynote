import { redirect } from 'next/navigation';
import { handleSumUpCallbackAction } from '@/actions/payments';

export default async function SumUpCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const result = params.result;
  const appointmentId = params.appointmentId;
  const txCode = params['smp-tx-code'];
  const foreignTxId = params['foreign-tx-id'];

  // Si on a un foreign-tx-id et un résultat, traiter le callback
  if (foreignTxId) {
    await handleSumUpCallbackAction({
      foreignTxId,
      success: result === 'success',
      txCode: txCode ?? undefined,
    });
  }

  // Rediriger vers la page du RDV
  if (appointmentId) {
    redirect(`/calendrier/${appointmentId}`);
  }

  // Fallback : rediriger vers le calendrier
  redirect('/calendrier');
}
