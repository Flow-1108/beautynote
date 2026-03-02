'use server';

import { createClient } from '@/lib/supabase/server';
import { isBirthdayMonth } from '@/lib/utils';
import type { PricingBreakdown } from '@/types';

// ============================================================
// CONSTANTES MÉTIER
// ============================================================

const BIRTHDAY_DISCOUNT_CENTS = 500;    // 5€ de réduction pendant le mois d'anniversaire
const LOYALTY_POINTS_PER_BLOCK = 100;   // 100 points = 1 palier
const LOYALTY_DISCOUNT_PER_BLOCK = 500; // 5€ de réduction par palier de 100 points

// ============================================================
// CALCUL DU PRIX — Fonction pure (aucun effet de bord)
// ============================================================
// Cette fonction est le cœur mathématique de la tarification.
// Elle est déterministe et testable indépendamment de la BDD.

export async function calculatePricing(
  basePriceCents: number,
  birthday: string | null,
  loyaltyPointsAvailable: number,
  loyaltyPointsToSpend: number = 0,
): Promise<PricingBreakdown> {
  // 1. Prix de base
  const base = Math.max(0, basePriceCents);

  // 2. Réduction anniversaire (mois entier)
  const isBirthday = isBirthdayMonth(birthday);
  const birthdayDiscount = isBirthday ? Math.min(BIRTHDAY_DISCOUNT_CENTS, base) : 0;
  const priceAfterBirthday = base - birthdayDiscount;

  // 3. Points de fidélité — calcul du maximum utilisable
  //    Chaque palier de 100 points = 5€ de réduction.
  //    Le dernier palier peut réduire partiellement (prix → 0€).
  const maxBlocksByBalance = Math.floor(loyaltyPointsAvailable / LOYALTY_POINTS_PER_BLOCK);
  const maxBlocksByPrice = Math.ceil(priceAfterBirthday / LOYALTY_DISCOUNT_PER_BLOCK);
  const maxUsableBlocks = Math.min(maxBlocksByBalance, maxBlocksByPrice);
  const maxLoyaltyPointsUsable = maxUsableBlocks * LOYALTY_POINTS_PER_BLOCK;

  // 4. Validation des points demandés
  //    Arrondir au palier inférieur, puis borner au maximum utilisable.
  const requestedBlocks = Math.floor(loyaltyPointsToSpend / LOYALTY_POINTS_PER_BLOCK);
  const actualBlocks = Math.min(Math.max(0, requestedBlocks), maxUsableBlocks);
  const loyaltyPointsUsed = actualBlocks * LOYALTY_POINTS_PER_BLOCK;

  // 5. Réduction fidélité effective
  //    Le dernier palier ne dépasse jamais le prix restant.
  const rawLoyaltyDiscount = actualBlocks * LOYALTY_DISCOUNT_PER_BLOCK;
  const loyaltyDiscount = Math.min(rawLoyaltyDiscount, priceAfterBirthday);

  // 6. Prix final — JAMAIS négatif
  const finalPrice = Math.max(0, priceAfterBirthday - loyaltyDiscount);

  return {
    base_price_cents: base,
    is_birthday_month: isBirthday,
    birthday_discount_cents: birthdayDiscount,
    loyalty_points_available: loyaltyPointsAvailable,
    max_loyalty_points_usable: maxLoyaltyPointsUsable,
    loyalty_points_used: loyaltyPointsUsed,
    loyalty_discount_cents: loyaltyDiscount,
    final_price_cents: finalPrice,
  };
}

// ============================================================
// PREVIEW — Appel serveur pour prévisualiser la tarification
// ============================================================
// Utilisé par l'UI pour afficher le prix en temps réel
// quand l'utilisatrice sélectionne un service et un client.

export async function previewPricing(
  serviceIds: string[],
  clientId: string,
  loyaltyPointsToSpend: number = 0,
): Promise<PricingBreakdown> {
  const supabase = await createClient();

  const [servicesRes, clientRes] = await Promise.all([
    supabase
      .from('catalogue_services')
      .select('base_price_cents')
      .in('id', serviceIds),
    supabase
      .from('clients')
      .select('birthday, loyalty_points')
      .eq('id', clientId)
      .single(),
  ]);

  if (servicesRes.error) throw new Error(`Service(s) introuvable(s) : ${servicesRes.error.message}`);
  if (clientRes.error) throw new Error(`Client introuvable : ${clientRes.error.message}`);

  const totalBasePriceCents = (servicesRes.data ?? []).reduce(
    (sum, s) => sum + s.base_price_cents, 0,
  );

  return calculatePricing(
    totalBasePriceCents,
    clientRes.data.birthday,
    clientRes.data.loyalty_points,
    loyaltyPointsToSpend,
  );
}

