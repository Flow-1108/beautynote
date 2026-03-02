'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CatalogueServiceInsert, CatalogueServiceUpdate } from '@/types';

// ---------- READ ----------

export async function getServices(search?: string, category?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('catalogue_services')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

export async function getServiceById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('catalogue_services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getServiceCategories(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('catalogue_services')
    .select('category')
    .order('category', { ascending: true });

  if (error) throw new Error(error.message);

  const unique = [...new Set(data.map((r: { category: string }) => r.category))];
  return unique;
}

// ---------- CREATE ----------

export async function createServiceAction(formData: FormData) {
  const supabase = await createClient();

  const priceCents = Math.round(
    parseFloat(formData.get('base_price') as string) * 100,
  );

  const service: CatalogueServiceInsert = {
    name: (formData.get('name') as string).trim(),
    category: (formData.get('category') as string).trim(),
    description: (formData.get('description') as string)?.trim() || null,
    duration_minutes: parseInt(formData.get('duration_minutes') as string, 10),
    buffer_minutes: parseInt(formData.get('buffer_minutes') as string, 10) || 0,
    base_price_cents: priceCents,
  };

  const { error } = await supabase.from('catalogue_services').insert(service);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/services');
  redirect('/services');
}

// ---------- UPDATE ----------

export async function updateServiceAction(id: string, formData: FormData) {
  const supabase = await createClient();

  const priceCents = Math.round(
    parseFloat(formData.get('base_price') as string) * 100,
  );

  const updates: CatalogueServiceUpdate = {
    name: (formData.get('name') as string).trim(),
    category: (formData.get('category') as string).trim(),
    description: (formData.get('description') as string)?.trim() || null,
    duration_minutes: parseInt(formData.get('duration_minutes') as string, 10),
    buffer_minutes: parseInt(formData.get('buffer_minutes') as string, 10) || 0,
    base_price_cents: priceCents,
  };

  const { error } = await supabase
    .from('catalogue_services')
    .update(updates)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/services');
  redirect('/services');
}

// ---------- TOGGLE ACTIVE ----------

export async function toggleServiceActiveAction(id: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('catalogue_services')
    .update({ is_active: !isActive })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/services');
}
