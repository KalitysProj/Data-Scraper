/*
  # Création de la table des résultats d'accessibilité

  1. Nouvelles Tables
    - `accessibility_results`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, référence vers analyses)
      - `website_id` (uuid, référence vers websites)
      - `accessibility_score` (integer, score d'accessibilité 0-100)
      - `wcag_level` (text, niveau WCAG atteint)
      - `issues_critical` (integer, issues critiques)
      - `issues_major` (integer, issues majeures)
      - `issues_minor` (integer, issues mineures)
      - `issues_details` (jsonb, détails des issues)
      - `color_contrast_issues` (integer, problèmes de contraste)
      - `keyboard_navigation_score` (integer, score navigation clavier)
      - `screen_reader_compatibility` (integer, compatibilité lecteurs d'écran)
      - `alt_text_coverage` (numeric, couverture alt text en %)
      - `form_labels_coverage` (numeric, couverture labels formulaires en %)
      - `heading_structure_score` (integer, score structure des titres)
      - `recommendations` (text[], recommandations)
      - `analyzed_at` (timestamptz, date d'analyse)

  2. Sécurité
    - Enable RLS sur `accessibility_results`
    - Politiques pour que les utilisateurs voient seulement leurs résultats
*/

CREATE TABLE IF NOT EXISTS accessibility_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  accessibility_score integer,
  wcag_level text,
  issues_critical integer DEFAULT 0,
  issues_major integer DEFAULT 0,
  issues_minor integer DEFAULT 0,
  issues_details jsonb DEFAULT '[]',
  color_contrast_issues integer DEFAULT 0,
  keyboard_navigation_score integer,
  screen_reader_compatibility integer,
  alt_text_coverage numeric(5,2),
  form_labels_coverage numeric(5,2),
  heading_structure_score integer,
  recommendations text[] DEFAULT '{}',
  analyzed_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT accessibility_results_score_valid CHECK (accessibility_score IS NULL OR (accessibility_score >= 0 AND accessibility_score <= 100)),
  CONSTRAINT accessibility_results_issues_positive CHECK (issues_critical >= 0 AND issues_major >= 0 AND issues_minor >= 0),
  CONSTRAINT accessibility_results_contrast_issues_positive CHECK (color_contrast_issues >= 0),
  CONSTRAINT accessibility_results_keyboard_score_valid CHECK (keyboard_navigation_score IS NULL OR (keyboard_navigation_score >= 0 AND keyboard_navigation_score <= 100)),
  CONSTRAINT accessibility_results_screen_reader_score_valid CHECK (screen_reader_compatibility IS NULL OR (screen_reader_compatibility >= 0 AND screen_reader_compatibility <= 100)),
  CONSTRAINT accessibility_results_alt_coverage_valid CHECK (alt_text_coverage IS NULL OR (alt_text_coverage >= 0 AND alt_text_coverage <= 100)),
  CONSTRAINT accessibility_results_form_coverage_valid CHECK (form_labels_coverage IS NULL OR (form_labels_coverage >= 0 AND form_labels_coverage <= 100)),
  CONSTRAINT accessibility_results_heading_score_valid CHECK (heading_structure_score IS NULL OR (heading_structure_score >= 0 AND heading_structure_score <= 100)),
  CONSTRAINT accessibility_results_wcag_level_valid CHECK (wcag_level IS NULL OR wcag_level IN ('A', 'AA', 'AAA'))
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS accessibility_results_analysis_id_idx ON accessibility_results(analysis_id);
CREATE INDEX IF NOT EXISTS accessibility_results_website_id_idx ON accessibility_results(website_id);
CREATE INDEX IF NOT EXISTS accessibility_results_score_idx ON accessibility_results(accessibility_score DESC);
CREATE INDEX IF NOT EXISTS accessibility_results_wcag_level_idx ON accessibility_results(wcag_level);
CREATE INDEX IF NOT EXISTS accessibility_results_analyzed_at_idx ON accessibility_results(analyzed_at DESC);

-- Enable RLS
ALTER TABLE accessibility_results ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own accessibility results"
  ON accessibility_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = accessibility_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own accessibility results"
  ON accessibility_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = accessibility_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own accessibility results"
  ON accessibility_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = accessibility_results.website_id 
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = accessibility_results.website_id 
      AND w.user_id = auth.uid()
    )
  );