// ============================================================
// ATTRIBUTION DES POINTS — Après paiement réussi
// ============================================================
// Règle : 1€ facturé (prix final) = 1 point de fidélité.
// Les centimes sont tronqués (floor).

export async function awardLoyaltyPoints(
  clientId: string,
  appointmentId: string,
  finalPriceCents: number,
) {
  const pointsToAward = Math.floor(finalPriceCents / 100);

  if (pointsToAward <= 0) return;

  const supabase = await createClient();

  // Lecture atomique du solde actuel
  const { data: client, error: readError } = await supabase
    .from('clients')
    .select('loyalty_points')
    .eq('id', clientId)
    .single();

  if (readError) throw new Error(readError.message);

  const newBalance = client.loyalty_points + pointsToAward;

  // Mise à jour du solde client
  const { error: updateError } = await supabase
    .from('clients')
    .update({ loyalty_points: newBalance })
    .eq('id', clientId);

  if (updateError) throw new Error(updateError.message);

  // Journal d'audit
  const { error: logError } = await supabase
    .from('loyalty_transactions')
    .insert({
      client_id: clientId,
      appointment_id: appointmentId,
      type: 'earned' as const,
      points: pointsToAward,
      balance_after: newBalance,
      description: `+${pointsToAward} pts (prestation de ${(finalPriceCents / 100).toFixed(2)}€)`,
    });

  if (logError) throw new Error(logError.message);
}

// ============================================================
// CONSOMMATION DES POINTS — Lors de la création du RDV
// ============================================================
// Débite les points du client et enregistre la transaction.

export async function spendLoyaltyPoints(
  clientId: string,
  appointmentId: string,
  pointsToSpend: number,
) {
  if (pointsToSpend <= 0) return;

  const supabase = await createClient();

  // Lecture atomique du solde actuel
  const { data: client, error: readError } = await supabase
    .from('clients')
    .select('loyalty_points')
    .eq('id', clientId)
    .single();

  if (readError) throw new Error(readError.message);

  // Vérification de solvabilité
  if (client.loyalty_points < pointsToSpend) {
    throw new Error(
      `Points insuffisants : ${client.loyalty_points} disponibles, ${pointsToSpend} demandés.`,
    );
  }

  const newBalance = client.loyalty_points - pointsToSpend;

  // Mise à jour du solde client
  const { error: updateError } = await supabase
    .from('clients')
    .update({ loyalty_points: newBalance })
    .eq('id', clientId);

  if (updateError) throw new Error(updateError.message);

  // Journal d'audit
  const { error: logError } = await supabase
    .from('loyalty_transactions')
    .insert({
      client_id: clientId,
      appointment_id: appointmentId,
      type: 'spent' as const,
      points: -pointsToSpend,
      balance_after: newBalance,
      description: `-${pointsToSpend} pts (réduction fidélité)`,
    });

  if (logError) throw new Error(logError.message);
}

// ============================================================
// AJUSTEMENT MANUEL — Correction par l'administratrice
// ============================================================

export async function adjustLoyaltyPoints(
  clientId: string,
  pointsDelta: number,
  reason: string,
) {
  if (pointsDelta === 0) return;

  const supabase = await createClient();

  const { data: client, error: readError } = await supabase
    .from('clients')
    .select('loyalty_points')
    .eq('id', clientId)
    .single();

  if (readError) throw new Error(readError.message);

  const newBalance = Math.max(0, client.loyalty_points + pointsDelta);

  const { error: updateError } = await supabase
    .from('clients')
    .update({ loyalty_points: newBalance })
    .eq('id', clientId);

  if (updateError) throw new Error(updateError.message);

  const { error: logError } = await supabase
    .from('loyalty_transactions')
    .insert({
      client_id: clientId,
      appointment_id: null,
      type: 'adjustment' as const,
      points: pointsDelta,
      balance_after: newBalance,
      description: `Ajustement : ${reason}`,
    });

  if (logError) throw new Error(logError.message);
}
