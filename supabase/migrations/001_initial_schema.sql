-- ============================================================
-- BeautyNote — Migration initiale
-- ============================================================
-- Conventions :
--   • Tous les montants sont stockés en CENTIMES (INTEGER)
--     pour garantir l'intégrité financière (pas de floating point).
--   • Les UUID sont générés côté Postgres (gen_random_uuid).
--   • updated_at est géré par un trigger automatique.
-- ============================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "btree_gist";  -- index GiST pour futures contraintes temporelles

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE appointment_status AS ENUM (
  'scheduled',   -- RDV planifié
  'completed',   -- RDV terminé et payé
  'cancelled'    -- RDV annulé (y compris par perte réseau)
);

CREATE TYPE payment_status AS ENUM (
  'pending',     -- En attente de paiement
  'success',     -- Paiement réussi
  'failed',      -- Paiement échoué
  'cancelled'    -- Paiement annulé (perte réseau)
);

CREATE TYPE payment_method AS ENUM (
  'card_sumup',  -- Terminal SumUp
  'cash',        -- Espèces
  'free'         -- Prestation gratuite (0€)
);

CREATE TYPE loyalty_tx_type AS ENUM (
  'earned',      -- Points gagnés après paiement
  'spent',       -- Points consommés pour réduction
  'adjustment'   -- Correction manuelle
);

-- ============================================================
-- TABLE : clients
-- ============================================================
-- RGPD : champs strictement nécessaires à l'activité.
-- L'adresse n'est utilisée QUE pour les prestations à domicile.

CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      TEXT    NOT NULL,
  last_name       TEXT    NOT NULL,
  phone           TEXT,
  email           TEXT,
  address         TEXT,                          -- prestations à domicile uniquement
  birthday        DATE,                          -- mois = réduction 5€
  notes           TEXT,                          -- notes internes libres
  loyalty_points  INTEGER NOT NULL DEFAULT 0     -- solde courant de points
                  CHECK (loyalty_points >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : catalogue_services
-- ============================================================

CREATE TABLE catalogue_services (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL,
  description      TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  buffer_minutes   INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  base_price_cents INTEGER NOT NULL CHECK (base_price_cents >= 0),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : appointments
-- ============================================================
-- Stocke un snapshot complet de la tarification au moment
-- de la création pour traçabilité financière absolue.

CREATE TABLE appointments (
  id                     UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id              UUID               NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  service_id             UUID               NOT NULL REFERENCES catalogue_services(id) ON DELETE RESTRICT,

  -- Créneaux temporels
  starts_at              TIMESTAMPTZ        NOT NULL,
  ends_at                TIMESTAMPTZ        NOT NULL,        -- fin de prestation (starts_at + durée)
  buffer_ends_at         TIMESTAMPTZ        NOT NULL,        -- fin réelle d'occupation (ends_at + battement)

  status                 appointment_status NOT NULL DEFAULT 'scheduled',
  is_home_service        BOOLEAN            NOT NULL DEFAULT false,
  forced_overlap         BOOLEAN            NOT NULL DEFAULT false,  -- true si chevauchement accepté

  -- Snapshot tarification (centimes)
  base_price_cents       INTEGER NOT NULL CHECK (base_price_cents >= 0),
  birthday_discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (birthday_discount_cents >= 0),
  loyalty_discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_discount_cents >= 0),
  loyalty_points_used    INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points_used >= 0),
  final_price_cents      INTEGER NOT NULL CHECK (final_price_cents >= 0),

  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contrainte : ends_at > starts_at, buffer_ends_at >= ends_at
  CONSTRAINT chk_time_order CHECK (ends_at > starts_at AND buffer_ends_at >= ends_at),
  -- Contrainte : le prix final ne peut pas dépasser le prix de base
  CONSTRAINT chk_discounts  CHECK (final_price_cents <= base_price_cents)
);

-- ============================================================
-- TABLE : loyalty_transactions
-- ============================================================
-- Journal d'audit complet pour chaque mouvement de points.

CREATE TABLE loyalty_transactions (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID           NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  appointment_id  UUID           REFERENCES appointments(id) ON DELETE SET NULL,
  type            loyalty_tx_type NOT NULL,
  points          INTEGER        NOT NULL,   -- positif = crédit, négatif = débit
  balance_after   INTEGER        NOT NULL,   -- solde client après cette transaction
  description     TEXT,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : payments
-- ============================================================

CREATE TABLE payments (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id        UUID           NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  amount_cents          INTEGER        NOT NULL CHECK (amount_cents >= 0),
  method                payment_method NOT NULL,
  status                payment_status NOT NULL DEFAULT 'pending',
  sumup_checkout_id     TEXT,          -- référence checkout SumUp Cloud API
  sumup_transaction_id  TEXT,          -- référence transaction SumUp après complétion
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEX
-- ============================================================

-- Recherche de chevauchement : tous les RDV non-annulés triés par créneau
CREATE INDEX idx_appointments_overlap
  ON appointments (starts_at, buffer_ends_at)
  WHERE status != 'cancelled';

CREATE INDEX idx_appointments_client   ON appointments (client_id);
CREATE INDEX idx_appointments_status   ON appointments (status);
CREATE INDEX idx_appointments_date     ON appointments (starts_at);

CREATE INDEX idx_loyalty_tx_client     ON loyalty_transactions (client_id);
CREATE INDEX idx_payments_appointment  ON payments (appointment_id);

CREATE INDEX idx_clients_name          ON clients (last_name, first_name);
CREATE INDEX idx_clients_phone         ON clients (phone) WHERE phone IS NOT NULL;

-- ============================================================
-- TRIGGER : updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_catalogue_services_updated_at
  BEFORE UPDATE ON catalogue_services
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Utilisatrice unique : toute opération nécessite un JWT valide.
-- L'inscription de nouveaux utilisateurs doit être DÉSACTIVÉE
-- dans le dashboard Supabase (Auth > Settings > Disable Sign Up).

ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_services   ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;

-- Policies : accès total si authentifié (une seule utilisatrice)

CREATE POLICY "admin_all_clients"
  ON clients FOR ALL
  USING      (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_all_catalogue_services"
  ON catalogue_services FOR ALL
  USING      (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_all_appointments"
  ON appointments FOR ALL
  USING      (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_all_loyalty_transactions"
  ON loyalty_transactions FOR ALL
  USING      (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_all_payments"
  ON payments FOR ALL
  USING      (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
