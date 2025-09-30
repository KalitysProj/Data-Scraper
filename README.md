# INPI Data Scraper - Application SaaS ✅

Application web professionnelle pour extraire et gérer les données d'entreprises depuis le site INPI (Institut National de la Propriété Industrielle).

## 🚀 Démarrage rapide

**Voir `GUIDE_INSTALLATION.md` pour les instructions détaillées**

### 1. Créer les tables Supabase

Exécutez le SQL fourni dans le guide d'installation.

### 2. Installer et démarrer le backend

```bash
cd backend
npm install
npm run dev
```

Le backend démarre sur http://localhost:3001

### 3. Installer et démarrer le frontend

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

### Backend API (Implémenté)
- ✅ Scraping automatisé avec Puppeteer
- ✅ Base de données Supabase PostgreSQL
- ✅ API REST complète
- ✅ Rate limiting
- ✅ Gestion des tâches de scraping
- ✅ Export CSV
- ✅ Authentification Supabase (optionnelle en dev)

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
- Supabase Client

**Backend**
- Node.js + Express
- Supabase (PostgreSQL + Auth)
- Puppeteer (scraping)
- Winston (logging)
- Express Rate Limit

## 📁 Structure du projet

```
.
├── src/                    # Code frontend React
│   ├── components/        # Composants React
│   │   ├── Dashboard.tsx
│   │   ├── Scraper.tsx
│   │   ├── DataManager.tsx
│   │   └── Settings.tsx
│   └── services/          # Services API
│       └── api.ts
├── backend/               # Code backend Node.js
│   └── src/
│       ├── config/        # Configuration Supabase
│       ├── controllers/   # Logique métier
│       │   ├── authController.js
│       │   ├── companiesController.js
│       │   └── scrapingController.js
│       ├── middleware/    # Middlewares Express
│       ├── routes/        # Routes API
│       ├── services/      # Service de scraping
│       │   └── scraper.js
│       └── server.js
├── GUIDE_INSTALLATION.md  # Guide détaillé
└── README.md
```

## 🌐 API Endpoints

```
POST   /api/auth/register        # Inscription
POST   /api/auth/login           # Connexion
GET    /api/auth/profile         # Profil utilisateur

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
```

## 🔐 Sécurité

- Row Level Security (RLS) sur toutes les tables Supabase
- Rate limiting sur l'API (100 req/15min)
- Validation des entrées utilisateur
- Authentification Supabase (optionnelle en dev)
- Mode démonstration sécurisé
- Logs Winston pour l'audit

## 🔄 Mode démonstration

L'application fonctionne en mode démonstration par défaut :
- Pas d'authentification requise
- Les données sont associées à `user_id='demo-user'`
- Toutes les fonctionnalités sont accessibles
- Idéal pour les tests et la démonstration

## ⚠️ Considérations légales

### Respect des Conditions d'Utilisation
- ✅ Délai de 2 secondes entre les requêtes
- ✅ Maximum 3 requêtes simultanées
- ✅ Timeout de 30 secondes par requête
- ✅ User-Agent configuré

### RGPD et Protection des Données
- ✅ Données sécurisées avec RLS
- ✅ Suppression des données possible
- ✅ Isolation des données par utilisateur
- ✅ Stockage chiffré (Supabase)

## 🛠️ Dépannage

### Erreur "Backend non disponible"

1. Vérifiez que le backend est démarré : `cd backend && npm run dev`
2. Testez l'API : http://localhost:3001/api/health
3. Vérifiez la configuration dans `backend/.env`

### Erreur "Cannot find module"

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Erreur Supabase

1. Vérifiez que les tables sont créées dans Supabase
2. Vérifiez l'URL et la clé dans les fichiers `.env`
3. Vérifiez que RLS est activé

**Consultez `GUIDE_INSTALLATION.md` pour plus de détails**

## 📈 Évolutions futures

- [ ] Authentification complète multi-utilisateurs
- [ ] Système de crédits/abonnements
- [ ] Notifications temps réel (websockets)
- [ ] Analyse avancée des données
- [ ] Export Excel/JSON
- [ ] Intégration CRM
- [ ] API publique

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
│ Supabase │ │Puppeteer│ │ Winston │
│   DB     │ │ Scraper │ │  Logs   │
└──────────┘ └─────────┘ └─────────┘
```

## 📄 Licence

MIT

## 🤝 Support

Pour toute question, consultez :
- `GUIDE_INSTALLATION.md` - Installation détaillée
- `backend/SUPABASE_SETUP.md` - Configuration Supabase
- Les logs du backend dans `backend/logs/`

---

**Status:** ✅ Backend complètement fonctionnel avec Supabase