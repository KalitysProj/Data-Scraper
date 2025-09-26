# 🚀 Tutoriel Complet - Backend INPI Scraper

Ce tutoriel vous guide pas à pas pour installer et configurer le backend complet du scraper INPI.

## 📋 Prérequis

### 1. Logiciels requis
- **Node.js** (version 18+) : [Télécharger](https://nodejs.org/)
- **MySQL** (version 8+) : [Télécharger](https://dev.mysql.com/downloads/)
- **Git** : [Télécharger](https://git-scm.com/)

### 2. Vérification des installations
```bash
node --version    # Doit afficher v18+ 
npm --version     # Doit afficher 9+
mysql --version   # Doit afficher 8+
```

## 🛠️ Installation Backend

### Étape 1: Créer le projet backend
```bash
# Créer le dossier backend
mkdir inpi-scraper-backend
cd inpi-scraper-backend

# Initialiser le projet Node.js
npm init -y
```

### Étape 2: Installer les dépendances
```bash
# Dépendances principales
npm install express mysql2 puppeteer cors helmet express-rate-limit dotenv bcryptjs jsonwebtoken express-validator winston bull redis csv-writer uuid

# Dépendances de développement
npm install --save-dev nodemon jest supertest
```

### Étape 3: Créer la structure des dossiers
```bash
mkdir -p src/{config,controllers,middleware,routes,services,utils,database}
mkdir -p logs temp
```

## 🗄️ Configuration Base de Données

### Étape 1: Créer la base de données MySQL
```sql
-- Se connecter à MySQL en tant qu'administrateur
mysql -u root -p

-- Créer la base de données
CREATE DATABASE inpi_scraper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer un utilisateur dédié (optionnel mais recommandé)
CREATE USER 'inpi_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON inpi_scraper.* TO 'inpi_user'@'localhost';
FLUSH PRIVILEGES;

-- Quitter MySQL
EXIT;
```

### Étape 2: Configuration des variables d'environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos paramètres
nano .env
```

**Contenu du fichier .env :**
```env
# Configuration de la base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inpi_scraper
DB_USER=inpi_user
DB_PASSWORD=votre_mot_de_passe_securise

# Configuration du serveur
PORT=3001
NODE_ENV=development

# JWT Secret (générer une clé sécurisée)
JWT_SECRET=votre_cle_jwt_super_secrete_changez_en_production

# Configuration du scraping
SCRAPING_DELAY=2000
MAX_CONCURRENT_REQUESTS=2
REQUEST_TIMEOUT=30000
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36

# Logs
LOG_LEVEL=info

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Étape 3: Initialiser la base de données
```bash
# Exécuter le script de configuration
npm run setup-db
```

**Vous devriez voir :**
```
📦 Création de la base de données...
📋 Création des tables...
🔍 Création des index...
👤 Création de l'utilisateur de test...
✅ Base de données configurée avec succès !
📧 Utilisateur de test créé : test@example.com / test123
```

## 🚀 Démarrage du Backend

### Étape 1: Démarrer le serveur de développement
```bash
npm run dev
```

**Vous devriez voir :**
```
✅ Connexion à la base de données réussie
🚀 Serveur démarré sur le port 3001
📊 Dashboard: http://localhost:3001/api/health
🔧 Environment: development
```

### Étape 2: Tester l'API
```bash
# Test de santé de l'API
curl http://localhost:3001/api/health

# Test de connexion à la base de données
curl http://localhost:3001/api/test-db
```

## 🔧 Configuration Frontend

### Étape 1: Mettre à jour les variables d'environnement frontend
Créer un fichier `.env` dans le dossier frontend :
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### Étape 2: Redémarrer le frontend
```bash
# Dans le dossier frontend
npm run dev
```

## 🧪 Tests et Validation

### 1. Test de l'authentification
```bash
# Inscription d'un nouvel utilisateur
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 2. Test du scraping (avec token d'authentification)
```bash
# Remplacer YOUR_JWT_TOKEN par le token reçu lors de la connexion
curl -X POST http://localhost:3001/api/scraping/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "apeCode": "0121Z",
    "department": "69",
    "siegeOnly": true
  }'
```

## 📊 Utilisation de l'Interface

### 1. Accéder à l'application
- Frontend : http://localhost:5173
- Backend API : http://localhost:3001

### 2. Se connecter
- Email : `test@example.com`
- Mot de passe : `test123`

### 3. Lancer un scraping
1. Aller dans "Nouveau Scraping"
2. Entrer un code APE (ex: 0121Z)
3. Sélectionner un département (ex: 69)
4. Cliquer sur "Lancer le scraping"

### 4. Consulter les données
1. Aller dans "Données"
2. Voir les entreprises scrapées
3. Exporter en CSV si nécessaire

## 🔒 Sécurité et Bonnes Pratiques

### 1. Sécurisation en production
```bash
# Générer une clé JWT sécurisée
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Utiliser HTTPS en production
# Configurer un reverse proxy (nginx)
# Utiliser des variables d'environnement sécurisées
```

### 2. Monitoring et logs
```bash
# Consulter les logs
tail -f logs/combined.log
tail -f logs/error.log
```

### 3. Sauvegarde de la base de données
```bash
# Sauvegarde
mysqldump -u inpi_user -p inpi_scraper > backup_$(date +%Y%m%d).sql

# Restauration
mysql -u inpi_user -p inpi_scraper < backup_20240115.sql
```

## 🚨 Dépannage

### Problème : Erreur de connexion à la base de données
```bash
# Vérifier que MySQL est démarré
sudo systemctl status mysql

# Vérifier les paramètres de connexion
mysql -u inpi_user -p -h localhost inpi_scraper
```

### Problème : Erreur Puppeteer
```bash
# Installer les dépendances système (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

### Problème : Port déjà utilisé
```bash
# Trouver le processus utilisant le port 3001
lsof -i :3001

# Tuer le processus
kill -9 PID_DU_PROCESSUS
```

## 📈 Optimisations Avancées

### 1. Mise en cache avec Redis
```bash
# Installer Redis
sudo apt-get install redis-server

# Démarrer Redis
sudo systemctl start redis-server
```

### 2. Queue de tâches avec Bull
Le système de queue est déjà configuré pour gérer les tâches de scraping en arrière-plan.

### 3. Monitoring avec PM2 (production)
```bash
# Installer PM2
npm install -g pm2

# Démarrer l'application
pm2 start src/server.js --name "inpi-scraper"

# Monitoring
pm2 monit
```

## ✅ Checklist de Déploiement

- [ ] Base de données configurée et accessible
- [ ] Variables d'environnement définies
- [ ] Backend démarré sans erreurs
- [ ] Frontend connecté au backend
- [ ] Tests d'authentification réussis
- [ ] Test de scraping fonctionnel
- [ ] Logs configurés et accessibles
- [ ] Sauvegardes automatisées
- [ ] Monitoring en place
- [ ] Sécurité renforcée (HTTPS, rate limiting)

## 🆘 Support

En cas de problème :
1. Vérifiez les logs : `tail -f logs/combined.log`
2. Testez la connexion DB : `npm run setup-db`
3. Vérifiez les ports : `lsof -i :3001`
4. Consultez la documentation des dépendances

---

**🎉 Félicitations !** Votre backend INPI Scraper est maintenant opérationnel avec toutes les fonctionnalités de scraping, authentification, et gestion des données.