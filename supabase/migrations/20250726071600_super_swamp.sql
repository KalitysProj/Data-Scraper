/*
  # Création de la table des sites web découverts

  1. Nouvelles Tables
    - `websites`
      - `id` (uuid, primary key)
      - `url` (text, URL complète du site)
      - `domain` (text, domaine principal)
      - `title` (text, titre de la page d'accueil)
      - `meta_description` (text, meta description)
      - `discovered_at` (timestamp, date de découverte)
      - `last_scraped` (timestamp, dernière analyse)
      - `page_count` (integer, nombre de pages découvertes)
      - `status` (enum, statut du scraping)
      - `user_id` (uuid, référence utilisateur)
      - `scraping_data` (jsonb, données brutes du scraping)

  2. Sécurité
    - Enable RLS sur `websites`
    - Politique pour que les utilisateurs voient seulement leurs sites
*/

-- Création de l'enum pour le statut
CREATE TYPE website_status AS ENUM ('discovered', 'scraped', 'error');

-- Création de la table websites
CREATE TABLE IF NOT EXISTS websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  domain text NOT NULL,
  title text,
  meta_description text,
  discovered_at timestamptz DEFAULT now(),
  last_scraped timestamptz,
  page_count integer DEFAULT 0,
  status website_status DEFAULT 'discovered',
  user_id uuid NOT NULL,
  scraping_data jsonb,
  
  -- Contraintes
  CONSTRAINT websites_url_unique UNIQUE (url, user_id),
  CONSTRAINT websites_url_valid CHECK (url ~ '^https?://'),
  CONSTRAINT websites_page_count_positive CHECK (page_count >= 0)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS websites_user_id_idx ON websites(user_id);
CREATE INDEX IF NOT EXISTS websites_domain_idx ON websites(domain);
CREATE INDEX IF NOT EXISTS websites_status_idx ON websites(status);
CREATE INDEX IF NOT EXISTS websites_discovered_at_idx ON websites(discovered_at DESC);

-- Enable RLS
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs voient seulement leurs sites
CREATE POLICY "Users can manage their own websites"
  ON websites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);