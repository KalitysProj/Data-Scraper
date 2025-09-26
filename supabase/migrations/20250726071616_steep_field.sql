/*
  # Création de la table des résultats SEO

  1. Nouvelles Tables
    - `seo_results`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, référence vers analyses)
      - `website_id` (uuid, référence vers websites)
      - `score` (integer, score SEO 0-100)
      - `title` (text, titre de la page)
      - `title_length` (integer, longueur du titre)
      - `meta_description` (text, meta description)
      - `meta_description_length` (integer, longueur meta description)
      - `h1_tags` (text[], balises H1)
      - `h2_tags` (text[], balises H2)
      - `word_count` (integer, nombre de mots)
      - `images_total` (integer, nombre total d'images)
      - `images_without_alt` (integer, images sans alt)
      - `internal_links` (integer, liens internes)
      - `external_links` (integer, liens externes)
      - `canonical_url` (text, URL canonique)
      - `og_tags` (jsonb, balises Open Graph)
      - `issues` (jsonb, problèmes détectés)
      - `recommendations` (text[], recommandations)
      - `analyzed_at` (timestamp, date d'analyse)

  2. Sécurité
    - Enable RLS sur `seo_results`
    - Politique pour que les utilisateurs voient seulement leurs résultats
*/

-- Création de la table seo_results
CREATE TABLE IF NOT EXISTS seo_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  score integer NOT NULL,
  title text,
  title_length integer,
  meta_description text,
  meta_description_length integer,
  h1_tags text[] DEFAULT '{}',
  h2_tags text[] DEFAULT '{}',
  word_count integer DEFAULT 0,
  images_total integer DEFAULT 0,
  images_without_alt integer DEFAULT 0,
  internal_links integer DEFAULT 0,
  external_links integer DEFAULT 0,
  canonical_url text,
  og_tags jsonb DEFAULT '{}',
  issues jsonb DEFAULT '[]',
  recommendations text[] DEFAULT '{}',
  analyzed_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT seo_results_score_valid CHECK (score >= 0 AND score <= 100),
  CONSTRAINT seo_results_title_length_valid CHECK (title_length IS NULL OR title_length >= 0),
  CONSTRAINT seo_results_meta_length_valid CHECK (meta_description_length IS NULL OR meta_description_length >= 0),
  CONSTRAINT seo_results_word_count_positive CHECK (word_count >= 0),
  CONSTRAINT seo_results_images_positive CHECK (images_total >= 0 AND images_without_alt >= 0),
  CONSTRAINT seo_results_links_positive CHECK (internal_links >= 0 AND external_links >= 0)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS seo_results_analysis_id_idx ON seo_results(analysis_id);
CREATE INDEX IF NOT EXISTS seo_results_website_id_idx ON seo_results(website_id);
CREATE INDEX IF NOT EXISTS seo_results_score_idx ON seo_results(score DESC);
CREATE INDEX IF NOT EXISTS seo_results_analyzed_at_idx ON seo_results(analyzed_at DESC);

-- Enable RLS
ALTER TABLE seo_results ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs voient seulement leurs résultats SEO
CREATE POLICY "Users can view their own SEO results"
  ON seo_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = seo_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

-- Politique RLS : les utilisateurs peuvent insérer leurs résultats SEO
CREATE POLICY "Users can insert their own SEO results"
  ON seo_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = seo_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

-- Politique RLS : les utilisateurs peuvent modifier leurs résultats SEO
CREATE POLICY "Users can update their own SEO results"
  ON seo_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = seo_results.website_id 
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = seo_results.website_id 
      AND w.user_id = auth.uid()
    )
  );