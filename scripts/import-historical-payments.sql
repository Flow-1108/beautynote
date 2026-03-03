-- ============================================================
-- Import des paiements historiques dans BeautyNote
-- ============================================================
-- Ce script importe les données de paiements historiques
-- en créant les clients, rendez-vous et paiements nécessaires
-- ============================================================

-- Désactiver temporairement les triggers pour l'import
SET session_replication_role = replica;

-- ============================================================
-- ÉTAPE 1 : Créer ou récupérer les clients (éviter doublons)
-- ============================================================
-- Utilise une fonction pour créer uniquement si le client n'existe pas

CREATE OR REPLACE FUNCTION get_or_create_client(
  p_first_name TEXT,
  p_last_name TEXT
) RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
BEGIN
  -- Chercher le client existant (insensible à la casse)
  SELECT id INTO v_client_id
  FROM clients
  WHERE LOWER(first_name) = LOWER(p_first_name)
    AND LOWER(last_name) = LOWER(p_last_name)
  LIMIT 1;

  -- Si le client n'existe pas, le créer
  IF v_client_id IS NULL THEN
    INSERT INTO clients (first_name, last_name, phone, email, loyalty_points)
    VALUES (p_first_name, p_last_name, NULL, NULL, 0)
    RETURNING id INTO v_client_id;
    
    RAISE NOTICE 'Client créé: % % (ID: %)', p_first_name, p_last_name, v_client_id;
  ELSE
    RAISE NOTICE 'Client existant trouvé: % % (ID: %)', p_first_name, p_last_name, v_client_id;
  END IF;

  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql;

-- Pré-créer ou récupérer tous les clients
-- Dominique Chagneaud
SELECT get_or_create_client('Dominique', 'Chagneaud');

-- Eva Martin Afonso
SELECT get_or_create_client('Eva', 'Martin Afonso');

-- Louise Dortignac
SELECT get_or_create_client('Louise', 'Dortignac');

-- Marie-José Cauchois
SELECT get_or_create_client('Marie-José', 'Cauchois');

-- Nathalie Feuillolay
SELECT get_or_create_client('Nathalie', 'Feuillolay');

-- Monique Yve
SELECT get_or_create_client('Monique', 'Yve');

-- Marie Pierre Bonbony
SELECT get_or_create_client('Marie Pierre', 'Bonbony');

-- Tiphaine Perimony
SELECT get_or_create_client('Tiphaine', 'Perimony');

-- Leslie Baron
SELECT get_or_create_client('Leslie', 'Baron');

-- Laure Desquilles
SELECT get_or_create_client('Laure', 'Desquilles');

-- Anthea Cauchois
SELECT get_or_create_client('Anthea', 'Cauchois');

-- Marie José Brusseau
SELECT get_or_create_client('Marie José', 'Brusseau');

-- Cloe Guignard
SELECT get_or_create_client('Cloe', 'Guignard');

-- Sandie Martins Afonso
SELECT get_or_create_client('Sandie', 'Martins Afonso');

-- Caroline Letellier
SELECT get_or_create_client('Caroline', 'Letellier');

-- Isabelle Caron
SELECT get_or_create_client('Isabelle', 'Caron');

-- Pauline Chagneaud
SELECT get_or_create_client('Pauline', 'Chagneaud');

-- Sylviane Carlos
SELECT get_or_create_client('Sylviane', 'Carlos');

-- Pauline Abgrall
SELECT get_or_create_client('Pauline', 'Abgrall');

-- Manola Techer Perez
SELECT get_or_create_client('Manola', 'Techer Perez');

-- Rayhana Mh
SELECT get_or_create_client('Rayhana', 'Mh');

-- Sylvie Bonbony
SELECT get_or_create_client('Sylvie', 'Bonbony');

-- Laetitia Meuleunyser
SELECT get_or_create_client('Laetitia', 'Meuleunyser');

-- Marie Claude Brispot
SELECT get_or_create_client('Marie Claude', 'Brispot');

-- ============================================================
-- ÉTAPE 2 : Créer un service générique pour l'historique
-- ============================================================

