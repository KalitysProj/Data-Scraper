/*
  # Création de la table des résultats de formulaires

  1. Nouvelles Tables
    - `form_results`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, référence vers analyses)
      - `website_id` (uuid, référence vers websites)
      - `forms_found` (integer, nombre de formulaires trouvés)
      - `forms_working` (integer, formulaires fonctionnels)
      - `forms_broken` (integer, formulaires cassés)
      - `has_captcha` (boolean, présence de CAPTCHA)
      - `captcha_type` (text, type de CAPTCHA)
      - `captcha_provider` (text, fournisseur CAPTCHA)
      - `form_details` (jsonb, détails des formulaires)
      - `email_destinations` (text[], destinations email détectées)
      - `validation_issues` (jsonb, problèmes de validation)
      - `accessibility_score` (integer, score accessibilité formulaires)
      - `recommendations` (text[], recommandations)
      - `analyzed_at` (timestamptz, date d'analyse)

  2. Sécurité
    - Enable RLS sur `form_results`
    - Politiques pour que les utilisateurs voient seulement leurs résultats
*/

CREATE TABLE IF NOT EXISTS form_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  forms_found integer DEFAULT 0,
  forms_working integer DEFAULT 0,
  forms_broken integer DEFAULT 0,
  has_captcha boolean DEFAULT false,
  captcha_type text,
  captcha_provider text,
  form_details jsonb DEFAULT '[]',
  email_destinations text[] DEFAULT '{}',
  validation_issues jsonb DEFAULT '[]',
  accessibility_score integer,
  recommendations text[] DEFAULT '{}',
  analyzed_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT form_results_forms_found_positive CHECK (forms_found >= 0),
  CONSTRAINT form_results_forms_working_positive CHECK (forms_working >= 0),
  CONSTRAINT form_results_forms_broken_positive CHECK (forms_broken >= 0),
  CONSTRAINT form_results_forms_consistency CHECK (forms_working + forms_broken <= forms_found),
  CONSTRAINT form_results_accessibility_score_valid CHECK (accessibility_score IS NULL OR (accessibility_score >= 0 AND accessibility_score <= 100))
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS form_results_analysis_id_idx ON form_results(analysis_id);
CREATE INDEX IF NOT EXISTS form_results_website_id_idx ON form_results(website_id);
CREATE INDEX IF NOT EXISTS form_results_forms_found_idx ON form_results(forms_found);
CREATE INDEX IF NOT EXISTS form_results_has_captcha_idx ON form_results(has_captcha);
CREATE INDEX IF NOT EXISTS form_results_analyzed_at_idx ON form_results(analyzed_at DESC);

-- Enable RLS
ALTER TABLE form_results ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own form results"
  ON form_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = form_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own form results"
  ON form_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = form_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own form results"
  ON form_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = form_results.website_id 
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = form_results.website_id 
      AND w.user_id = auth.uid()
    )
  );