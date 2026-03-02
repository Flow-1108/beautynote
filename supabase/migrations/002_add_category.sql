-- ============================================================
-- Migration 002 : Ajout du champ 'category' à catalogue_services
-- ============================================================
-- Catégories identifiées :
--   Épilation, Forfait, Onglerie, Soins corps, Soins visage,
--   Maquillage, Coiffure femme, Plus beauté
-- ============================================================

ALTER TABLE catalogue_services
  ADD COLUMN category TEXT NOT NULL DEFAULT 'Autre';
