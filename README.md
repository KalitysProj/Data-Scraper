# INPI Data Scraper - Application SaaS

Application web professionnelle pour extraire et gérer les données d'entreprises depuis le site INPI (Institut National de la Propriété Industrielle).

## 🚀 Démarrage rapide

### 1. Installer et démarrer le backend

```bash
cd backend
npm install
npm run dev
```

Le backend démarre sur http://localhost:3001 avec une base de données SQLite locale.

### 2. Installer et démarrer le frontend

```bash
npm install
npm run dev
```

Le frontend s'ouvre sur http://localhost:5173

## ✅ Fonctionnalités

### Interface Frontend
- **Dashboard** : Statistiques en temps réel et activité récente
- **Scraper** : Configuration avec filtres APE et département
- **Gestionnaire de données** : Recherche, filtrage et pagination
- **Export CSV** : Export des données sélectionnées
- **Paramètres** : Configuration avancée

### Backend API
- ✅ Scraping automatisé avec Puppeteer
- ✅ Base de données SQLite locale (aucune configuration requise)
- ✅ API REST complète
- ✅ Rate limiting
- ✅ Gestion des tâches de scraping
- ✅ Export CSV
- ✅ Mode démonstration intégré

## 📊 Données extraites

- Dénomination de l'entreprise
- SIREN (numéro d'identification)
- Date de début d'activité
- Représentants légaux
- Forme juridique (SARL, SAS, etc.)
- Nombre d'établissements
- Code APE et département
- Adresse complète

## 🔧 Technologies

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

**Backend**
- Node.js + Express
- SQLite (better-sqlite3)
- Puppeteer (scraping)
- Winston (logging)
- Express Rate Limit

## 📁 Structure du projet

```
.
├── src/                    # Code frontend React
│   ├── components/        # Composants React
│   └── services/          # Services API
├── backend/               # Code backend Node.js
│   ├── database/          # Base SQLite (auto-créée)
│   └── src/
│       ├── config/        # Configuration
│       ├── controllers/   # Logique métier
│       ├── middleware/    # Middlewares Express
│       ├── routes/        # Routes API
│       └── services/      # Service de scraping
└── README.md
```

## 🌐 API Endpoints

```
POST   /api/scraping/start       # Démarrer un scraping
GET    /api/scraping/status/:id  # Statut d'une tâche
POST   /api/scraping/stop/:id    # Arrêter un scraping
GET    /api/scraping/jobs        # Liste des tâches

GET    /api/companies            # Liste des entreprises
GET    /api/companies/:id        # Détails d'une entreprise
DELETE /api/companies            # Supprimer des entreprises
POST   /api/companies/export/csv # Export CSV
GET    /api/companies/stats      # Statistiques

GET    /api/health               # Santé de l'API
GET    /api/test-db              # Test connexion DB
```

## 🔐 Sécurité

- Rate limiting sur l'API (100 req/15min)
- Validation des entrées utilisateur
- Mode démonstration sécurisé
- Logs Winston pour l'audit
- Base de données locale isolée

## 🔄 Mode démonstration

L'application fonctionne en mode démonstration par défaut :
- Pas d'authentification requise
- Les données sont associées à `user_id='demo-user'`
- Toutes les fonctionnalités sont accessibles
- Base de données SQLite locale

## ⚠️ Considérations légales

### Respect des Conditions d'Utilisation
- ✅ Délai de 2 secondes entre les requêtes
- ✅ Maximum 3 requêtes simultanées
- ✅ Timeout de 30 secondes par requête
- ✅ User-Agent configuré

### RGPD et Protection des Données
- ✅ Données stockées localement
- ✅ Suppression des données possible
- ✅ Isolation des données par utilisateur
- ✅ Pas de transmission externe

## 🛠️ Dépannage

### Erreur "Backend non disponible"

1. Vérifiez que le backend est démarré : `cd backend && npm run dev`
2. Testez l'API : http://localhost:3001/api/health
3. Vérifiez les logs dans `backend/logs/`

### Erreur "Cannot find module"

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Erreur SQLite ou Database

La base de données SQLite est créée automatiquement au démarrage. Si problème :

```bash
cd backend
rm -rf database
npm run dev  # Recréera la base automatiquement
```

### Erreur Puppeteer

Sur macOS/Linux, si Puppeteer ne s'installe pas correctement :

```bash
cd backend
npx puppeteer browsers install chrome
```

## 📈 Évolutions futures

- [ ] Authentification multi-utilisateurs
- [ ] Système de crédits/abonnements
- [ ] Notifications temps réel
- [ ] Analyse avancée des données
- [ ] Export Excel/JSON
- [ ] Intégration CRM
- [ ] Migration vers PostgreSQL (optionnel)

## 🏗️ Architecture

```
┌─────────────┐
│  Frontend   │  React + TypeScript + Vite
│ :5173       │
└──────┬──────┘
       │ REST API
       ▼
┌─────────────┐
│  Backend    │  Node.js + Express
│ :3001       │
└──────┬──────┘
       │
       ├──────────┬──────────┐
       │          │          │
       ▼          ▼          ▼
┌──────────┐ ┌─────────┐ ┌─────────┐
│  SQLite  │ │Puppeteer│ │ Winston │
│   DB     │ │ Scraper │ │  Logs   │
└──────────┘ └─────────┘ └─────────┘
```

## 💾 Base de données

La base de données SQLite est stockée dans `backend/database/inpi_scraper.db` et contient :

- **users** : Table utilisateurs (mode démo uniquement)
- **companies** : Données des entreprises scrapées
- **scraping_jobs** : Historique des tâches de scraping

La base est créée automatiquement au premier démarrage avec les tables et index nécessaires.

## 📄 Licence

MIT

## 🤝 Support

- Documentation complète dans ce fichier
- Logs détaillés dans `backend/logs/`
- Base de données locale SQLite sans configuration

---

**Status:** ✅ Application 100% fonctionnelle avec SQLite local (sans Supabase)