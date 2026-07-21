> **RÈGLE DE MAINTENANCE DE LA DOCUMENTATION**
> Cette documentation fait foi pour le déploiement en production de FeedCrafter.
> **Obligation :** Tout changement dans les scripts de build Docker, les volumes de production, la sécurité ou la topologie du réseau Docker DOIT être immédiatement répercuté dans ce fichier.

# Guide de Déploiement en Production - FeedCrafter

Ce guide détaille la procédure de déploiement de la stack complète **FeedCrafter** en environnement de production via Docker et Docker Compose.

---

## 1. Architecture de Production

La stack de production s'appuie sur `docker-compose.prod.yml` et comprend 6 services conteneurisés interconnectés sur un réseau interne bridge (`feedcrafter_network`) :

1. **`postgres`** : Base de données relationnelle PostgreSQL 16 avec volume persistant.
2. **`redis`** : Instance Redis 7 sécurisée par mot de passe pour les files BullMQ et le cache volatile.
3. **`backend`** : API REST Fastify (Port `4000`).
4. **`frontend`** : Application web Nuxt 3 (Port `3000`).
5. **`worker`** : Service de fond (Cron, BullMQ Workers, Google Gemini AI).
6. **`bot`** : Bot Discord autonome.

---

## 2. Procédure de Déploiement

### Étape 1 : Préparation du Serveur de Production
Assurez-vous que le serveur de production dispose de Docker Engine (version 24+) et de Docker Compose v2.

### Étape 2 : Cloner le Répertoire & Configurer l'Environnement
```bash
git clone <repository-url>
cd feedcrafter

# Création du fichier d'environnement de production
cp .env.example .env.production
```

Remplissez les variables d'environnement dans `.env.production` avec des valeurs sécurisées :
```env
POSTGRES_USER=feedcrafter_prod_user
POSTGRES_PASSWORD=SuperSecretPasswordPostgres2026!
POSTGRES_DB=feedcrafter_production

REDIS_PASSWORD=SuperSecretPasswordRedis2026!

GEMINI_API_KEY=AIzaSy...votre_cle_gemini

DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_BOT_TOKEN=votre_bot_token

FRONTEND_API_BASE_URL=https://api.votre-domaine.com
NODE_ENV=production
```

### Étape 3 : Build & Lancement des Conteneurs
Construisez les images Docker et lancez les conteneurs en mode détaché :
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Étape 4 : Exécution des Migrations de Base de Données
Exécutez la migration Prisma dans le conteneur backend pour créer ou mettre à jour la structure PostgreSQL :
```bash
docker exec -it feedcrafter_prod_backend pnpm db:push
```

---

## 3. Maintenance & Monitoring

### Vérifier l'état des conteneurs
```bash
docker compose -f docker-compose.prod.yml ps
```

### Consulter les logs des services
```bash
# Logs du worker (traduction & webhooks)
docker logs -f feedcrafter_prod_worker

# Logs du backend
docker logs -f feedcrafter_prod_backend
```

### Stratégie de Mise à Jour Sans Interruption
Lors d'une nouvelle version applicative :
```bash
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --no-deps backend worker frontend
```
