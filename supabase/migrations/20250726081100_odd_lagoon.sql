/*
  # Création de la table des résultats de sécurité

  1. Nouvelles Tables
    - `security_results`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, référence vers analyses)
      - `website_id` (uuid, référence vers websites)
      - `https_enabled` (boolean, HTTPS activé)
      - `ssl_certificate_valid` (boolean, certificat SSL valide)
      - `ssl_certificate_issuer` (text, émetteur du certificat)
      - `ssl_certificate_expires` (timestamptz, expiration du certificat)
      - `security_headers` (jsonb, headers de sécurité)
      - `vulnerabilities` (jsonb, vulnérabilités détectées)
      - `mixed_content` (boolean, contenu mixte détecté)
      - `security_score` (integer, score de sécurité 0-100)
      - `recommendations` (text[], recommandations de sécurité)
      - `analyzed_at` (timestamptz, date d'analyse)

  2. Sécurité
    - Enable RLS sur `security_results`
    - Politiques pour que les utilisateurs voient seulement leurs résultats
*/

CREATE TABLE IF NOT EXISTS security_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  https_enabled boolean DEFAULT false,
  ssl_certificate_valid boolean DEFAULT false,
  ssl_certificate_issuer text,
  ssl_certificate_expires timestamptz,
  security_headers jsonb DEFAULT '[]',
  vulnerabilities jsonb DEFAULT '[]',
  mixed_content boolean DEFAULT false,
  security_score integer,
  recommendations text[] DEFAULT '{}',
  analyzed_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT security_results_score_valid CHECK (security_score IS NULL OR (security_score >= 0 AND security_score <= 100)),
  CONSTRAINT security_results_ssl_expires_future CHECK (ssl_certificate_expires IS NULL OR ssl_certificate_expires > now())
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS security_results_analysis_id_idx ON security_results(analysis_id);
CREATE INDEX IF NOT EXISTS security_results_website_id_idx ON security_results(website_id);
CREATE INDEX IF NOT EXISTS security_results_https_idx ON security_results(https_enabled);
CREATE INDEX IF NOT EXISTS security_results_score_idx ON security_results(security_score DESC);
CREATE INDEX IF NOT EXISTS security_results_analyzed_at_idx ON security_results(analyzed_at DESC);

-- Enable RLS
ALTER TABLE security_results ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own security results"
  ON security_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = security_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own security results"
  ON security_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = security_results.website_id 
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own security results"
  ON security_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = security_results.website_id 
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w 
      WHERE w.id = security_results.website_id 
      AND w.user_id = auth.uid()
    )
  );