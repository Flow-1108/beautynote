'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ClientInsert, ClientUpdate } from '@/types';

// ---------- READ ----------

export async function getClients(search?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('clients')
    .select('*')
    .order('last_name', { ascending: true });

  if (search) {
    query = query.or(
      `last_name.ilike.%${search}%,first_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

export async function getClientById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ---------- CREATE ----------

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();

  const client: ClientInsert = {
    first_name: (formData.get('first_name') as string).trim(),
    last_name: (formData.get('last_name') as string).trim(),
    phone: (formData.get('phone') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    address: (formData.get('address') as string)?.trim() || null,
    birthday: (formData.get('birthday') as string) || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  };

  const { error } = await supabase.from('clients').insert(client);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/clients');
  redirect('/clients');
}

// ---------- UPDATE ----------

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient();

  const updates: ClientUpdate = {
    first_name: (formData.get('first_name') as string).trim(),
    last_name: (formData.get('last_name') as string).trim(),
    phone: (formData.get('phone') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    address: (formData.get('address') as string)?.trim() || null,
    birthday: (formData.get('birthday') as string) || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  };

  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

// ---------- DELETE ----------

export async function deleteClientAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('clients').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/clients');
  redirect('/clients');
}

// ---------- HISTORY ----------

export async function getClientHistory(clientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      starts_at,
      ends_at,
      status,
      final_price_cents,
      is_home_service,
      loyalty_points_used,
      appointment_services (
        id,
        base_price_cents,
        duration_minutes,
        service:catalogue_services (
          id,
          name,
          category
        )
      ),
      payment:payments (
        id,
        status,
        method
      )
    `)
    .eq('client_id', clientId)
    .order('starts_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClientStats(clientId: string) {
  const supabase = await createClient();

  // Récupérer tous les RDV terminés pour calculer les stats
  const { data: completedAppointments } = await supabase
    .from('appointments')
    .select('final_price_cents, loyalty_points_used')
    .eq('client_id', clientId)
    .eq('status', 'completed');

  const totalSpent = (completedAppointments ?? []).reduce(
    (sum, apt) => sum + apt.final_price_cents,
    0
  );

  const totalLoyaltyUsed = (completedAppointments ?? []).reduce(
    (sum, apt) => sum + apt.loyalty_points_used,
    0
  );

  // Compter les RDV par statut
  const { data: allAppointments } = await supabase
    .from('appointments')
    .select('status')
    .eq('client_id', clientId);

  const statusCounts = (allAppointments ?? []).reduce((acc, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSpent,
    totalLoyaltyUsed,
    totalCompleted: statusCounts.completed || 0,
    totalScheduled: statusCounts.scheduled || 0,
    totalCancelled: statusCounts.cancelled || 0,
    totalAppointments: allAppointments?.length || 0,
  };
}
