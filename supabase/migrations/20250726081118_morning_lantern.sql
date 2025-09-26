/*
  # Création de la table des résultats de liens

  1. Nouvelles Tables
    - `link_results`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, référence vers analyses)
      - `website_id` (uuid, référence vers websites)
      - `total_links` (integer, nombre total de liens)
      - `internal_links` (integer, liens internes)
      - `external_links` (integer, liens externes)
      - `broken_links` (integer, liens cassés)
      - `redirect_links` (integer, liens avec redirections)
      - `broken_links_details` (jsonb, détails des liens cassés)
      - `redirect_chains` (jsonb, chaînes de redirections)
      - `anchor_analysis` (jsonb, analyse des textes d'ancre)
      - `link_juice_distribution` (jsonb, distribution du link juice)
      - `recommendations` (text[], recommandations)
      - `analyzed_at` (timestamptz, date d'analyse)

  2. Sécurité
    - Enable RLS sur `link_results`
    - Politiques pour que les utilisateurs voient seulement leurs résultats
*/

CREATE TABLE IF NOT EXISTS link_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  total_links integer DEFAULT 0,
  internal_links integer DEFAULT 0,
  external_links integer DEFAULT 0,
  broken_links integer DEFAULT 0,
  redirect_links integer DEFAULT 0,
  broken_links_details jsonb DEFAULT '[]',
  redirect_chains jsonb DEFAULT '[]',
  anchor_analysis jsonb DEFAULT '{}',
  link_juice_distribution jsonb DEFAULT '{}',
  recommendations text[] DEFAULT '{}',
  analyzed_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT link_results_total_links_positive CHECK (total_links >= 0),
  CONSTRAINT link_results_internal_links_positive CHECK (internal_links >= 0),
  CONSTRAINT link_results_external_links_positive CHECK (external_links >= 0),
  CONSTRAINT link_results_broken_links_positive CHECK (broken_links >= 0),
  CONSTRAINT link_results_redirect_links_positive CHECK (redirect_links >= 0),
  CONSTRAINT link_results_links_consistency CHECK (internal_links + external_links <= total_links),
  CONSTRAINT link_results_broken_links_consistency CHECK (broken_links <= total_links)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS link_results_analysis_id_idx ON link_results(analysis_id);
CREATE INDEX IF NOT EXISTS link_results_website_id_idx ON link_results(website_id);
CREATE INDEX IF NOT EXISTS link_results_total_links_idx ON link_results(total_links);
CREATE INDEX IF NOT EXISTS link_results_broken_links_idx ON link_results(broken_links);
CREATE INDEX IF NOT EXISTS link_results_analyzed_at_idx ON link_results(analyzed_at DESC);

-- Enable RLS
ALTER TABLE link_results ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own link results"
  ON link_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = link_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own link results"
  ON link_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = link_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own link results"
  ON link_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = link_results.website_id 
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = link_results.website_id 
      AND w.user_id = auth.uid()
    )
  );