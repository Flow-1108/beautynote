-- ============================================================
-- Migration 006 : Support multi-services par rendez-vous
-- ============================================================
-- Ajout d'une table de jonction appointment_services.
-- Le champ service_id sur appointments devient nullable (legacy).
-- Les RDV existants sont migrés vers la nouvelle table.
-- ============================================================

-- 1. Créer la table de jonction
CREATE TABLE appointment_services (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id   UUID    NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id       UUID    NOT NULL REFERENCES catalogue_services(id) ON DELETE RESTRICT,
  base_price_cents INTEGER NOT NULL CHECK (base_price_cents >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  buffer_minutes   INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointment_services_apt ON appointment_services (appointment_id);
CREATE INDEX idx_appointment_services_svc ON appointment_services (service_id);

-- 2. RLS
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_appointment_services"
  ON appointment_services FOR ALL
  USING      (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Migrer les RDV existants vers la table de jonction
INSERT INTO appointment_services (appointment_id, service_id, base_price_cents, duration_minutes, buffer_minutes)
SELECT
  a.id,
  a.service_id,
  a.base_price_cents,
  cs.duration_minutes,
  cs.buffer_minutes
FROM appointments a
JOIN catalogue_services cs ON cs.id = a.service_id
WHERE a.service_id IS NOT NULL;

-- 4. Rendre service_id nullable (legacy, plus utilisé par le code)
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;
