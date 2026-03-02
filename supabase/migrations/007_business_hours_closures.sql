-- ============================================================
-- Migration 007 : Horaires d'ouverture + Dates de fermeture
-- ============================================================

-- 1. Horaires hebdomadaires (un row par jour de la semaine)
CREATE TABLE business_hours (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0 = Lundi, 1 = Mardi, … 6 = Dimanche
  is_open     BOOLEAN NOT NULL DEFAULT true,
  open_time   TIME    NOT NULL DEFAULT '09:00',
  close_time  TIME    NOT NULL DEFAULT '18:00',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_times CHECK (open_time < close_time)
);

ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_business_hours"
  ON business_hours FOR ALL
  USING      (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Seed : horaires par défaut (lun-sam 9h-18h, dimanche fermé)
INSERT INTO business_hours (day_of_week, is_open, open_time, close_time) VALUES
  (0, true,  '09:00', '18:00'),  -- Lundi
  (1, true,  '09:00', '18:00'),  -- Mardi
  (2, true,  '09:00', '18:00'),  -- Mercredi
  (3, true,  '09:00', '18:00'),  -- Jeudi
  (4, true,  '09:00', '18:00'),  -- Vendredi
  (5, true,  '09:00', '18:00'),  -- Samedi
  (6, false, '09:00', '18:00');  -- Dimanche

-- 2. Dates de fermeture / congés
CREATE TABLE closure_dates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE        NOT NULL,
  end_date   DATE        NOT NULL,
  reason     TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_dates CHECK (start_date <= end_date)
);

CREATE INDEX idx_closure_dates_range ON closure_dates (start_date, end_date);

ALTER TABLE closure_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_closure_dates"
  ON closure_dates FOR ALL
  USING      (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
