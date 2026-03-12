// ============================================================
// BeautyNote — SumUp Integration
// ============================================================
// Intégration hybride avec SumUp Air (Bluetooth).
//
// Le terminal SumUp Air nécessite l'app SumUp native pour le
// Bluetooth. L'approche est hybride :
//   1. BeautyNote affiche le montant à encaisser
//   2. L'utilisatrice effectue le paiement dans l'app SumUp
//   3. Elle confirme dans BeautyNote → paiement enregistré
//
// Note : L'intégration URL scheme (sumupmerchant://) a été
// testée mais pose des problèmes de reconnexion Bluetooth
// quand l'app SumUp est ouverte depuis Safari.
// ============================================================

// Taux de commission SumUp (pour le calcul des frais dans les stats)
export const SUMUP_FEE_RATE = 0.0175; // 1.75%
