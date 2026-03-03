/**
 * Formate un montant en centimes vers un affichage en euros.
 * Ex: 5000 → "50,00 €"
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

/**
 * Formate une date ISO vers un affichage localisé.
 * Ex: "2026-03-01" → "1 mars 2026"
 */
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate));
}

/**
 * Formate une heure ISO vers un affichage localisé (HH:MM).
 * Ex: "2026-03-01T14:30:00Z" → "14:30"
 */
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

/**
 * Formate un numéro de téléphone pour l'affichage.
 * Ex: "0612345678" → "06 12 34 56 78"
 */
export function formatPhone(phone: string): string {
  return phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/**
 * Vérifie si le mois courant correspond au mois d'anniversaire du client.
 */
export function isBirthdayMonth(birthday: string | null): boolean {
  if (!birthday) return false;
  const now = new Date();
  const bday = new Date(birthday);
  return now.getMonth() === bday.getMonth();
}

/**
 * Retourne les initiales à partir du prénom et nom.
 * Ex: "Marie Dupont" → "MD"
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
