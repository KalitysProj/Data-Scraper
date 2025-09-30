# Guide d'installation - INPI Scraper

## Prérequis

- Node.js v18+ installé
- Compte Supabase (gratuit)
- Chrome/Chromium pour Puppeteer

## Étape 1: Configuration de Supabase

### 1.1 Créer les tables

1. Connectez-vous à [Supabase](https://supabase.com)
2. Ouvrez votre projet
3. Allez dans **SQL Editor**
4. Copiez et exécutez le SQL suivant:

```sql
-- Table users
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

-- Index
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_siren ON companies(siren);
CREATE INDEX IF NOT EXISTS idx_companies_department ON companies(department);
CREATE INDEX IF NOT EXISTS idx_companies_ape_code ON companies(ape_code);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Policies pour companies
CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies"
  ON companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Policies pour scraping_jobs
CREATE POLICY "Users can view own jobs"
  ON scraping_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON scraping_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON scraping_jobs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 1.2 Désactiver la confirmation d'email (pour le développement)

1. Allez dans **Authentication** > **Settings**
2. Désactivez "Enable email confirmations"

## Étape 2: Configuration Backend

### 2.1 Installer les dépendances

```bash
cd backend
npm install
```

### 2.2 Configuration .env

Le fichier `backend/.env` est déjà configuré avec vos identifiants Supabase:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SCRAPING_DELAY=2000
MAX_CONCURRENT_REQUESTS=3
REQUEST_TIMEOUT=30000
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

### 2.3 Démarrer le backend

```bash
npm run dev
```

Vous devriez voir:
```
🚀 Serveur démarré sur le port 3001
```

## Étape 3: Configuration Frontend

### 3.1 Installer les dépendances

```bash
cd ..  # Retour à la racine
npm install
```

### 3.2 Configuration .env

Le fichier `.env` à la racine est déjà configuré:

```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001/api
```

### 3.3 Démarrer le frontend

```bash
npm run dev
```

Le site s'ouvrira sur http://localhost:5173

## Étape 4: Tester l'application

### 4.1 Vérifier le backend

1. Ouvrez http://localhost:3001/api/health
2. Vous devriez voir: `{"success":true,"message":"API INPI Scraper opérationnelle"}`

### 4.2 Utiliser l'application

L'application fonctionne en **mode démonstration** par défaut (sans authentification).

1. Ouvrez http://localhost:5173
2. Allez dans "Scraper"
3. Entrez un code APE (ex: 6201Z) et département (ex: 75)
4. Lancez le scraping

Les données seront stockées avec l'ID utilisateur `demo-user`.

## Dépannage

### Erreur "Backend non disponible"

1. Vérifiez que le backend tourne sur le port 3001
2. Testez http://localhost:3001/api/health
3. Vérifiez les logs du backend dans le terminal

### Erreur "Cannot find module"

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Erreur Supabase

1. Vérifiez que les tables sont bien créées dans Supabase
2. Vérifiez l'URL et la clé Supabase dans le .env
3. Vérifiez que RLS est activé et les policies créées

### Erreur Puppeteer

Sur macOS/Linux:
```bash
cd backend/node_modules/puppeteer
npm run postinstall
```

## Architecture

```
┌─────────────┐
│  Frontend   │  http://localhost:5173
│  (React)    │
└──────┬──────┘
       │ API REST
       ▼
┌─────────────┐
│  Backend    │  http://localhost:3001
│  (Express)  │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐  ┌──────────┐
│ Supabase │  │Puppeteer │
│   DB     │  │ Scraper  │
└──────────┘  └──────────┘
```

## Fonctionnalités

- **Dashboard**: Statistiques et vue d'ensemble
- **Scraper**: Configuration et lancement de scraping
- **Données**: Gestion et recherche des entreprises
- **Export CSV**: Export des données sélectionnées
- **Paramètres**: Configuration de l'application

## Notes importantes

- Le scraping INPI peut être lent selon le nombre de résultats
- En mode démo, toutes les données sont associées à l'utilisateur "demo-user"
- Pour activer l'authentification, implémentez le système d'auth Supabase dans le frontend
- Les données sont protégées par Row Level Security (RLS) en production