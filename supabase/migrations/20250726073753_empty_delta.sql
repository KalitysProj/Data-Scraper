/*
  # Création de la table des sessions d'analyse avec horodatage précis

  1. Nouvelles Tables
    - `analysis_sessions`
      - `id` (uuid, primary key)
      - `website_id` (uuid, référence vers websites)
      - `user_id` (uuid, référence utilisateur)
      - `session_name` (text, nom de la session)
      - `started_at` (timestamptz, début avec millisecondes)
      - `completed_at` (timestamptz, fin avec millisecondes)
      - `duration_seconds` (integer, durée totale)
      - `status` (enum, statut de la session)
      - `modules_selected` (text[], modules choisis)
      - `modules_completed` (text[], modules terminés)
      - `overall_score` (integer, score global)
      - `summary` (jsonb, résumé des résultats)
      - `metadata` (jsonb, métadonnées additionnelles)

  2. Modifications
    - Mise à jour de la table `analyses` pour référencer `analysis_sessions`
    - Ajout d'index pour les performances
    - Relations entre toutes les tables

  3. Sécurité
    - Enable RLS sur `analysis_sessions`
    - Politiques pour que les utilisateurs voient seulement leurs sessions
*/

-- Création de l'enum pour le statut des sessions
CREATE TYPE session_status AS ENUM ('created', 'running', 'completed', 'failed', 'cancelled');

-- Création de la table analysis_sessions
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_name text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_seconds integer,
  status session_status DEFAULT 'created',
  modules_selected text[] DEFAULT '{}',
  modules_completed text[] DEFAULT '{}',
  overall_score integer,
  summary jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  
  -- Contraintes
  CONSTRAINT analysis_sessions_duration_positive CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  CONSTRAINT analysis_sessions_score_valid CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)),
  CONSTRAINT analysis_sessions_completed_after_started CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Ajout de la colonne session_id à la table analyses existante
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES analysis_sessions(id) ON DELETE CASCADE;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS analysis_sessions_website_id_idx ON analysis_sessions(website_id);
CREATE INDEX IF NOT EXISTS analysis_sessions_user_id_idx ON analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS analysis_sessions_status_idx ON analysis_sessions(status);
CREATE INDEX IF NOT EXISTS analysis_sessions_started_at_idx ON analysis_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS analysis_sessions_completed_at_idx ON analysis_sessions(completed_at DESC);
CREATE INDEX IF NOT EXISTS analysis_sessions_duration_idx ON analysis_sessions(duration_seconds DESC);

-- Index sur la nouvelle colonne session_id dans analyses
CREATE INDEX IF NOT EXISTS analyses_session_id_idx ON analyses(session_id);

-- Enable RLS
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs voient seulement leurs sessions
CREATE POLICY "Users can manage their own analysis sessions"
  ON analysis_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vue pour les statistiques des sessions
CREATE OR REPLACE VIEW analysis_session_stats AS
SELECT 
  s.id,
  s.session_name,
  s.started_at,
  s.completed_at,
  s.duration_seconds,
  s.status,
  s.overall_score,
  w.url as website_url,
  w.domain as website_domain,
  w.title as website_title,
  array_length(s.modules_selected, 1) as modules_total,
  array_length(s.modules_completed, 1) as modules_done,
  CASE 
    WHEN array_length(s.modules_selected, 1) > 0 
    THEN (array_length(s.modules_completed, 1)::float / array_length(s.modules_selected, 1)::float * 100)::integer
    ELSE 0 
  END as completion_percentage
FROM analysis_sessions s
JOIN websites w ON s.website_id = w.id;

-- Fonction pour calculer automatiquement la durée
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::integer;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement la durée
CREATE TRIGGER update_analysis_session_duration
  BEFORE UPDATE ON analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_duration();