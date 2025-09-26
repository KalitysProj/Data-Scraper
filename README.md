# INPI Data Scraper SaaS Tool

Un outil SaaS professionnel pour extraire et gérer les données d'entreprises depuis le site INPI (Institut National de la Propriété Industrielle).

## 🚀 Fonctionnalités

### Interface Frontend (Actuelle)
- ✅ Dashboard avec statistiques et activité récente
- ✅ Configuration de scraping avec filtres APE, département
- ✅ Gestion des données avec recherche et filtrage
- ✅ Export CSV des données sélectionnées
- ✅ Paramètres avancés et configuration
- ✅ Interface responsive et moderne

### Backend Requis (À Implémenter)
- ⚠️ **API de scraping** - Extraction réelle des données INPI
- ⚠️ **Base de données** - Stockage MySQL/PostgreSQL
- ⚠️ **Authentification** - Système d'utilisateurs
- ⚠️ **Rate limiting** - Respect des limites INPI
- ⚠️ **Queue system** - Gestion des tâches de scraping

## 📋 Données Extraites

L'outil récupère les informations suivantes pour chaque entreprise :
- **Dénomination/Nom** de l'entreprise
- **Début d'activité** (date de création)
- **SIREN** (numéro d'identification)
- **Représentants** (dirigeants et représentants légaux)
- **Forme juridique** (SARL, SAS, etc.)
- **Établissements** (nombre d'établissements)

## 🔧 Configuration Backend Nécessaire

### 1. API Backend (Node.js/Express recommandé)

```javascript
// Exemple d'endpoints requis
POST /api/scrape          // Lancer un scraping
GET  /api/companies       // Récupérer les données
POST /api/export/csv      // Exporter en CSV
DELETE /api/companies     // Supprimer des données
GET  /api/test-db         // Tester la connexion DB
```

### 2. Base de Données

```sql
-- Table des entreprises
CREATE TABLE companies (
    id VARCHAR(36) PRIMARY KEY,
    denomination VARCHAR(255) NOT NULL,
    siren VARCHAR(9) UNIQUE NOT NULL,
    start_date DATE,
    representatives JSON,
    legal_form VARCHAR(50),
    establishments INT DEFAULT 1,
    department VARCHAR(3),
    ape_code VARCHAR(5),
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Index pour les recherches
CREATE INDEX idx_siren ON companies(siren);
CREATE INDEX idx_department ON companies(department);
CREATE INDEX idx_ape_code ON companies(ape_code);
CREATE INDEX idx_denomination ON companies(denomination);
```

### 3. Variables d'Environnement

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api

# Database (Backend)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inpi_scraper
DB_USER=your_username
DB_PASSWORD=your_password

# Scraping Configuration
SCRAPING_DELAY=1000          # Délai entre requêtes (ms)
MAX_CONCURRENT_REQUESTS=3    # Requêtes simultanées max
REQUEST_TIMEOUT=30000        # Timeout par requête (ms)
```

## ⚖️ Considérations Légales

### Respect des Conditions d'Utilisation
- ✅ Respecter les robots.txt du site INPI
- ✅ Implémenter un délai entre les requêtes
- ✅ Limiter le nombre de requêtes simultanées
- ✅ Respecter les conditions d'utilisation INPI

### RGPD et Protection des Données
- ✅ Informer les utilisateurs sur l'utilisation des données
- ✅ Permettre la suppression des données
- ✅ Sécuriser le stockage des informations
- ✅ Respecter les droits des personnes concernées

## 🛠️ Installation et Développement

### Frontend (Actuel)
```bash
npm install
npm run dev
```

### Backend (À Développer)
```bash
# Exemple avec Node.js/Express
mkdir inpi-scraper-backend
cd inpi-scraper-backend
npm init -y
npm install express mysql2 puppeteer cors helmet rate-limiter-flexible
```

## 📊 Architecture Recommandée

```
Frontend (React/TypeScript)
    ↓ HTTP API
Backend (Node.js/Express)
    ↓ SQL
Base de Données (MySQL/PostgreSQL)
    ↓ Queue
Système de Queue (Redis/Bull)
    ↓ Scraping
Service de Scraping (Puppeteer/Playwright)
```

## 🔒 Sécurité

- **Rate Limiting** : Limiter les requêtes par utilisateur
- **Authentification** : JWT ou sessions sécurisées
- **Validation** : Valider toutes les entrées utilisateur
- **HTTPS** : Chiffrement des communications
- **Logs** : Journalisation des activités

## 📈 Évolutions Futures

- [ ] Authentification multi-utilisateurs
- [ ] Système de crédits/abonnements
- [ ] API publique pour intégrations
- [ ] Notifications en temps réel
- [ ] Analyse et visualisation des données
- [ ] Export vers d'autres formats (Excel, JSON)
- [ ] Intégration avec des CRM externes

---

## 🚀 Démarrage Rapide

### 1. Frontend
```bash
npm install
npm run dev
```

### 2. Backend (Optionnel - pour données réelles)
```bash
cd backend
npm install
cp .env.example .env
# Configurer MySQL dans .env
npm run setup-db
npm run dev
```

### 3. Utilisation
- **Sans backend** : Interface de démonstration
- **Avec backend** : Données réelles + scraping INPI

**Note** : L'application fonctionne en mode démonstration par défaut. Pour utiliser le scraping réel, démarrez le backend et configurez MySQL.