INSERT INTO catalogue_services (id, name, description, duration_minutes, buffer_minutes, base_price_cents, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Service historique',
  'Service générique pour import de données historiques',
  60,
  15,
  0,
  false
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÉTAPE 3 : Créer les rendez-vous et paiements historiques
-- ============================================================

-- Fonction helper pour créer rendez-vous + paiement
CREATE OR REPLACE FUNCTION create_historical_payment(
  p_first_name TEXT,
  p_last_name TEXT,
  p_date TIMESTAMPTZ,
  p_amount_cents INTEGER,
  p_method payment_method DEFAULT 'cash'
) RETURNS void AS $$
DECLARE
  v_client_id UUID;
  v_appointment_id UUID;
  v_service_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Récupérer l'ID du client
  SELECT id INTO v_client_id
  FROM clients
  WHERE first_name = p_first_name AND last_name = p_last_name
  LIMIT 1;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Client % % non trouvé', p_first_name, p_last_name;
  END IF;

  -- Créer le rendez-vous
  INSERT INTO appointments (
    client_id,
    starts_at,
    ends_at,
    buffer_ends_at,
    status,
    is_home_service,
    base_price_cents,
    birthday_discount_cents,
    loyalty_discount_cents,
    loyalty_points_used,
    final_price_cents,
    created_at
  ) VALUES (
    v_client_id,
    p_date,
    p_date + INTERVAL '60 minutes',  -- ends_at = starts_at + 60 min
    p_date + INTERVAL '75 minutes',  -- buffer_ends_at = starts_at + 60 + 15 min
    'completed',
    false,
    p_amount_cents,
    0,
    0,
    0,
    p_amount_cents,
    p_date
  ) RETURNING id INTO v_appointment_id;

  -- Créer le service associé
  INSERT INTO appointment_services (appointment_id, service_id, base_price_cents, duration_minutes, buffer_minutes)
  VALUES (
    v_appointment_id,
    v_service_id,
    p_amount_cents,
    60,
    15
  );

  -- Créer le paiement
  INSERT INTO payments (
    appointment_id,
    amount_cents,
    method,
    status,
    created_at
  ) VALUES (
    v_appointment_id,
    p_amount_cents,
    p_method,
    'success',
    p_date
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ÉTAPE 4 : Insérer tous les paiements historiques
-- ============================================================

-- 2025-02-12
SELECT create_historical_payment('Marie Pierre', 'Bonbony', '2025-02-12 13:55:54+01'::timestamptz, 5700, 'cash');
SELECT create_historical_payment('Marie José', 'Brusseau', '2025-02-12 14:40:05+01'::timestamptz, 1500, 'cash');
SELECT create_historical_payment('Marie Claude', 'Brispot', '2025-02-12 17:44:49+01'::timestamptz, 4000, 'cash');

-- 2025-02-19
SELECT create_historical_payment('Monique', 'Yve', '2025-02-19 11:15:02+01'::timestamptz, 1500, 'cash');
SELECT create_historical_payment('Marie-José', 'Cauchois', '2025-02-19 13:22:57+01'::timestamptz, 1700, 'cash');

-- 2025-02-20
SELECT create_historical_payment('Eva', 'Martin Afonso', '2025-02-20 12:11:07+01'::timestamptz, 3750, 'cash');
SELECT create_historical_payment('Nathalie', 'Feuillolay', '2025-02-20 18:44:13+01'::timestamptz, 3750, 'cash');

-- 2025-02-22
SELECT create_historical_payment('Louise', 'Dortignac', '2025-02-22 20:08:43+01'::timestamptz, 4250, 'cash');

-- 2025-02-24
SELECT create_historical_payment('Sandie', 'Martins Afonso', '2025-02-24 20:02:14+01'::timestamptz, 4250, 'cash');

-- 2025-02-26
SELECT create_historical_payment('Anthea', 'Cauchois', '2025-02-26 00:00:00+01'::timestamptz, 4800, 'cash');
SELECT create_historical_payment('Anthea', 'Cauchois', '2025-02-26 19:26:07+01'::timestamptz, 4500, 'cash');

-- 2025-03-03
SELECT create_historical_payment('Pauline', 'Chagneaud', '2025-03-03 19:47:33+01'::timestamptz, 7300, 'cash');

-- 2025-03-06
SELECT create_historical_payment('Manola', 'Techer Perez', '2025-03-06 19:02:42+01'::timestamptz, 4000, 'cash');

-- 2025-03-07
SELECT create_historical_payment('Isabelle', 'Caron', '2025-03-07 18:30:53+01'::timestamptz, 4500, 'cash');

-- 2025-03-10
SELECT create_historical_payment('Sylvie', 'Bonbony', '2025-03-10 18:47:44+01'::timestamptz, 3500, 'cash');

-- 2025-03-12
SELECT create_historical_payment('Marie-José', 'Cauchois', '2025-03-12 11:34:44+01'::timestamptz, 2132, 'cash');
SELECT create_historical_payment('Marie Pierre', 'Bonbony', '2025-03-12 10:57:13+01'::timestamptz, 8300, 'cash');

-- 2025-03-21
SELECT create_historical_payment('Leslie', 'Baron', '2025-03-21 19:16:57+01'::timestamptz, 3500, 'cash');

-- 2025-03-24
SELECT create_historical_payment('Nathalie', 'Feuillolay', '2025-03-24 19:34:32+01'::timestamptz, 3500, 'cash');

-- 2025-03-25
SELECT create_historical_payment('Louise', 'Dortignac', '2025-03-25 20:09:36+01'::timestamptz, 3750, 'cash');

-- 2025-03-26
SELECT create_historical_payment('Sandie', 'Martins Afonso', '2025-03-26 15:14:53+01'::timestamptz, 3750, 'cash');
SELECT create_historical_payment('Caroline', 'Letellier', '2025-03-26 16:54:47+01'::timestamptz, 4000, 'cash');

-- 2025-04-02
SELECT create_historical_payment('Marie-José', 'Cauchois', '2025-04-02 11:04:46+02'::timestamptz, 2132, 'cash');

-- 2025-04-03
SELECT create_historical_payment('Pauline', 'Chagneaud', '2025-04-03 11:18:09+02'::timestamptz, 7300, 'cash');
SELECT create_historical_payment('Dominique', 'Chagneaud', '2025-04-03 11:39:25+02'::timestamptz, 4100, 'cash');

-- 2025-04-07
SELECT create_historical_payment('Laure', 'Desquilles', '2025-04-07 18:52:16+02'::timestamptz, 2000, 'cash');

-- 2025-04-23
SELECT create_historical_payment('Marie-José', 'Cauchois', '2025-04-23 10:50:42+02'::timestamptz, 2132, 'cash');
SELECT create_historical_payment('Nathalie', 'Feuillolay', '2025-04-23 18:33:10+02'::timestamptz, 3500, 'cash');

-- 2025-05-05
SELECT create_historical_payment('Laure', 'Desquilles', '2025-05-05 19:00:40+02'::timestamptz, 2000, 'cash');

-- 2025-05-14
SELECT create_historical_payment('Caroline', 'Letellier', '2025-05-14 15:14:36+02'::timestamptz, 3750, 'cash');

-- 2025-05-21
SELECT create_historical_payment('Rayhana', 'Mh', '2025-05-21 09:39:31+02'::timestamptz, 3700, 'cash');

-- 2025-05-26
SELECT create_historical_payment('Louise', 'Dortignac', '2025-05-26 19:25:40+02'::timestamptz, 3750, 'cash');

-- 2025-05-28
SELECT create_historical_payment('Nathalie', 'Feuillolay', '2025-05-28 18:26:38+02'::timestamptz, 3750, 'cash');

-- 2025-06-05
SELECT create_historical_payment('Marie José', 'Brusseau', '2025-06-05 17:43:47+02'::timestamptz, 1500, 'cash');

-- 2025-06-26
SELECT create_historical_payment('Nathalie', 'Feuillolay', '2025-06-26 19:13:53+02'::timestamptz, 4750, 'cash');

-- 2025-06-27
SELECT create_historical_payment('Sylviane', 'Carlos', '2025-06-27 10:38:55+02'::timestamptz, 1200, 'cash');

-- 2025-07-02
SELECT create_historical_payment('Cloe', 'Guignard', '2025-07-02 14:56:10+02'::timestamptz, 3750, 'cash');

-- 2025-07-08
SELECT create_historical_payment('Pauline', 'Chagneaud', '2025-07-08 19:49:50+02'::timestamptz, 7300, 'cash');

-- 2025-07-09
SELECT create_historical_payment('Marie-José', 'Cauchois', '2025-07-09 11:00:02+02'::timestamptz, 6632, 'cash');
SELECT create_historical_payment('Caroline', 'Letellier', '2025-07-09 16:35:14+02'::timestamptz, 7750, 'cash');
SELECT create_historical_payment('Laetitia', 'Meuleunyser', '2025-07-09 19:31:32+02'::timestamptz, 4500, 'cash');

-- 2025-07-23
SELECT create_historical_payment('Nathalie', 'Feuillolay', '2025-07-23 18:41:42+02'::timestamptz, 3750, 'cash');
SELECT create_historical_payment('Tiphaine', 'Perimony', '2025-07-23 14:49:30+02'::timestamptz, 4250, 'cash');

-- 2025-07-25
SELECT create_historical_payment('Sylviane', 'Carlos', '2025-07-25 10:25:04+02'::timestamptz, 1200, 'cash');

-- 2025-07-30
SELECT create_historical_payment('Laetitia', 'Meuleunyser', '2025-07-30 19:34:16+02'::timestamptz, 4750, 'cash');

-- 2025-08-05
SELECT create_historical_payment('Pauline', 'Abgrall', '2025-08-05 19:38:56+02'::timestamptz, 4500, 'cash');

-- 2025-08-06
SELECT create_historical_payment('Cloe', 'Guignard', '2025-08-06 12:09:37+02'::timestamptz, 3750, 'cash');

-- 2025-08-21
SELECT create_historical_payment('Nathalie', 'Feuillolay', '2025-08-21 19:18:25+02'::timestamptz, 3750, 'cash');

-- 2025-08-22
SELECT create_historical_payment('Leslie', 'Baron', '2025-08-22 19:40:17+02'::timestamptz, 3500, 'cash');

-- 2025-08-27
SELECT create_historical_payment('Louise', 'Dortignac', '2025-08-27 14:22:56+02'::timestamptz, 4250, 'cash');
SELECT create_historical_payment('Sylviane', 'Carlos', '2025-08-27 10:36:28+02'::timestamptz, 5382, 'cash');

-- 2025-09-08
SELECT create_historical_payment('Isabelle', 'Caron', '2025-09-08 10:42:57+02'::timestamptz, 2132, 'cash');

-- 2025-09-10
SELECT create_historical_payment('Marie Pierre', 'Bonbony', '2025-09-10 17:16:00+02'::timestamptz, 7200, 'cash');
SELECT create_historical_payment('Tiphaine', 'Perimony', '2025-09-10 13:57:15+02'::timestamptz, 3500, 'cash');

-- 2025-09-11
SELECT create_historical_payment('Nathalie', 'Feuillolay', '2025-09-11 18:57:43+02'::timestamptz, 4750, 'cash');

-- 2025-09-18
SELECT create_historical_payment('Leslie', 'Baron', '2025-09-18 18:17:50+02'::timestamptz, 3750, 'cash');

-- ============================================================
-- ÉTAPE 5 : Nettoyer et réactiver les triggers
-- ============================================================

-- Supprimer les fonctions helper
DROP FUNCTION IF EXISTS create_historical_payment;
DROP FUNCTION IF EXISTS get_or_create_client;

-- Réactiver les triggers
SET session_replication_role = DEFAULT;

-- ============================================================
-- RÉSUMÉ
-- ============================================================

SELECT 
  COUNT(*) as total_paiements,
  SUM(amount_cents) / 100.0 as total_euros,
  MIN(created_at) as premier_paiement,
  MAX(created_at) as dernier_paiement
FROM payments
WHERE created_at < '2025-10-01'::timestamptz;

SELECT 
  COUNT(DISTINCT client_id) as nombre_clients
FROM appointments
WHERE created_at < '2025-10-01'::timestamptz;
