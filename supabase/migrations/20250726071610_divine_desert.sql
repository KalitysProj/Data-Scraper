/*
  # Création de la table des analyses

  1. Nouvelles Tables
    - `analyses`
      - `id` (uuid, primary key)
      - `website_id` (uuid, référence vers websites)
      - `user_id` (uuid, référence utilisateur)
      - `analysis_type` (enum, type d'analyse)
      - `status` (enum, statut de l'analyse)
      - `progress` (integer, progression 0-100)
      - `started_at` (timestamp, début d'analyse)
      - `completed_at` (timestamp, fin d'analyse)
      - `error_message` (text, message d'erreur)
      - `results` (jsonb, résultats de l'analyse)

  2. Sécurité
    - Enable RLS sur `analyses`
    - Politique pour que les utilisateurs voient seulement leurs analyses
*/

-- Création des enums
CREATE TYPE analysis_type AS ENUM ('seo', 'performance', 'security', 'forms', 'links', 'accessibility');
CREATE TYPE analysis_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Création de la table analyses
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  analysis_type analysis_type NOT NULL,
  status analysis_status DEFAULT 'pending',
  progress integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  results jsonb,
  
  -- Contraintes
  CONSTRAINT analyses_progress_valid CHECK (progress >= 0 AND progress <= 100),
  CONSTRAINT analyses_completed_at_after_started CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS analyses_website_id_idx ON analyses(website_id);
CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON analyses(user_id);
CREATE INDEX IF NOT EXISTS analyses_type_idx ON analyses(analysis_type);
CREATE INDEX IF NOT EXISTS analyses_status_idx ON analyses(status);
CREATE INDEX IF NOT EXISTS analyses_started_at_idx ON analyses(started_at DESC);

-- Enable RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs voient seulement leurs analyses
CREATE POLICY "Users can manage their own analyses"
  ON analyses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);