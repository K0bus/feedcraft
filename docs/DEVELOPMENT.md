> **RÈGLE DE MAINTENANCE DE LA DOCUMENTATION**
> Cette documentation fait foi pour le guide de développement local de FeedCrafter.
> **Obligation :** Tout changement dans les commandes de démarrage, les dépendances système, les scripts `package.json` ou les variables d'environnement DOIT être immédiatement répercuté dans ce fichier.

# Guide de Développement Local - FeedCrafter

Ce guide décrit les étapes pour installer, configurer et lancer le projet **FeedCrafter** dans un environnement de développement local.

---

## 1. Prérequis Système

Assurez-vous d'avoir installé les outils suivants sur votre machine :
- **Node.js** : `>= 20.0.0`
- **pnpm** : `>= 8.0.0` (`npm install -g pnpm` ou via Corepack `corepack enable`)
- **Docker** & **Docker Compose**

---

## 2. Installation Pas à Pas

### Étape 1 : Cloner le dépôt et installer les dépendances
```bash
git clone <repository-url>
cd feedcrafter
pnpm install
```

### Étape 2 : Configurer les Variables d'Environnement
Copiez le fichier d'exemple `.env.example` à la racine pour créer votre fichier `.env` :
```bash
cp .env.example .env
```

Modifiez les clés selon vos accès (notamment `GEMINI_API_KEY` et vos identifiants Discord).

### Étape 3 : Lancer les Services d'Infrastructure (Docker Local)
Lancez les conteneurs PostgreSQL et Redis en arrière-plan :
```bash
docker compose up -d
```

Vérifiez le statut des conteneurs :
```bash
docker compose ps
```

### Étape 4 : Initialiser la Base de Données (Prisma)
Générez le client Prisma et appliquez les migrations à la base de données PostgreSQL locale :
```bash
pnpm db:generate
pnpm db:push
```

*(Optionnel)* Vous pouvez lancer Prisma Studio pour visualiser les tables en BDD :
```bash
pnpm db:studio
```

---

## 3. Démarrage des Applications en Développement

Vous pouvez lancer l'ensemble des applications en mode développement simultanément avec la commande :

```bash
pnpm dev
```

Cette commande exécute en parallèle :
- **Frontend** (Nuxt 3) sur `http://localhost:3000`
- **Backend API** (Fastify) sur `http://localhost:4000`
- **Worker** (BullMQ / Cron / Gemini)
- **Discord Bot**

---

## 4. Commandes Utiles

| Commande | Description |
| :--- | :--- |
| `pnpm dev` | Lance tous les projets en parallèle en mode dev |
| `pnpm build` | Compile l'ensemble des packages et des applications |
| `pnpm db:generate` | Génère les types Prisma Client |
| `pnpm db:push` | Synchronise le schéma Prisma avec PostgreSQL local |
| `pnpm db:studio` | Ouvre l'interface web Prisma Studio (`http://localhost:5555`) |
