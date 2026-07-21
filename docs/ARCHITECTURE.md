> **RÈGLE DE MAINTENANCE DE LA DOCUMENTATION**
> Cette documentation fait foi pour l'architecture globale du projet FeedCrafter.
> **Obligation :** Tout changement majeur dans l'infrastructure, l'organisation des packages, le schéma de base de données ou le flux de données DOIT être immédiatement répercuté dans ce fichier.

# Architecture & Design System - FeedCrafter

## 1. Vue d'Ensemble du Projet

FeedCrafter est un service automatisé de diffusion d'actualités et de patch notes de jeux vidéo pour serveurs Discord communautaires. Il permet aux administrateurs de serveurs d'abonner leurs canaux Discord aux mises à jour de jeux (Steam, Epic Games, RSS) avec une traduction automatique et contextuelle réalisée par IA (Google Gemini 2.5 Flash).

---

## 2. Structure Monorepo (`pnpm workspaces`)

```
feedcrafter/
├── apps/
│   ├── frontend/         # Panel d'administration web Nuxt 3 (Vue.js 3, TailwindCSS)
│   ├── backend/          # API REST Fastify (TypeScript)
│   ├── worker/           # Service autonome Cron + BullMQ + Google Gemini AI
│   └── bot/              # Bot Discord (discord.js) pour les interactions directes
├── packages/
│   ├── database/         # Schéma Prisma PostgreSQL et instance partagée du client DB
│   └── shared/           # Contrats TypeScript, types DTO, et payloads de file de messages
├── docs/                 # Documentation technique du projet
├── docker-compose.yml     # Environnement de développement local (PostgreSQL + Redis)
└── docker-compose.prod.yml# Déploiement multi-conteneurs de production
```

---

## 3. Rôle des Composants

### 🔹 `packages/database`
Contient le schéma Prisma (`schema.prisma`) centralisé et exporte une instance partagée de `PrismaClient`.
- **Modèles de données** :
  - `User` : Comptes utilisateurs enregistrés (Discord OAuth2).
  - `Guild` : Serveurs Discord enregistrés.
  - `Game` : Catalogue des jeux supportés (identifiants Steam, Epic Games, IGDB).
  - `Subscription` : Association entre une `Guild`, un `Game`, et une URL de Webhook Discord cible.
  - `NewsFeed` : Flux bruts récupérés depuis les plateformes externes.
  - `NewsCache` : Cache des traductions IA par langue pour éviter tout doublon d'appel à l'API Gemini.

### 🔹 `packages/shared`
Contient l'ensemble des définitions de types et contrats TypeScript partagés entre le frontend, l'API backend et le worker (DTOs API, interfaces de jeux, structures des jobs BullMQ).

### 🔹 `apps/frontend`
Application web moderne conçue avec **Nuxt 3** et **TailwindCSS**. Permet aux utilisateurs de se connecter via Discord, de sélectionner leurs serveurs et de gérer leurs abonnements aux jeux vidéo.

### 🔹 `apps/backend`
Serveur d'API REST construit avec **Fastify**. Gère l'authentification des utilisateurs, la vérification des droits sur les serveurs Discord et la gestion des abonnements/webhooks dans la base de données.

### 🔹 `apps/worker`
Service Node.js d'arrière-plan exécutant :
1. Un **planificateur Cron** déclenchant régulièrement l'extraction des actualités des jeux enregistrés.
2. Une file de traitements **BullMQ / Redis** pour paralléliser la récupération des flux, la traduction via le SDK `@google/genai` (modèle `gemini-2.5-flash`), et la livraison vers les Webhooks Discord.

### 🔹 `apps/bot`
Intégration Discord native via `discord.js` permettant les commandes d'interaction directes sur les serveurs Discord.

---

## 4. Flux de Données Étape par Étape

```
+------------------+         +------------------+         +-----------------------+
|  Sources Externe |         |  Worker Scheduler|         |     BullMQ Queue      |
| (Steam, Epic,    | ------->|   (Cron Job)     | ------->|   (news-fetch-queue)  |
|  RSS Feeds)      |         +------------------+         +-----------------------+
+------------------+                                                  |
                                                                      v
+------------------+         +------------------+         +-----------------------+
| Discord Webhook  | <-------|  BullMQ Queue    | <-------| Google Gemini 2.5     |
| (Canal Communauté|         | (discord-dispatch|         | Flash (Traduction &   |
|  Discord)        |         |      queue)      |         | Résumé en Cache DB)   |
+------------------+         +------------------+         +-----------------------+
```

1. **Planification** : Le worker exécute un planificateur Cron (toutes les 15 min par défaut) et ajoute un job dans `news-fetch-queue` pour chaque jeu actif.
2. **Extraction** : Le worker extrait les derniers patch notes depuis Steam/Epic/RSS et vérifie s'ils existent déjà dans `NewsFeed`.
3. **Traduction & Cache** :
   - Le worker consulte `NewsCache` en BDD pour la clé `(newsFeedId, language)`.
   - Si absent, il fait appel au modèle `gemini-2.5-flash` de Google Gemini pour traduire le titre et le contenu et générer un résumé. Le résultat est enregistré en base dans `NewsCache`.
4. **Distribution Webhook** : Le worker ajoute un job dans `discord-dispatch-queue` qui effectue une requête `POST` vers l'URL Webhook Discord de chaque serveur abonné.

---

## 5. Flux de Prévisualisation à la Volée (Live News Preview)

```
+------------------+                +---------------------+                +---------------------+
| Frontend Nuxt 3  | --(POST)-----> | Fastify Backend API | --(Fetch RSS)->| Steam / External    |
| (PreviewModal /  |                | (/api/news/preview) |                | News Feeds          |
| GameCard)        | <--(JSON)----- |                     | <--(Raw XML)-- |                     |
+------------------+                +---------------------+                +---------------------+
         |                                     |
         |                                (Translate)
         v                                     v
+------------------+                +---------------------+
| Rendered Embed   |                | Google Gemini 2.5   |
| (Discord UI      |                | Flash (@google/genai|
|  Dark Mode Component)             |  Temp 0.3)          |
+------------------+                +---------------------+
```

1. **Déclenchement** : L'utilisateur clique sur le bouton "👁 Preview" sur une carte de jeu (`GameCard.vue` / `WebhookModal.vue`).
2. **Requête API** : Le frontend envoie une requête `POST /api/news/preview` avec l'identifiant du jeu (`steamAppId` / `igdbId`).
3. **Extraction Brute** : `NewsFetcherService` récupère le dernier article RSS (Steam RSS XML).
4. **Traduction IA** : `GeminiTranslatorService` envoie l'article brut au modèle `gemini-2.5-flash` de Google Gemini avec une température de `0.3` et un prompt d'optimisation Discord.
5. **Rendu Composant** : Le composant `DiscordEmbedPreview.vue` affiche un faux message Discord Dark Mode complet (`#313338`) avec un commutateur d'onglets (Rendu Gemini traduit vs Contenu original anglais).
