'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createCheckout, processCheckout, getCheckoutStatus } from '@/lib/sumup';
import { awardLoyaltyPoints } from './pricing';
import { completeAppointmentAction } from './appointments';

// ============================================================
// INITIER UN PAIEMENT PAR CARTE (SumUp Cloud API)
// ============================================================
// Flux :
//   1. Créer un checkout SumUp (server-to-server)
//   2. Envoyer le checkout au terminal physique
//   3. Enregistrer le payment en statut 'pending' en BDD
//   4. L'utilisatrice finalise sur le terminal
//   5. checkPaymentStatus() vérifie le résultat

export async function initiateCardPaymentAction(appointmentId: string) {
  const supabase = await createClient();

  // Charger le RDV
  const { data: appointment, error: aptErr } = await supabase
    .from('appointments')
    .select('id, client_id, final_price_cents, status')
    .eq('id', appointmentId)
    .single();

  if (aptErr) return { error: `RDV introuvable : ${aptErr.message}` };

  // Vérifier qu'il n'y a pas déjà un paiement réussi
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('appointment_id', appointmentId)
    .eq('status', 'success')
    .maybeSingle();

  if (existingPayment) return { error: 'Ce RDV a déjà été payé.' };

  const amountCents = appointment.final_price_cents;

  // Si montant = 0€, enregistrer directement comme gratuit
  if (amountCents === 0) {
    return handleFreePayment(appointmentId, appointment.client_id);
  }

  const amountEuros = amountCents / 100;
  const checkoutRef = `BN-${appointmentId.slice(0, 8)}-${Date.now()}`;

  try {
    // 1. Créer le checkout SumUp
    const checkout = await createCheckout(
      checkoutRef,
      amountEuros,
      `BeautyNote — RDV ${appointmentId.slice(0, 8)}`,
    );

    // 2. Envoyer au terminal
    await processCheckout(checkout.id);

    // 3. Enregistrer en BDD
    const { error: insertErr } = await supabase.from('payments').insert({
      appointment_id: appointmentId,
      amount_cents: amountCents,
      method: 'card_sumup' as const,
      status: 'pending' as const,
      sumup_checkout_id: checkout.id,
    });

    if (insertErr) return { error: insertErr.message };

    revalidatePath(`/calendrier/${appointmentId}`);
    revalidatePath('/paiements');

    return { success: true, checkoutId: checkout.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur SumUp inconnue';
    return { error: message };
  }
}

// ============================================================
// VÉRIFIER LE STATUT DU PAIEMENT (polling)
// ============================================================

export async function checkPaymentStatusAction(appointmentId: string) {
  const supabase = await createClient();

  // Trouver le paiement pending pour ce RDV
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .select('id, sumup_checkout_id, status, amount_cents')
    .eq('appointment_id', appointmentId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payErr) return { error: payErr.message };
  if (!payment) return { error: 'Aucun paiement en attente pour ce RDV.' };
  if (!payment.sumup_checkout_id) return { error: 'Pas de référence SumUp.' };

  try {
    const checkout = await getCheckoutStatus(payment.sumup_checkout_id);

    if (checkout.status === 'PAID') {
      // Paiement réussi → mettre à jour
      await supabase
        .from('payments')
        .update({
          status: 'success' as const,
          sumup_transaction_id: checkout.transaction_id ?? null,
        })
        .eq('id', payment.id);

      // Marquer le RDV comme terminé
      await completeAppointmentAction(appointmentId);

      // Attribuer les points de fidélité
      const { data: apt } = await supabase
        .from('appointments')
        .select('client_id, final_price_cents')
        .eq('id', appointmentId)
        .single();

      if (apt) {
        await awardLoyaltyPoints(apt.client_id, appointmentId, apt.final_price_cents);
      }

      revalidatePath(`/calendrier/${appointmentId}`);
      revalidatePath('/paiements');

      return { status: 'success' as const };
    }

    if (checkout.status === 'FAILED' || checkout.status === 'EXPIRED') {
      await supabase
        .from('payments')
        .update({ status: 'failed' as const })
        .eq('id', payment.id);

      revalidatePath(`/calendrier/${appointmentId}`);
      revalidatePath('/paiements');

      return { status: 'failed' as const, message: `Paiement ${checkout.status.toLowerCase()}.` };
    }

    // Toujours en attente
    return { status: 'pending' as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur vérification SumUp';
    return { error: message };
  }
}

// ============================================================
// PAIEMENT EN ESPÈCES
// ============================================================

export async function recordCashPaymentAction(appointmentId: string) {
  const supabase = await createClient();

  const { data: appointment, error: aptErr } = await supabase
    .from('appointments')
    .select('id, client_id, final_price_cents')
    .eq('id', appointmentId)
    .single();

  if (aptErr) return { error: aptErr.message };

  // Vérifier qu'il n'y a pas déjà un paiement réussi
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('appointment_id', appointmentId)
    .eq('status', 'success')
    .maybeSingle();

  if (existingPayment) return { error: 'Ce RDV a déjà été payé.' };

  // Si montant = 0€, traiter comme gratuit
  if (appointment.final_price_cents === 0) {
    return handleFreePayment(appointmentId, appointment.client_id);
  }

  // Enregistrer le paiement espèces
  const { error: insertErr } = await supabase.from('payments').insert({
    appointment_id: appointmentId,
    amount_cents: appointment.final_price_cents,
    method: 'cash' as const,
    status: 'success' as const,
  });

  if (insertErr) return { error: insertErr.message };

  // Marquer le RDV comme terminé
  await completeAppointmentAction(appointmentId);

  // Attribuer les points de fidélité
  await awardLoyaltyPoints(
    appointment.client_id,
    appointmentId,
    appointment.final_price_cents,
  );

  revalidatePath(`/calendrier/${appointmentId}`);
  revalidatePath('/paiements');

  return { success: true };
}

// ============================================================
// PAIEMENT GRATUIT (0€)
// ============================================================

async function handleFreePayment(appointmentId: string, clientId: string) {
  const supabase = await createClient();

  const { error: insertErr } = await supabase.from('payments').insert({
    appointment_id: appointmentId,
    amount_cents: 0,
    method: 'free' as const,
    status: 'success' as const,
  });

  if (insertErr) return { error: insertErr.message };

  await completeAppointmentAction(appointmentId);

  // 0€ = 0 points, mais on appelle quand même pour la cohérence
  await awardLoyaltyPoints(clientId, appointmentId, 0);

  revalidatePath(`/calendrier/${appointmentId}`);
  revalidatePath('/paiements');

  return { success: true };
}

// ============================================================
// LECTURE — Historique des paiements
// ============================================================

export async function getPayments(limit: number = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      appointment:appointments(
        id, starts_at, final_price_cents,
        client:clients(id, first_name, last_name),
        appointment_services(
          id,
          service:catalogue_services(id, name)
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

export async function getPaymentByAppointment(appointmentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// ============================================================
// STATISTIQUES — CA du mois en cours
// ============================================================

export async function getCurrentMonthRevenue() {
  const supabase = await createClient();
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('payments')
    .select('amount_cents, status')
    .eq('status', 'success')
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth);

  if (error) throw new Error(error.message);

  const total = (data ?? []).reduce((sum, payment) => sum + payment.amount_cents, 0);
  const count = data?.length ?? 0;

  return { total, count };
}

// ============================================================
// MODIFIER UN PAIEMENT EXISTANT
// ============================================================

export async function updatePaymentAction(
  paymentId: string,
  data: {
    amount_cents?: number;
    method?: 'card_sumup' | 'cash' | 'free';
    status?: 'pending' | 'success' | 'failed' | 'cancelled';
    created_at?: string;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('payments')
    .update(data)
    .eq('id', paymentId);

  if (error) return { error: error.message };

  revalidatePath('/paiements');
  return { success: true };
}

// ============================================================
// CRÉER UN PAIEMENT MANUEL (sans rendez-vous)
// ============================================================

export async function createManualPaymentAction(formData: FormData) {
  const supabase = await createClient();

  const clientId = formData.get('client_id') as string;
  const amountEuros = parseFloat(formData.get('amount') as string);
  const method = formData.get('method') as 'card_sumup' | 'cash' | 'free';
  const createdAt = formData.get('created_at') as string;
  const description = formData.get('description') as string;

  if (!clientId || isNaN(amountEuros) || amountEuros < 0) {
    return { error: 'Données invalides' };
  }

  const amountCents = Math.round(amountEuros * 100);

  // Créer un rendez-vous "manuel" pour le paiement
  const serviceId = '00000000-0000-0000-0000-000000000001'; // Service historique
  const date = createdAt ? new Date(createdAt) : new Date();

  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .insert({
      client_id: clientId,
      starts_at: date.toISOString(),
      ends_at: new Date(date.getTime() + 60 * 60 * 1000).toISOString(),
      buffer_ends_at: new Date(date.getTime() + 75 * 60 * 1000).toISOString(),
      status: 'completed',
      is_home_service: false,
      base_price_cents: amountCents,
      birthday_discount_cents: 0,
      loyalty_discount_cents: 0,
      loyalty_points_used: 0,
      final_price_cents: amountCents,
      notes: description || 'Paiement manuel',
    })
    .select('id')
    .single();

  if (aptError) return { error: aptError.message };

  // Créer le service associé
  await supabase.from('appointment_services').insert({
    appointment_id: appointment.id,
    service_id: serviceId,
    base_price_cents: amountCents,
    duration_minutes: 60,
    buffer_minutes: 15,
  });

  // Créer le paiement
  const { error: paymentError } = await supabase.from('payments').insert({
    appointment_id: appointment.id,
    amount_cents: amountCents,
    method: method,
    status: 'success',
    created_at: date.toISOString(),
  });

  if (paymentError) return { error: paymentError.message };

  revalidatePath('/paiements');
  return { success: true };
}
