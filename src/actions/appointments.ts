'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { calculatePricing, spendLoyaltyPoints } from './pricing';
import { isDateClosed } from './schedule';
import type { AppointmentInsert, AppointmentServiceInsert, AppointmentUpdate } from '@/types';

// ============================================================
// Types internes
// ============================================================

type OverlapInfo = {
  id: string;
  starts_at: string;
  buffer_ends_at: string;
  client_first_name: string;
  client_last_name: string;
  service_name: string;
};

export type CreateAppointmentResult =
  | { success: true; appointmentId: string }
  | { error: string }
  | { overlap: true; conflicts: OverlapInfo[]; message: string }
  | { closedDate: true; reason: string; message: string };

// ============================================================
// READ
// ============================================================

export async function getAppointmentsByDate(date: string) {
  const supabase = await createClient();

  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients(id, first_name, last_name, phone),
      service:catalogue_services(id, name, category, duration_minutes, buffer_minutes),
      appointment_services(id, service_id, base_price_cents, duration_minutes, buffer_minutes, service:catalogue_services(id, name, category, duration_minutes, buffer_minutes))
    `)
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAppointmentById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients(*),
      service:catalogue_services(*),
      appointment_services(id, service_id, base_price_cents, duration_minutes, buffer_minutes, service:catalogue_services(*))
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAppointmentsForWeek(startDate: string) {
  const supabase = await createClient();

  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients(id, first_name, last_name),
      service:catalogue_services(id, name, category, duration_minutes, buffer_minutes),
      appointment_services(id, service_id, base_price_cents, duration_minutes, buffer_minutes, service:catalogue_services(id, name, category, duration_minutes, buffer_minutes))
    `)
    .gte('starts_at', start.toISOString())
    .lt('starts_at', end.toISOString())
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAppointmentsForMonth(year: number, month: number) {
  const supabase = await createClient();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients(id, first_name, last_name),
      service:catalogue_services(id, name, category, duration_minutes, buffer_minutes),
      appointment_services(id, service_id, base_price_cents, duration_minutes, buffer_minutes, service:catalogue_services(id, name, category, duration_minutes, buffer_minutes))
    `)
    .gte('starts_at', start.toISOString())
    .lt('starts_at', end.toISOString())
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// ============================================================
// OVERLAP CHECK — Détection de chevauchement (Pessimistic)
// ============================================================

async function checkOverlap(
  startsAt: string,
  bufferEndsAt: string,
  excludeId?: string,
): Promise<OverlapInfo[]> {
  const supabase = await createClient();

  // Un chevauchement existe si :
  //   existing.starts_at < new.buffer_ends_at
  //   AND existing.buffer_ends_at > new.starts_at
  let query = supabase
    .from('appointments')
    .select(`
      id, starts_at, buffer_ends_at,
      client:clients(first_name, last_name),
      service:catalogue_services(name)
    `)
    .neq('status', 'cancelled')
    .lt('starts_at', bufferEndsAt)
    .gt('buffer_ends_at', startsAt);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const client = row.client as { first_name: string; last_name: string } | null;
    const service = row.service as { name: string } | null;
    return {
      id: row.id as string,
      starts_at: row.starts_at as string,
      buffer_ends_at: row.buffer_ends_at as string,
      client_first_name: client?.first_name ?? '',
      client_last_name: client?.last_name ?? '',
      service_name: service?.name ?? '',
    };
  });
}

// ============================================================
// CREATE — Création de RDV avec vérification complète
// ============================================================

export async function createAppointmentAction(
  formData: FormData,
): Promise<CreateAppointmentResult> {
  const supabase = await createClient();

  const clientId = formData.get('client_id') as string;
  const serviceIds = formData.getAll('service_ids') as string[];
  const startsAtRaw = formData.get('starts_at') as string;
  const isHomeService = formData.get('is_home_service') === 'on';
  const forceOverlap = formData.get('force_overlap') === 'true';
  const forceClosedDate = formData.get('force_closed_date') === 'true';
  const loyaltyPointsToSpend = parseInt(
    formData.get('loyalty_points_to_spend') as string,
    10,
  ) || 0;
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (serviceIds.length === 0) return { error: 'Veuillez sélectionner au moins un service.' };

  // Vérifier si la date est fermée (jour de fermeture ou congé)
  const appointmentDate = startsAtRaw.split('T')[0];
  const closedCheck = await isDateClosed(appointmentDate);
  
  if (closedCheck.closed && !forceClosedDate) {
    return {
      closedDate: true,
      reason: closedCheck.reason || 'Date fermée',
      message: `Attention : ${closedCheck.reason || 'Ce jour est fermé'}. Voulez-vous quand même créer ce rendez-vous ?`,
    };
  }

  // 1. Charger tous les services sélectionnés
  const { data: services, error: svcErr } = await supabase
    .from('catalogue_services')
    .select('id, duration_minutes, buffer_minutes, base_price_cents')
    .in('id', serviceIds);

  if (svcErr || !services || services.length === 0) {
    return { error: `Service(s) introuvable(s) : ${svcErr?.message ?? 'aucun résultat'}` };
  }

  // 2. Calculer les totaux multi-services
  const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);
  const maxBuffer = Math.max(...services.map((s) => s.buffer_minutes));
  const totalBasePriceCents = services.reduce((sum, s) => sum + s.base_price_cents, 0);

  // 3. Charger le client pour la tarification
  const { data: client, error: cliErr } = await supabase
    .from('clients')
    .select('birthday, loyalty_points')
    .eq('id', clientId)
    .single();

  if (cliErr) return { error: `Client introuvable : ${cliErr.message}` };

  // 4. Calculer les créneaux temporels
  const startsAt = new Date(startsAtRaw);
  const endsAt = new Date(startsAt.getTime() + totalDuration * 60_000);
  const bufferEndsAt = new Date(endsAt.getTime() + maxBuffer * 60_000);

  // 5. Vérification de chevauchement (Pessimistic Locking)
  const conflicts = await checkOverlap(
    startsAt.toISOString(),
    bufferEndsAt.toISOString(),
  );

  if (conflicts.length > 0 && !forceOverlap) {
    return {
      overlap: true,
      conflicts,
      message: `Ce créneau chevauche ${conflicts.length} rendez-vous existant${conflicts.length > 1 ? 's' : ''}.`,
    };
  }

  // 6. Calcul de la tarification dynamique (côté serveur)
  const pricing = await calculatePricing(
    totalBasePriceCents,
    client.birthday,
    client.loyalty_points,
    loyaltyPointsToSpend,
  );

  // 7. Insérer le rendez-vous
  const appointment: AppointmentInsert = {
    client_id: clientId,
    service_id: null,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    buffer_ends_at: bufferEndsAt.toISOString(),
    is_home_service: isHomeService,
    forced_overlap: forceOverlap && conflicts.length > 0,
    base_price_cents: pricing.base_price_cents,
    birthday_discount_cents: pricing.birthday_discount_cents,
    loyalty_discount_cents: pricing.loyalty_discount_cents,
    loyalty_points_used: pricing.loyalty_points_used,
    final_price_cents: pricing.final_price_cents,
    notes,
  };

  const { data: created, error: insertErr } = await supabase
    .from('appointments')
    .insert(appointment)
    .select('id')
    .single();

  if (insertErr) return { error: insertErr.message };

  // 8. Insérer les services dans la table de jonction
  const appointmentServices: AppointmentServiceInsert[] = services.map((s) => ({
    appointment_id: created.id,
    service_id: s.id,
    base_price_cents: s.base_price_cents,
    duration_minutes: s.duration_minutes,
    buffer_minutes: s.buffer_minutes,
  }));

  const { error: junctionErr } = await supabase
    .from('appointment_services')
    .insert(appointmentServices);

  if (junctionErr) return { error: junctionErr.message };

  // 9. Débiter les points de fidélité si utilisés
  if (pricing.loyalty_points_used > 0) {
    await spendLoyaltyPoints(
      clientId,
      created.id,
      pricing.loyalty_points_used,
    );
  }

  revalidatePath('/calendrier');
  return { success: true, appointmentId: created.id };
}

// ============================================================
// UPDATE STATUS — Compléter / Annuler un RDV
// ============================================================

export async function completeAppointmentAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'completed' as const })
    .eq('id', id)
    .eq('status', 'scheduled');

  if (error) return { error: error.message };

  revalidatePath('/calendrier');
  revalidatePath(`/calendrier/${id}`);
}

export async function cancelAppointmentAction(id: string) {
  const supabase = await createClient();

  // Charger le RDV pour rembourser les points si nécessaire
  const { data: appointment, error: readErr } = await supabase
    .from('appointments')
    .select('client_id, loyalty_points_used, status')
    .eq('id', id)
    .single();

  if (readErr) return { error: readErr.message };
  if (appointment.status === 'cancelled') return { error: 'Ce RDV est déjà annulé.' };

  // Annuler le RDV
  const { error: updateErr } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' as const })
    .eq('id', id);

  if (updateErr) return { error: updateErr.message };

  // Rembourser les points de fidélité si des points avaient été dépensés
  if (appointment.loyalty_points_used > 0) {
    const { data: client } = await supabase
      .from('clients')
      .select('loyalty_points')
      .eq('id', appointment.client_id)
      .single();

    if (client) {
      const newBalance = client.loyalty_points + appointment.loyalty_points_used;

      await supabase
        .from('clients')
        .update({ loyalty_points: newBalance })
        .eq('id', appointment.client_id);

      await supabase.from('loyalty_transactions').insert({
        client_id: appointment.client_id,
        appointment_id: id,
        type: 'adjustment' as const,
        points: appointment.loyalty_points_used,
        balance_after: newBalance,
        description: 'Remboursement points — RDV annulé',
      });
    }
  }

  revalidatePath('/calendrier');
  revalidatePath(`/calendrier/${id}`);
}

// ============================================================
// UPDATE APPOINTMENT — Modifier un RDV existant
// ============================================================

type UpdateAppointmentResult = {
  success?: boolean;
  error?: string;
  overlap?: boolean;
  conflicts?: OverlapInfo[];
  message?: string;
};

export async function updateAppointmentAction(
  appointmentId: string,
  formData: FormData,
): Promise<UpdateAppointmentResult> {
  const supabase = await createClient();

  const clientId = formData.get('client_id') as string;
  const serviceIds = formData.getAll('service_ids') as string[];
  const startsAtRaw = formData.get('starts_at') as string;
  const isHomeService = formData.get('is_home_service') === 'on';
  const forceOverlap = formData.get('force_overlap') === 'true';
  const loyaltyPointsToSpend = parseInt(
    formData.get('loyalty_points_to_spend') as string,
    10,
  ) || 0;
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (serviceIds.length === 0) return { error: 'Veuillez sélectionner au moins un service.' };

  // 1. Charger le RDV existant pour remboursement points si nécessaire
  const { data: existingAppt, error: existingErr } = await supabase
    .from('appointments')
    .select('client_id, loyalty_points_used')
    .eq('id', appointmentId)
    .single();

  if (existingErr) return { error: `Rendez-vous introuvable : ${existingErr.message}` };

  // 2. Charger tous les services sélectionnés
  const { data: services, error: svcErr } = await supabase
    .from('catalogue_services')
    .select('id, duration_minutes, buffer_minutes, base_price_cents')
    .in('id', serviceIds);

  if (svcErr || !services || services.length === 0) {
    return { error: `Service(s) introuvable(s) : ${svcErr?.message ?? 'aucun résultat'}` };
  }

  // 3. Calculer les totaux multi-services
  const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);
  const maxBuffer = Math.max(...services.map((s) => s.buffer_minutes));
  const totalBasePriceCents = services.reduce((sum, s) => sum + s.base_price_cents, 0);

  // 4. Charger le client pour la tarification
  const { data: client, error: cliErr } = await supabase
    .from('clients')
    .select('birthday, loyalty_points')
    .eq('id', clientId)
    .single();

  if (cliErr) return { error: `Client introuvable : ${cliErr.message}` };

  // 5. Calculer les créneaux temporels
  const startsAt = new Date(startsAtRaw);
  const endsAt = new Date(startsAt.getTime() + totalDuration * 60_000);
  const bufferEndsAt = new Date(endsAt.getTime() + maxBuffer * 60_000);

  // 6. Vérification de chevauchement (exclure le RDV actuel)
  const { data: overlaps } = await supabase
    .from('appointments')
    .select(`
      id,
      starts_at,
      buffer_ends_at,
      client:clients!appointments_client_id_fkey(first_name, last_name),
      service:catalogue_services(name)
    `)
    .neq('id', appointmentId)
    .eq('status', 'scheduled')
    .or(
      `and(starts_at.lt.${bufferEndsAt.toISOString()},buffer_ends_at.gt.${startsAt.toISOString()})`,
    );

  const conflicts: OverlapInfo[] = (overlaps ?? []).map((a: any) => ({
    id: a.id,
    starts_at: a.starts_at,
    buffer_ends_at: a.buffer_ends_at,
    client_first_name: a.client?.first_name ?? '',
    client_last_name: a.client?.last_name ?? '',
    service_name: a.service?.name ?? '',
  }));

  if (conflicts.length > 0 && !forceOverlap) {
    return {
      overlap: true,
      conflicts,
      message: `Ce créneau chevauche ${conflicts.length} rendez-vous existant${conflicts.length > 1 ? 's' : ''}.`,
    };
  }

  // 7. Calcul de la tarification dynamique
  const pricing = await calculatePricing(
    totalBasePriceCents,
    client.birthday,
    client.loyalty_points,
    loyaltyPointsToSpend,
  );

  // 8. Rembourser les anciens points de fidélité si le client ou les points changent
  if (existingAppt.loyalty_points_used > 0 && existingAppt.client_id === clientId) {
    const { data: oldClient } = await supabase
      .from('clients')
      .select('loyalty_points')
      .eq('id', existingAppt.client_id)
      .single();

    if (oldClient) {
      const newBalance = oldClient.loyalty_points + existingAppt.loyalty_points_used;
      await supabase
        .from('clients')
        .update({ loyalty_points: newBalance })
        .eq('id', existingAppt.client_id);

      await supabase.from('loyalty_transactions').insert({
        client_id: existingAppt.client_id,
        appointment_id: appointmentId,
        type: 'adjustment' as const,
        points: existingAppt.loyalty_points_used,
        balance_after: newBalance,
        description: 'Remboursement points — RDV modifié',
      });
    }
  }

  // 9. Mettre à jour le rendez-vous
  const appointmentUpdate: AppointmentUpdate = {
    client_id: clientId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    buffer_ends_at: bufferEndsAt.toISOString(),
    is_home_service: isHomeService,
    forced_overlap: forceOverlap && conflicts.length > 0,
    base_price_cents: pricing.base_price_cents,
    birthday_discount_cents: pricing.birthday_discount_cents,
    loyalty_discount_cents: pricing.loyalty_discount_cents,
    loyalty_points_used: pricing.loyalty_points_used,
    final_price_cents: pricing.final_price_cents,
    notes,
  };

  const { error: updateErr } = await supabase
    .from('appointments')
    .update(appointmentUpdate)
    .eq('id', appointmentId);

  if (updateErr) return { error: updateErr.message };

  // 10. Supprimer les anciens services et insérer les nouveaux
  await supabase.from('appointment_services').delete().eq('appointment_id', appointmentId);

  const appointmentServices: AppointmentServiceInsert[] = services.map((s) => ({
    appointment_id: appointmentId,
    service_id: s.id,
    base_price_cents: s.base_price_cents,
    duration_minutes: s.duration_minutes,
    buffer_minutes: s.buffer_minutes,
  }));

  const { error: junctionErr } = await supabase
    .from('appointment_services')
    .insert(appointmentServices);

  if (junctionErr) return { error: junctionErr.message };

  // 11. Débiter les nouveaux points de fidélité si utilisés
  if (pricing.loyalty_points_used > 0) {
    await spendLoyaltyPoints(clientId, appointmentId, pricing.loyalty_points_used);
  }

  // 12. Revalider les chemins
  revalidatePath('/calendrier');
  revalidatePath(`/calendrier/${appointmentId}`);

  return { success: true, overlap: false };
}

// ============================================================
// RDV DE LA SEMAINE À VENIR
// ============================================================

export async function getUpcomingWeekAppointments() {
  const supabase = await createClient();
  
  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients(id, first_name, last_name, phone),
      appointment_services(
        id,
        service:catalogue_services(id, name)
      )
    `)
    .gte('starts_at', now.toISOString())
    .lte('starts_at', weekFromNow.toISOString())
    .eq('status', 'scheduled')
    .order('starts_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
