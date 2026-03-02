'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { BusinessHours, ClosureDate } from '@/types';

// ============================================================
// HORAIRES D'OUVERTURE
// ============================================================

export async function getBusinessHours(): Promise<BusinessHours[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .order('day_of_week');

  if (error) throw new Error(error.message);
  return (data ?? []) as BusinessHours[];
}

export async function updateBusinessHoursAction(formData: FormData) {
  const supabase = await createClient();

  // Parse all 7 days from form
  for (let day = 0; day <= 6; day++) {
    const isOpen = formData.get(`is_open_${day}`) === 'true';
    const openTime = formData.get(`open_time_${day}`) as string;
    const closeTime = formData.get(`close_time_${day}`) as string;

    // Si le jour est fermé, utiliser des valeurs par défaut pour open_time et close_time
    const { error } = await supabase
      .from('business_hours')
      .update({
        is_open: isOpen,
        open_time: openTime || '09:00',
        close_time: closeTime || '18:00',
      })
      .eq('day_of_week', day);

    if (error) throw new Error(`Erreur jour ${day} : ${error.message}`);
  }

  revalidatePath('/horaires');
  return { success: true };
}

// ============================================================
// DATES DE FERMETURE / CONGÉS
// ============================================================

export async function getClosureDates(): Promise<ClosureDate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('closure_dates')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ClosureDate[];
}

export async function createClosureDateAction(formData: FormData) {
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const reason = (formData.get('reason') as string) ?? '';

  if (!startDate || !endDate) {
    return { error: 'Dates requises.' };
  }

  if (startDate > endDate) {
    return { error: 'La date de fin doit être après la date de début.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('closure_dates').insert({
    start_date: startDate,
    end_date: endDate,
    reason,
  });

  if (error) return { error: error.message };

  revalidatePath('/horaires');
  return { success: true };
}

export async function deleteClosureDateAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) throw new Error('ID manquant');
  const supabase = await createClient();
  const { error } = await supabase.from('closure_dates').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/horaires');
}

// ============================================================
// VÉRIFICATION — Date fermée ou congé
// ============================================================

export async function isDateClosed(date: string): Promise<{ closed: boolean; reason?: string }> {
  const supabase = await createClient();
  
  // Vérifier le jour de la semaine (0 = Lundi, 6 = Dimanche)
  const dateObj = new Date(date);
  const dayOfWeek = (dateObj.getDay() + 6) % 7; // Convertir dimanche=0 en dimanche=6
  
  // 1. Vérifier si ce jour de la semaine est fermé
  const { data: businessHours } = await supabase
    .from('business_hours')
    .select('is_open')
    .eq('day_of_week', dayOfWeek)
    .single();
  
  if (businessHours && !businessHours.is_open) {
    return { closed: true, reason: 'Jour de fermeture hebdomadaire' };
  }
  
  // 2. Vérifier si la date est dans une période de congés
  const { data: closureDates } = await supabase
    .from('closure_dates')
    .select('reason')
    .lte('start_date', date)
    .gte('end_date', date);
  
  if (closureDates && closureDates.length > 0) {
    return { closed: true, reason: closureDates[0].reason || 'Période de fermeture' };
  }
  
  return { closed: false };
}
