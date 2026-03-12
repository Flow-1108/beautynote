import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { completeAppointmentAction } from '@/actions/appointments';
import { awardLoyaltyPoints } from '@/actions/pricing';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = searchParams.get('result') ?? searchParams.get('smp-status');
  const appointmentId = searchParams.get('appointmentId');
  const txCode = searchParams.get('smp-tx-code');
  const foreignTxId = searchParams.get('foreign-tx-id');

  console.log('[SumUp Callback] Params:', { result, appointmentId, txCode, foreignTxId });

  if (foreignTxId) {
    try {
      const supabase = await createClient();
      const isSuccess = result === 'success';

      // Trouver le paiement par le foreign-tx-id (stocké dans sumup_checkout_id)
      const { data: payment, error: payErr } = await supabase
        .from('payments')
        .select('id, appointment_id, amount_cents, status')
        .eq('sumup_checkout_id', foreignTxId)
        .eq('status', 'pending')
        .maybeSingle();

      if (payErr || !payment) {
        console.error('[SumUp Callback] Payment not found:', foreignTxId, payErr);
      } else if (isSuccess) {
        // Paiement réussi
        await supabase
          .from('payments')
          .update({
            status: 'success' as const,
            sumup_transaction_id: txCode ?? null,
          })
          .eq('id', payment.id);

        // Marquer le RDV comme terminé
        await completeAppointmentAction(payment.appointment_id);

        // Attribuer les points de fidélité
        const { data: apt } = await supabase
          .from('appointments')
          .select('client_id, final_price_cents')
          .eq('id', payment.appointment_id)
          .single();

        if (apt) {
          await awardLoyaltyPoints(apt.client_id, payment.appointment_id, apt.final_price_cents);
        }

        console.log('[SumUp Callback] Payment marked as success');
      } else {
        // Paiement échoué
        await supabase
          .from('payments')
          .update({ status: 'failed' as const })
          .eq('id', payment.id);

        console.log('[SumUp Callback] Payment marked as failed');
      }

      // Revalider les pages
      if (payment?.appointment_id) {
        revalidatePath(`/calendrier/${payment.appointment_id}`);
      }
      revalidatePath('/paiements');
      revalidatePath('/calendrier');
    } catch (err) {
      console.error('[SumUp Callback] Error:', err);
    }
  }

  // Rediriger vers la page du RDV
  const baseUrl = request.nextUrl.origin;
  const redirectUrl = appointmentId
    ? `${baseUrl}/calendrier/${appointmentId}`
    : `${baseUrl}/calendrier`;

  return NextResponse.redirect(redirectUrl);
}
