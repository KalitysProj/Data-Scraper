/*
  # Création de vues pour résumé d'analyse complète

  1. Vues créées
    - `analysis_summary` - Vue complète de toutes les analyses
    - `website_analysis_stats` - Statistiques par site web
    - `user_analysis_dashboard` - Dashboard utilisateur

  2. Fonctionnalités
    - Agrégation de tous les résultats d'analyse
    - Calcul automatique des scores moyens
    - Statistiques de progression
    - Données pour dashboard
*/

-- Vue complète des analyses avec tous les résultats
CREATE OR REPLACE VIEW analysis_summary AS
SELECT 
  a.id as analysis_id,
  a.website_id,
  a.user_id,
  a.analysis_type,
  a.status,
  a.progress,
  a.started_at,
  a.completed_at,
  w.url as website_url,
  w.domain as website_domain,
  w.title as website_title,
  
  -- Résultats SEO
  sr.score as seo_score,
  sr.title_tag,
  sr.meta_description,
  sr.word_count,
  sr.images_total,
  sr.images_without_alt,
  sr.internal_links as seo_internal_links,
  sr.external_links as seo_external_links,
  
  -- Résultats Performance
  pr.load_time,
  pr.content_size,
  pr.desktop_score,
  pr.mobile_score,
  pr.core_web_vitals,
  
  -- Résultats Sécurité
  secr.https_enabled,
  secr.ssl_certificate_valid,
  secr.security_score,
  secr.vulnerabilities,
  
  -- Résultats Formulaires
  fr.forms_found,
  fr.forms_working,
  fr.has_captcha,
  fr.captcha_type,
  
  -- Résultats Liens
  lr.total_links,
  lr.broken_links,
  lr.redirect_links,
  
  -- Résultats Accessibilité
  ar.accessibility_score,
  ar.wcag_level,
  ar.issues_critical,
  ar.issues_major,
  ar.issues_minor,
  ar.alt_text_coverage,
  
  -- Calcul du score global
  CASE 
    WHEN a.status = 'completed' THEN
      COALESCE(
        (COALESCE(sr.score, 0) + 
         COALESCE(pr.desktop_score, 0) + 
         COALESCE(secr.security_score, 0) + 
         COALESCE(ar.accessibility_score, 0)) / 
        NULLIF(
          (CASE WHEN sr.score IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN pr.desktop_score IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN secr.security_score IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN ar.accessibility_score IS NOT NULL THEN 1 ELSE 0 END), 0
        ), 0
      )
    ELSE NULL
  END as overall_score

FROM analyses a
LEFT JOIN websites w ON a.website_id = w.id
LEFT JOIN seo_results sr ON a.id = sr.analysis_id
LEFT JOIN performance_results pr ON a.id = pr.analysis_id
LEFT JOIN security_results secr ON a.id = secr.analysis_id
LEFT JOIN form_results fr ON a.id = fr.analysis_id
LEFT JOIN link_results lr ON a.id = lr.analysis_id
LEFT JOIN accessibility_results ar ON a.id = ar.analysis_id;

-- Vue des statistiques par site web
CREATE OR REPLACE VIEW website_analysis_stats AS
SELECT 
  w.id as website_id,
  w.url,
  w.domain,
  w.title,
  w.user_id,
  w.discovered_at,
  w.page_count,
  
  -- Statistiques d'analyses
  COUNT(a.id) as total_analyses,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_analyses,
  COUNT(CASE WHEN a.status = 'running' THEN 1 END) as running_analyses,
  COUNT(CASE WHEN a.status = 'failed' THEN 1 END) as failed_analyses,
  
  -- Dernière analyse
  MAX(a.started_at) as last_analysis_date,
  
  -- Scores moyens (seulement analyses complétées)
  ROUND(AVG(CASE WHEN a.status = 'completed' THEN sr.score END), 1) as avg_seo_score,
  ROUND(AVG(CASE WHEN a.status = 'completed' THEN pr.desktop_score END), 1) as avg_performance_score,
  ROUND(AVG(CASE WHEN a.status = 'completed' THEN secr.security_score END), 1) as avg_security_score,
  ROUND(AVG(CASE WHEN a.status = 'completed' THEN ar.accessibility_score END), 1) as avg_accessibility_score,
  
  -- Problèmes totaux
  SUM(CASE WHEN a.status = 'completed' THEN lr.broken_links ELSE 0 END) as total_broken_links,
  SUM(CASE WHEN a.status = 'completed' THEN sr.images_without_alt ELSE 0 END) as total_images_without_alt,
  SUM(CASE WHEN a.status = 'completed' THEN ar.issues_critical ELSE 0 END) as total_critical_issues

FROM websites w
LEFT JOIN analyses a ON w.id = a.website_id
LEFT JOIN seo_results sr ON a.id = sr.analysis_id
LEFT JOIN performance_results pr ON a.id = pr.analysis_id
LEFT JOIN security_results secr ON a.id = secr.analysis_id
LEFT JOIN form_results fr ON a.id = fr.analysis_id
LEFT JOIN link_results lr ON a.id = lr.analysis_id
LEFT JOIN accessibility_results ar ON a.id = ar.analysis_id
GROUP BY w.id, w.url, w.domain, w.title, w.user_id, w.discovered_at, w.page_count;

-- Vue dashboard utilisateur
CREATE OR REPLACE VIEW user_analysis_dashboard AS
SELECT 
  u.user_id,
  
  -- Statistiques générales
  COUNT(DISTINCT w.id) as total_websites,
  COUNT(a.id) as total_analyses,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_analyses,
  COUNT(CASE WHEN a.status = 'running' THEN 1 END) as running_analyses,
  
  -- Scores moyens globaux
  ROUND(AVG(CASE WHEN a.status = 'completed' THEN sr.score END), 1) as avg_seo_score,
  ROUND(AVG(CASE WHEN a.status = 'completed' THEN pr.desktop_score END), 1) as avg_performance_score,
  ROUND(AVG(CASE WHEN a.status = 'completed' THEN secr.security_score END), 1) as avg_security_score,
  ROUND(AVG(CASE WHEN a.status = 'completed' THEN ar.accessibility_score END), 1) as avg_accessibility_score,
  
  -- Problèmes totaux
  SUM(CASE WHEN a.status = 'completed' THEN lr.broken_links ELSE 0 END) as total_broken_links,
  SUM(CASE WHEN a.status = 'completed' THEN sr.images_without_alt ELSE 0 END) as total_images_without_alt,
  SUM(CASE WHEN a.status = 'completed' THEN ar.issues_critical + ar.issues_major ELSE 0 END) as total_accessibility_issues,
  
  -- Dates importantes
  MIN(w.discovered_at) as first_website_date,
  MAX(a.started_at) as last_analysis_date,
  
  -- Sites avec problèmes
  COUNT(CASE WHEN secr.https_enabled = false THEN 1 END) as websites_without_https,
  COUNT(CASE WHEN lr.broken_links > 0 THEN 1 END) as websites_with_broken_links

FROM (SELECT DISTINCT user_id FROM websites) u
LEFT JOIN websites w ON u.user_id = w.user_id
LEFT JOIN analyses a ON w.id = a.website_id
LEFT JOIN seo_results sr ON a.id = sr.analysis_id
LEFT JOIN performance_results pr ON a.id = pr.analysis_id
LEFT JOIN security_results secr ON a.id = secr.analysis_id
LEFT JOIN form_results fr ON a.id = fr.analysis_id
LEFT JOIN link_results lr ON a.id = lr.analysis_id
LEFT JOIN accessibility_results ar ON a.id = ar.analysis_id
GROUP BY u.user_id;