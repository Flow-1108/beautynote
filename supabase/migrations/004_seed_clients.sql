-- ============================================================
-- Migration 004 : Import des 43 clients existants
-- ============================================================
-- Dates en 2025 ignorées (ce ne sont pas des anniversaires).
-- '-' → NULL pour email et adresse.
-- Points de fidélité importés tels quels.
-- ============================================================

INSERT INTO clients (first_name, last_name, birthday, email, phone, loyalty_points, address) VALUES
  ('Dominique',    'Chagneaud',        NULL,         NULL,                                '0610142187',  2, NULL),
  ('Nathalie',     'Feuillolay',       NULL,         NULL,                                '0661731949', 18, NULL),
  ('Anthea',       'Cauchois',         '1999-03-18', 'anthea.cauchois@gmail.com',         '0795289401',  6, '116 rue Albert Thomas Petit-quevilly'),
  ('Pauline',      'Abgrall',          NULL,         NULL,                                '0620730912',  3, NULL),
  ('Alexandra',    'Feuillolay',       NULL,         NULL,                                '06060606',    0, NULL),
  ('Aline',        'Le Roux',          '1970-02-25', 'alineleroux76300@gmail.com',        '0659292281',  0, '7 rue marius vallée 76300 Sotteville-lès-Rouen'),
  ('Laetitia',     'Meuleunyser',      NULL,         NULL,                                '0635147544',  6, NULL),
  ('Katell',       'Lavenu',           NULL,         NULL,                                '0606060606',  0, NULL),
  ('Marie Pierre', 'Bonbony',          '1972-02-15', 'bonbonymariepierre@gmail.com',      '0684335506', 15, '70 rue victor Bertel 76300 Sotteville-lès-Rouen'),
  ('Isabelle',     'Caron',            NULL,         NULL,                                '0633011086',  4, NULL),
  ('Marie José',   'Brusseau',         '1949-06-21', 'mariejose.brusseau@orange.fr',      '0661547871',  2, '222 rue saint Julien 76100 Rouen'),
  ('Monique',      'Yve',              NULL,         NULL,                                '0622695661',  1, NULL),
  ('Eva',          'Martin Afonso',    '2003-03-25', NULL,                                '0772320859',  5, NULL),
  ('Sylvie',       'Bonbony',          NULL,         NULL,                                '0615758696',  2, NULL),
  ('Alizee',       'Toussaint',        '2004-10-13', NULL,                                '0784259467',  0, NULL),
  ('Rayhana',      'Mh',              NULL,         NULL,                                '0698279142',  2, NULL),
  ('Cloe',         'Guignard',         NULL,         NULL,                                '0658504984',  4, NULL),
  ('Murielle',     'Lachevre',         NULL,         NULL,                                '0603397052',  0, NULL),
  ('Catherine',    'Da Silva Carlos',  NULL,         NULL,                                '0648595477',  0, NULL),
  ('Sylvie',       'Dortignac',        '1960-11-22', NULL,                                '0688325527',  0, NULL),
  ('Oceane',       'Feuillolay',       NULL,         NULL,                                '0606060606',  0, NULL),
  ('Sylviane',     'Carlos',           NULL,         NULL,                                '0671414227',  3, NULL),
  ('Marie-José',   'Cauchois',         '1951-09-12', 'mariejo-serge@laposte.net',         '0610477347',  8, '103 rue pierre corneille 76300 Sotteville-lès-Rouen'),
  ('Christa',      'Cauchois',         '1971-12-30', NULL,                                '0652780189',  0, NULL),
  ('Leslie',       'Baron',            NULL,         NULL,                                '0624071593', 16, NULL),
  ('Laure',        'Desquilles',       NULL,         NULL,                                '0658736900',  6, NULL),
  ('Benoit',       'Marger',           '1981-04-16', NULL,                                '0662294643',  0, NULL),
  ('Caroline',     'Letellier',        '1991-11-03', NULL,                                '0787205609',  9, NULL),
  ('Manola',       'Techer Perez',     NULL,         NULL,                                '0662370442',  2, NULL),
  ('Lucie',        'Guignard',         NULL,         NULL,                                '0699747125',  0, NULL),
  ('Chantal',      'Follin',           '1950-06-04', NULL,                                '0782063732',  0, NULL),
  ('Sandie',       'Martins Afonso',   '1979-11-02', NULL,                                '0603636608',  4, NULL),
  ('Lisa',         'Denis',            NULL,         NULL,                                '0672596185',  0, NULL),
  ('Ingrid',       'Heranval',         NULL,         NULL,                                '0650565779',  0, NULL),
  ('Ludivine',     'l''hommel',        NULL,         'l.peltier76@gmail.com',             '0665570280',  0, NULL),
  ('Marie Claude', 'Brispot',          '1962-12-23', 'mclaudebrispot@gmail.com',          '0632615938',  2, NULL),
  ('Celine',       'Corbet',           '1998-08-05', NULL,                                '0695086442',  0, NULL),
  ('Nolwenn',      'Breton',           '1988-08-22', NULL,                                '0641556665',  0, NULL),
  ('Tiphaine',     'Perimony',         NULL,         NULL,                                '0630485781',  4, NULL),
  ('Louise',       'Dortignac',        '2002-06-20', NULL,                                '0788999890', 28, NULL),
  ('Isabelle',     'Le Bon',           NULL,         NULL,                                '0695466885',  0, NULL),
  ('Angelique',    'Boete',            '1984-05-10', NULL,                                '0626798574',  0, NULL),
  ('Pauline',      'Chagneaud',        NULL,         NULL,                                '0619505361', 27, NULL);
