/*
  # Extension du système de rôles utilisateur

  1. Nouveaux Rôles
    - `user` - Utilisateur basique (1 analyse max)
    - `super_administrator` - Super admin non-suspendable
    
  2. Nouvelles Fonctionnalités
    - Validation d'accès par défaut (profil suspendu)
    - Limitation d'analyses pour le rôle `user`
    - Protection du super administrateur
    - Historique des analyses pour administrateurs

  3. Modifications
    - Mise à jour des permissions par rôle
    - Nouvelles politiques RLS
    - Contraintes de sécurité renforcées
*/

-- Mise à jour de l'enum des rôles pour inclure les nouveaux rôles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_administrator';

-- Ajout de colonnes pour la gestion des limitations
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS max_analyses integer DEFAULT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_analyses_count integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_protected boolean DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pending_approval boolean DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES user_profiles(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Mise à jour des permissions par défaut pour les nouveaux rôles
INSERT INTO role_permissions (role, permission, granted) VALUES
-- Permissions pour le rôle 'user'
('user', 'view_analyses', true),
('user', 'create_analyses', true),
('user', 'view_dashboard', false),
('user', 'export_reports', true),
('user', 'manage_websites', false),
('user', 'view_history', false),
('user', 'delete_analyses', false),
('user', 'manage_users', false),

-- Permissions pour le rôle 'super_administrator' (toutes les permissions)
('super_administrator', 'view_analyses', true),
('super_administrator', 'create_analyses', true),
('super_administrator', 'view_dashboard', true),
('super_administrator', 'export_reports', true),
('super_administrator', 'manage_websites', true),
('super_administrator', 'view_history', true),
('super_administrator', 'delete_analyses', true),
('super_administrator', 'manage_users', true)

ON CONFLICT (role, permission) DO UPDATE SET granted = EXCLUDED.granted;

-- Mise à jour des permissions pour l'administrateur (ajout view_history)
UPDATE role_permissions 
SET granted = true 
WHERE role = 'administrator' AND permission = 'view_history';

-- Configuration des limitations par rôle
UPDATE user_profiles SET 
  max_analyses = 1,
  pending_approval = true
WHERE role = 'user';

UPDATE user_profiles SET 
  max_analyses = NULL,
  is_protected = false,
  pending_approval = false
WHERE role IN ('commercial', 'project_manager', 'administrator');

UPDATE user_profiles SET 
  max_analyses = NULL,
  is_protected = true,
  pending_approval = false
WHERE role = 'super_administrator';

-- Fonction pour vérifier les limites d'analyses
CREATE OR REPLACE FUNCTION check_analysis_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Récupérer le profil utilisateur
  SELECT * INTO user_profile 
  FROM user_profiles 
  WHERE id = NEW.user_id;
  
  -- Vérifier si l'utilisateur a une limite d'analyses
  IF user_profile.max_analyses IS NOT NULL THEN
    -- Compter les analyses existantes
    IF user_profile.current_analyses_count >= user_profile.max_analyses THEN
      RAISE EXCEPTION 'Limite d''analyses atteinte pour ce rôle utilisateur';
    END IF;
    
    -- Incrémenter le compteur
    UPDATE user_profiles 
    SET current_analyses_count = current_analyses_count + 1
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier les limites lors de la création d'analyses
CREATE TRIGGER check_user_analysis_limit
  BEFORE INSERT ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION check_analysis_limit();

-- Fonction pour décrémenter le compteur lors de suppression
CREATE OR REPLACE FUNCTION decrement_analysis_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles 
  SET current_analyses_count = GREATEST(0, current_analyses_count - 1)
  WHERE id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour décrémenter lors de suppression d'analyses
CREATE TRIGGER decrement_user_analysis_count
  AFTER DELETE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION decrement_analysis_count();

-- Politique RLS mise à jour pour empêcher la suspension des super administrateurs
CREATE OR REPLACE POLICY "Protect super administrators from suspension"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN role = 'super_administrator' AND is_protected = true THEN
        -- Seuls les super admins peuvent modifier d'autres super admins
        EXISTS (
          SELECT 1 FROM user_profiles up 
          WHERE up.id = auth.uid() 
          AND up.role = 'super_administrator'
          AND up.is_active = true
        )
      ELSE true
    END
  )
  WITH CHECK (
    CASE 
      WHEN OLD.role = 'super_administrator' AND OLD.is_protected = true THEN
        -- Empêcher la suspension des super admins protégés
        (NEW.is_active = true OR EXISTS (
          SELECT 1 FROM user_profiles up 
          WHERE up.id = auth.uid() 
          AND up.role = 'super_administrator'
          AND up.is_active = true
        ))
      ELSE true
    END
  );

-- Vue pour les statistiques utilisateurs étendues
CREATE OR REPLACE VIEW user_management_stats AS
SELECT 
  role,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
  COUNT(CASE WHEN pending_approval = true THEN 1 END) as pending_approval,
  COUNT(CASE WHEN last_login_at > now() - interval '30 days' THEN 1 END) as active_last_30_days,
  AVG(login_count) as avg_login_count,
  MAX(last_login_at) as last_activity
FROM user_profiles
GROUP BY role;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS user_profiles_pending_approval_idx ON user_profiles(pending_approval);
CREATE INDEX IF NOT EXISTS user_profiles_is_protected_idx ON user_profiles(is_protected);
CREATE INDEX IF NOT EXISTS user_profiles_max_analyses_idx ON user_profiles(max_analyses);
CREATE INDEX IF NOT EXISTS user_profiles_current_analyses_count_idx ON user_profiles(current_analyses_count);