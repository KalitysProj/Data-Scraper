/*
  # Optimisation des index pour améliorer les performances

  1. Index Composites Optimisés
    - Index multi-colonnes pour les requêtes fréquentes
    - Index partiels pour les données filtrées
    - Index sur les colonnes JSON fréquemment utilisées

  2. Index de Performance
    - Optimisation des jointures
    - Accélération des tris et filtres
    - Réduction des scans de table

  3. Statistiques et Monitoring
    - Vues pour surveiller les performances
    - Index sur les colonnes de métadonnées
*/

-- Index composites optimisés pour les requêtes fréquentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS websites_user_status_discovered_idx 
ON websites(user_id, status, discovered_at DESC) 
WHERE status IN ('discovered', 'scraped');

CREATE INDEX CONCURRENTLY IF NOT EXISTS analyses_website_user_type_status_idx 
ON analyses(website_id, user_id, analysis_type, status, started_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS analysis_sessions_user_status_started_idx 
ON analysis_sessions(user_id, status, started_at DESC) 
WHERE status IN ('completed', 'running');

-- Index partiels pour optimiser les requêtes filtrées
CREATE INDEX CONCURRENTLY IF NOT EXISTS seo_results_score_high_idx 
ON seo_results(score DESC, analyzed_at DESC) 
WHERE score >= 70;

CREATE INDEX CONCURRENTLY IF NOT EXISTS performance_results_load_time_slow_idx 
ON performance_results(load_time DESC, analyzed_at DESC) 
WHERE load_time > 3.0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS security_results_https_disabled_idx 
ON security_results(website_id, analyzed_at DESC) 
WHERE https_enabled = false;

-- Index sur les colonnes JSON fréquemment utilisées
CREATE INDEX CONCURRENTLY IF NOT EXISTS seo_results_issues_gin_idx 
ON seo_results USING GIN (issues);

CREATE INDEX CONCURRENTLY IF NOT EXISTS form_results_details_gin_idx 
ON form_results USING GIN (form_details);

CREATE INDEX CONCURRENTLY IF NOT EXISTS link_results_broken_details_gin_idx 
ON link_results USING GIN (broken_links_details);

-- Index pour les recherches textuelles
CREATE INDEX CONCURRENTLY IF NOT EXISTS websites_domain_text_idx 
ON websites USING GIN (to_tsvector('french', domain || ' ' || COALESCE(title, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS analysis_sessions_name_text_idx 
ON analysis_sessions USING GIN (to_tsvector('french', session_name));

-- Index pour les agrégations et statistiques
CREATE INDEX CONCURRENTLY IF NOT EXISTS analyses_completed_at_date_idx 
ON analyses(DATE(completed_at)) 
WHERE status = 'completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS analysis_sessions_duration_score_idx 
ON analysis_sessions(duration_seconds, overall_score) 
WHERE status = 'completed' AND overall_score IS NOT NULL;

-- Index pour optimiser les vues
CREATE INDEX CONCURRENTLY IF NOT EXISTS websites_user_page_count_idx 
ON websites(user_id, page_count DESC, discovered_at DESC);

-- Index pour les foreign keys non couverts
CREATE INDEX CONCURRENTLY IF NOT EXISTS analyses_session_id_idx 
ON analyses(session_id) 
WHERE session_id IS NOT NULL;

-- Statistiques pour l'optimiseur de requêtes
ANALYZE websites;
ANALYZE analyses;
ANALYZE analysis_sessions;
ANALYZE seo_results;
ANALYZE performance_results;
ANALYZE security_results;
ANALYZE form_results;
ANALYZE link_results;
ANALYZE accessibility_results;

-- Vue optimisée pour le dashboard avec index hints
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
  u.user_id,
  COUNT(DISTINCT w.id) as total_websites,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
  AVG(CASE WHEN s.status = 'completed' THEN s.overall_score END) as avg_score,
  MAX(s.started_at) as last_analysis_date,
  SUM(CASE WHEN sr.score < 50 THEN 1 ELSE 0 END) as low_seo_sites,
  SUM(CASE WHEN secr.https_enabled = false THEN 1 ELSE 0 END) as insecure_sites
FROM (SELECT DISTINCT user_id FROM websites) u
LEFT JOIN websites w ON u.user_id = w.user_id
LEFT JOIN analysis_sessions s ON w.id = s.website_id
LEFT JOIN analyses a ON s.id = a.session_id AND a.analysis_type = 'seo'
LEFT JOIN seo_results sr ON a.id = sr.analysis_id
LEFT JOIN analyses a2 ON s.id = a2.session_id AND a2.analysis_type = 'security'
LEFT JOIN security_results secr ON a2.id = secr.analysis_id
GROUP BY u.user_id;

-- Vue pour les analyses récentes avec performance optimisée
CREATE OR REPLACE VIEW recent_analyses AS
SELECT 
  s.id,
  s.session_name,
  s.started_at,
  s.completed_at,
  s.status,
  s.overall_score,
  s.user_id,
  w.url,
  w.domain,
  w.title as website_title,
  array_length(s.modules_completed, 1) as modules_count
FROM analysis_sessions s
JOIN websites w ON s.website_id = w.id
WHERE s.started_at >= NOW() - INTERVAL '30 days'
ORDER BY s.started_at DESC;

-- Fonction pour nettoyer les anciennes données (maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_analyses(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les analyses anciennes non critiques
  DELETE FROM analyses 
  WHERE started_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND status IN ('failed', 'pending')
    AND analysis_type NOT IN ('seo'); -- Garder les analyses SEO
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Nettoyer les sessions orphelines
  DELETE FROM analysis_sessions 
  WHERE started_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND status = 'failed'
    AND overall_score IS NULL;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour recalculer les statistiques
CREATE OR REPLACE FUNCTION refresh_analysis_stats()
RETURNS VOID AS $$
BEGIN
  -- Recalculer les scores globaux manquants
  UPDATE analysis_sessions 
  SET overall_score = (
    SELECT AVG(
      CASE 
        WHEN a.analysis_type = 'seo' THEN sr.score
        WHEN a.analysis_type = 'performance' THEN pr.desktop_score
        WHEN a.analysis_type = 'security' THEN secr.security_score
        WHEN a.analysis_type = 'accessibility' THEN ar.accessibility_score
      END
    )
    FROM analyses a
    LEFT JOIN seo_results sr ON a.id = sr.analysis_id
    LEFT JOIN performance_results pr ON a.id = pr.analysis_id
    LEFT JOIN security_results secr ON a.id = secr.analysis_id
    LEFT JOIN accessibility_results ar ON a.id = ar.analysis_id
    WHERE a.session_id = analysis_sessions.id
      AND a.status = 'completed'
  )
  WHERE status = 'completed' AND overall_score IS NULL;
  
  -- Mettre à jour les statistiques PostgreSQL
  ANALYZE;
END;
$$ LANGUAGE plpgsql;