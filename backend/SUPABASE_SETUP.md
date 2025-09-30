# Configuration Supabase pour INPI Scraper

## Étape 1: Créer les tables dans Supabase

Connectez-vous à votre projet Supabase et exécutez les requêtes SQL suivantes dans l'éditeur SQL :

```sql
-- Table users (extension de auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  denomination text NOT NULL,
  siren text NOT NULL,
  start_date date,
  representatives jsonb DEFAULT '[]'::jsonb,
  legal_form text,
  establishments integer DEFAULT 1,
  address text,
  postal_code text,
  city text,
  department text,
  ape_code text,
  status text DEFAULT 'active',
  scraped_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, siren)
);

-- Table scraping_jobs
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ape_code text,
  department text,
  siege_only boolean DEFAULT true,
  status text DEFAULT 'pending',
  progress integer DEFAULT 0,
  found_results integer DEFAULT 0,
  processed_results integer DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_siren ON companies(siren);
CREATE INDEX IF NOT EXISTS idx_companies_department ON companies(department);
CREATE INDEX IF NOT EXISTS idx_companies_ape_code ON companies(ape_code);
CREATE INDEX IF NOT EXISTS idx_companies_scraped_at ON companies(scraped_at);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user_id ON scraping_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at);

-- Activer Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies pour companies
CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies pour scraping_jobs
CREATE POLICY "Users can view own scraping jobs"
  ON scraping_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scraping jobs"
  ON scraping_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraping jobs"
  ON scraping_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scraping jobs"
  ON scraping_jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Étape 2: Configuration Backend

Les variables d'environnement sont déjà configurées dans `backend/.env`:

```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
SUPABASE_ANON_KEY=votre_clé_anon

SCRAPING_DELAY=2000
MAX_CONCURRENT_REQUESTS=3
REQUEST_TIMEOUT=30000
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

## Étape 3: Démarrer le backend

```bash
cd backend
npm install
npm run dev
```

Le serveur démarrera sur http://localhost:3001

## Étape 4: Configuration Frontend

Le fichier `.env` à la racine du projet contient :

```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon
VITE_API_URL=http://localhost:3001/api
```

## Étape 5: Démarrer le frontend

```bash
npm install
npm run dev
```

Le frontend démarrera sur http://localhost:5173

## Notes importantes

1. **Mode démonstration**: Le backend fonctionne en mode demo (user_id='demo-user') si aucun token d'authentification n'est fourni
2. **Authentication**: L'authentification Supabase est configurée mais optionnelle en développement
3. **RLS**: Toutes les tables ont Row Level Security activé pour protéger les données utilisateurs
4. **Scraping**: Le scraping utilise Puppeteer et peut prendre du temps selon le nombre de résultats