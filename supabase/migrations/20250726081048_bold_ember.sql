/*
  # Création de la table des résultats de performance

  1. Nouvelles Tables
    - `performance_results`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, référence vers analyses)
      - `website_id` (uuid, référence vers websites)
      - `load_time` (numeric, temps de chargement en secondes)
      - `content_size` (bigint, taille du contenu en bytes)
      - `resource_count` (integer, nombre de ressources)
      - `compression_enabled` (boolean, compression activée)
      - `cache_headers` (boolean, headers de cache présents)
      - `core_web_vitals` (jsonb, métriques Core Web Vitals)
      - `opportunities` (jsonb, opportunités d'amélioration)
      - `desktop_score` (integer, score PageSpeed Desktop)
      - `mobile_score` (integer, score PageSpeed Mobile)
      - `analyzed_at` (timestamptz, date d'analyse)

  2. Sécurité
    - Enable RLS sur `performance_results`
    - Politiques pour que les utilisateurs voient seulement leurs résultats
*/

CREATE TABLE IF NOT EXISTS performance_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  load_time numeric(8,3) NOT NULL,
  content_size bigint DEFAULT 0,
  resource_count integer DEFAULT 0,
  compression_enabled boolean DEFAULT false,
  cache_headers boolean DEFAULT false,
  core_web_vitals jsonb DEFAULT '{}',
  opportunities jsonb DEFAULT '[]',
  desktop_score integer,
  mobile_score integer,
  analyzed_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT performance_results_load_time_positive CHECK (load_time >= 0),
  CONSTRAINT performance_results_content_size_positive CHECK (content_size >= 0),
  CONSTRAINT performance_results_resource_count_positive CHECK (resource_count >= 0),
  CONSTRAINT performance_results_desktop_score_valid CHECK (desktop_score IS NULL OR (desktop_score >= 0 AND desktop_score <= 100)),
  CONSTRAINT performance_results_mobile_score_valid CHECK (mobile_score IS NULL OR (mobile_score >= 0 AND mobile_score <= 100))
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS performance_results_analysis_id_idx ON performance_results(analysis_id);
CREATE INDEX IF NOT EXISTS performance_results_website_id_idx ON performance_results(website_id);
CREATE INDEX IF NOT EXISTS performance_results_load_time_idx ON performance_results(load_time);
CREATE INDEX IF NOT EXISTS performance_results_analyzed_at_idx ON performance_results(analyzed_at DESC);

-- Enable RLS
ALTER TABLE performance_results ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own performance results"
  ON performance_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = performance_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own performance results"
  ON performance_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = performance_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own performance results"
  ON performance_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = performance_results.website_id 
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = performance_results.website_id 
      AND w.user_id = auth.uid()
    )
  );