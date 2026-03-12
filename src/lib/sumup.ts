// ============================================================
// BeautyNote — SumUp Payment API Switch (URL Scheme)
// ============================================================
// Intégration via le URL scheme iOS « sumupmerchant:// »
// pour les terminaux SumUp Air (Bluetooth).
//
// Flux :
//   1. L'app crée un paiement "pending" en BDD
//   2. L'utilisatrice est redirigée vers l'app SumUp via URL scheme
//   3. L'app SumUp gère le paiement via Bluetooth avec le terminal Air
//   4. Après paiement, SumUp redirige vers notre callback URL
//   5. Le callback met à jour le statut du paiement en BDD
//
// Documentation :
//   https://developer.sumup.com/docs/terminal-payments
//   https://github.com/sumup/sumup-ios-url-scheme
// ============================================================

/**
 * Construit l'URL SumUp pour ouvrir l'app SumUp et déclencher un paiement.
 * Utilise le URL scheme iOS : sumupmerchant://pay/1.0
 */
export function buildSumUpPaymentUrl(params: {
  amount: number;       // Montant en euros (ex: 45.00)
  currency?: string;    // Devise (défaut: EUR)
  title?: string;       // Description affichée dans SumUp
  foreignTxId: string;  // Identifiant unique côté BeautyNote
  affiliateKey: string; // Clé d'affiliation SumUp
  callbackSuccess: string; // URL de retour en cas de succès
  callbackFail: string;    // URL de retour en cas d'échec
}): string {
  const {
    amount,
    currency = 'EUR',
    title,
    foreignTxId,
    affiliateKey,
    callbackSuccess,
    callbackFail,
  } = params;

  const url = new URL('sumupmerchant://pay/1.0');
  url.searchParams.set('amount', amount.toFixed(2));
  url.searchParams.set('currency', currency);
  url.searchParams.set('affiliate-key', affiliateKey);
  url.searchParams.set('foreign-tx-id', foreignTxId);
  url.searchParams.set('callbacksuccess', callbackSuccess);
  url.searchParams.set('callbackfail', callbackFail);
  url.searchParams.set('skip-screen-success', 'true');

  if (title) {
    url.searchParams.set('title', title);
  }

  return url.toString();
}
