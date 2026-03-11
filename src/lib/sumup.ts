// ============================================================
// BeautyNote — SumUp Cloud API Helper
// ============================================================
// Communication server-to-server avec l'API SumUp.
// Aucune donnée de paiement ne transite côté client.
// Documentation : https://developer.sumup.com/api
// ============================================================

const SUMUP_BASE_URL = 'https://api.sumup.com/v0.1';

function getApiKey(): string {
  const key = process.env.SUMUP_API_KEY;
  if (!key) throw new Error('SUMUP_API_KEY manquante dans les variables d\'environnement.');
  return key;
}

function getMerchantCode(): string {
  const code = process.env.SUMUP_MERCHANT_CODE;
  if (!code) throw new Error('SUMUP_MERCHANT_CODE manquant dans les variables d\'environnement.');
  return code;
}

// --- Types SumUp ---

export type SumUpCheckoutStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED';

export type SumUpCheckout = {
  id: string;
  checkout_reference: string;
  amount: number;
  currency: string;
  status: SumUpCheckoutStatus;
  transaction_id?: string;
  date?: string;
};

type CreateCheckoutPayload = {
  checkout_reference: string;
  amount: number;
  currency: string;
  merchant_code: string;
  description: string;
};

// --- API calls ---

/**
 * Crée un checkout SumUp et retourne l'objet checkout.
 * Le checkout sera ensuite envoyé au terminal via processCheckout().
 */
export async function createCheckout(
  checkoutReference: string,
  amountEuros: number,
  description: string,
): Promise<SumUpCheckout> {
  const payload: CreateCheckoutPayload = {
    checkout_reference: checkoutReference,
    amount: amountEuros,
    currency: 'EUR',
    merchant_code: getMerchantCode(),
    description,
  };

  console.log('[SumUp] Creating checkout:', {
    reference: checkoutReference,
    amount: amountEuros,
    merchant: getMerchantCode(),
  });

  const response = await fetch(`${SUMUP_BASE_URL}/checkouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[SumUp] createCheckout failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorBody,
    });
    throw new Error(`SumUp createCheckout failed (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  console.log('[SumUp] Checkout created:', result.id);
  return result;
}

/**
 * Envoie le checkout vers le terminal SumUp physique.
 * Le terminal affichera le montant et attendra le paiement par carte.
 */
export async function processCheckout(checkoutId: string): Promise<SumUpCheckout> {
  console.log('[SumUp] Processing checkout on terminal:', checkoutId);

  const response = await fetch(`${SUMUP_BASE_URL}/checkouts/${checkoutId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_type: 'card',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[SumUp] processCheckout failed:', {
      checkoutId,
      status: response.status,
      statusText: response.statusText,
      error: errorBody,
    });
    throw new Error(`SumUp processCheckout failed (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  console.log('[SumUp] Checkout sent to terminal:', result.status);
  return result;
}

/**
 * Récupère le statut actuel d'un checkout.
 * Utilisé pour vérifier si le paiement a abouti.
 */
export async function getCheckoutStatus(checkoutId: string): Promise<SumUpCheckout> {
  console.log('[SumUp] Checking status for:', checkoutId);

  const response = await fetch(`${SUMUP_BASE_URL}/checkouts/${checkoutId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[SumUp] getCheckoutStatus failed:', {
      checkoutId,
      status: response.status,
      statusText: response.statusText,
      error: errorBody,
    });
    throw new Error(`SumUp getCheckoutStatus failed (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  console.log('[SumUp] Status:', result.status);
  return result;
}
