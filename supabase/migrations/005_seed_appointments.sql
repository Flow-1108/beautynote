-- ============================================================
-- Migration 005 : Import des rendez-vous existants
-- ============================================================
-- Seuls les RDV de Laure Desquilles sont importés automatiquement
-- (service clairement identifié : Maillot Simple, 20 min, 17€).
--
-- Les RDV suivants doivent être créés MANUELLEMENT via l'app
-- (multi-services, durée incompatible, ou service ambigu) :
--   - Pauline Chagneaud      25 mars 2026 10:30  (75 min, 3 services)
--   - Sylviane Carlos        25 mars 2026 09:00  (100 min, multi-services)
--   - Isabelle Caron          25 mars 2026 12:30  (25 min, service ambigu)
--   - Marie-José Cauchois    25 mars 2026 12:45  (25 min, service ambigu)
--   - Sylvie Dortignac       12 mars 2026 10:00  (105 min, multi-services)
--   - Louise Dortignac        9 mars 2026 16:30  (100 min, multi-services)
--   - Marie Pierre Bonbony    9 mars 2026 13:30  (100 min, multi-services)
-- ============================================================

DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_base_price INTEGER;
  v_duration INTEGER;
  v_buffer INTEGER;
BEGIN
  -- Récupérer Laure Desquilles
  SELECT id INTO v_client_id
    FROM clients
    WHERE first_name = 'Laure' AND last_name = 'Desquilles'
    LIMIT 1;

  -- Récupérer Maillot Simple
  SELECT id, base_price_cents, duration_minutes, buffer_minutes
    INTO v_service_id, v_base_price, v_duration, v_buffer
    FROM catalogue_services
    WHERE name = 'Maillot Simple'
    LIMIT 1;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Client Laure Desquilles introuvable';
  END IF;
  IF v_service_id IS NULL THEN
    RAISE EXCEPTION 'Service Maillot Simple introuvable';
  END IF;

  -- 1. 10 août 2026 18:00 — Confirmé
  INSERT INTO appointments (client_id, service_id, starts_at, ends_at, buffer_ends_at, status,
    is_home_service, forced_overlap, base_price_cents, birthday_discount_cents,
    loyalty_discount_cents, loyalty_points_used, final_price_cents)
  VALUES (
    v_client_id, v_service_id,
    '2026-08-10T18:00:00+02:00',
    '2026-08-10T18:00:00+02:00'::timestamptz + (v_duration || ' minutes')::interval,
    '2026-08-10T18:00:00+02:00'::timestamptz + ((v_duration + v_buffer) || ' minutes')::interval,
    'scheduled', false, false,
    v_base_price, 0, 0, 0, v_base_price
  );

  -- 2. 20 juillet 2026 18:00 — Confirmé
  INSERT INTO appointments (client_id, service_id, starts_at, ends_at, buffer_ends_at, status,
    is_home_service, forced_overlap, base_price_cents, birthday_discount_cents,
    loyalty_discount_cents, loyalty_points_used, final_price_cents)
  VALUES (
    v_client_id, v_service_id,
    '2026-07-20T18:00:00+02:00',
    '2026-07-20T18:00:00+02:00'::timestamptz + (v_duration || ' minutes')::interval,
    '2026-07-20T18:00:00+02:00'::timestamptz + ((v_duration + v_buffer) || ' minutes')::interval,
    'scheduled', false, false,
    v_base_price, 0, 0, 0, v_base_price
  );

  -- 3. 29 juin 2026 10:00 — Confirmé
  INSERT INTO appointments (client_id, service_id, starts_at, ends_at, buffer_ends_at, status,
    is_home_service, forced_overlap, base_price_cents, birthday_discount_cents,
    loyalty_discount_cents, loyalty_points_used, final_price_cents)
  VALUES (
    v_client_id, v_service_id,
    '2026-06-29T10:00:00+02:00',
    '2026-06-29T10:00:00+02:00'::timestamptz + (v_duration || ' minutes')::interval,
    '2026-06-29T10:00:00+02:00'::timestamptz + ((v_duration + v_buffer) || ' minutes')::interval,
    'scheduled', false, false,
    v_base_price, 0, 0, 0, v_base_price
  );

  -- 4. 8 juin 2026 15:15 — Confirmé
  INSERT INTO appointments (client_id, service_id, starts_at, ends_at, buffer_ends_at, status,
    is_home_service, forced_overlap, base_price_cents, birthday_discount_cents,
    loyalty_discount_cents, loyalty_points_used, final_price_cents)
  VALUES (
    v_client_id, v_service_id,
    '2026-06-08T15:15:00+02:00',
    '2026-06-08T15:15:00+02:00'::timestamptz + (v_duration || ' minutes')::interval,
    '2026-06-08T15:15:00+02:00'::timestamptz + ((v_duration + v_buffer) || ' minutes')::interval,
    'scheduled', false, false,
    v_base_price, 0, 0, 0, v_base_price
  );

  -- 5. 18 mai 2026 15:15 — Confirmé
  INSERT INTO appointments (client_id, service_id, starts_at, ends_at, buffer_ends_at, status,
    is_home_service, forced_overlap, base_price_cents, birthday_discount_cents,
    loyalty_discount_cents, loyalty_points_used, final_price_cents)
  VALUES (
    v_client_id, v_service_id,
    '2026-05-18T15:15:00+02:00',
    '2026-05-18T15:15:00+02:00'::timestamptz + (v_duration || ' minutes')::interval,
    '2026-05-18T15:15:00+02:00'::timestamptz + ((v_duration + v_buffer) || ' minutes')::interval,
    'scheduled', false, false,
    v_base_price, 0, 0, 0, v_base_price
  );

  -- 6. 11 mai 2026 15:15 — ANNULÉ
  INSERT INTO appointments (client_id, service_id, starts_at, ends_at, buffer_ends_at, status,
    is_home_service, forced_overlap, base_price_cents, birthday_discount_cents,
    loyalty_discount_cents, loyalty_points_used, final_price_cents)
  VALUES (
    v_client_id, v_service_id,
    '2026-05-11T15:15:00+02:00',
    '2026-05-11T15:15:00+02:00'::timestamptz + (v_duration || ' minutes')::interval,
    '2026-05-11T15:15:00+02:00'::timestamptz + ((v_duration + v_buffer) || ' minutes')::interval,
    'cancelled', false, false,
    v_base_price, 0, 0, 0, v_base_price
  );

  -- 7. 27 avril 2026 15:15 — Confirmé
  INSERT INTO appointments (client_id, service_id, starts_at, ends_at, buffer_ends_at, status,
    is_home_service, forced_overlap, base_price_cents, birthday_discount_cents,
    loyalty_discount_cents, loyalty_points_used, final_price_cents)
  VALUES (
    v_client_id, v_service_id,
    '2026-04-27T15:15:00+02:00',
    '2026-04-27T15:15:00+02:00'::timestamptz + (v_duration || ' minutes')::interval,
    '2026-04-27T15:15:00+02:00'::timestamptz + ((v_duration + v_buffer) || ' minutes')::interval,
    'scheduled', false, false,
    v_base_price, 0, 0, 0, v_base_price
  );

  -- 8. 20 avril 2026 15:15 — ANNULÉ
  INSERT INTO appointments (client_id, service_id, starts_at, ends_at, buffer_ends_at, status,
    is_home_service, forced_overlap, base_price_cents, birthday_discount_cents,
    loyalty_discount_cents, loyalty_points_used, final_price_cents)
  VALUES (
    v_client_id, v_service_id,
    '2026-04-20T15:15:00+02:00',
    '2026-04-20T15:15:00+02:00'::timestamptz + (v_duration || ' minutes')::interval,
    '2026-04-20T15:15:00+02:00'::timestamptz + ((v_duration + v_buffer) || ' minutes')::interval,
    'cancelled', false, false,
    v_base_price, 0, 0, 0, v_base_price
  );

  -- 9. 23 mars 2026 15:15 — Confirmé
  INSERT INTO appointments (client_id, service_id, starts_at, ends_at, buffer_ends_at, status,
    is_home_service, forced_overlap, base_price_cents, birthday_discount_cents,
    loyalty_discount_cents, loyalty_points_used, final_price_cents)
  VALUES (
    v_client_id, v_service_id,
    '2026-03-23T15:15:00+01:00',
    '2026-03-23T15:15:00+01:00'::timestamptz + (v_duration || ' minutes')::interval,
    '2026-03-23T15:15:00+01:00'::timestamptz + ((v_duration + v_buffer) || ' minutes')::interval,
    'scheduled', false, false,
    v_base_price, 0, 0, 0, v_base_price
  );

END $$;
