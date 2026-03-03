'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================================
// AJUSTER LES POINTS DE FIDÉLITÉ MANUELLEMENT
// ============================================================

export async function adjustLoyaltyPointsAction(
  clientId: string,
  adjustment: number,
  reason: string
) {
  const supabase = await createClient();

  // Récupérer le solde actuel
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('loyalty_points')
    .eq('id', clientId)
    .single();

  if (clientError) return { error: clientError.message };

  const currentPoints = client.loyalty_points;
  const newPoints = currentPoints + adjustment;

  // Vérifier que le nouveau solde n'est pas négatif
  if (newPoints < 0) {
    return { error: 'Le solde de points ne peut pas être négatif.' };
  }

  // Mettre à jour le solde du client
  const { error: updateError } = await supabase
    .from('clients')
    .update({ loyalty_points: newPoints })
    .eq('id', clientId);

  if (updateError) return { error: updateError.message };

  // Enregistrer la transaction dans l'historique
  const { error: txError } = await supabase
    .from('loyalty_transactions')
    .insert({
      client_id: clientId,
      type: 'adjustment',
      points: adjustment,
      balance_after: newPoints,
      description: reason || 'Ajustement manuel',
    });

  if (txError) return { error: txError.message };

  revalidatePath(`/clients/${clientId}`);
  return { success: true, newPoints };
}
