> **RÈGLE DE MAINTENANCE DE LA DOCUMENTATION**
> Cette documentation fait foi pour le design system, la charte graphique et la structure des composants du Frontend Nuxt 3 de FeedCrafter.
> **Obligation :** Tout changement dans la palette de couleurs, les jetons TailwindCSS, l'iconographie ou l'architecture des pages DOIT être immédiatement répercuté dans ce fichier.

# Design System & Spécifications UI/UX - FeedCrafter Frontend

Ce document décrit la direction artistique, la charte graphique et la hiérarchie des composants réutilisables de l'application Nuxt 3 **FeedCrafter**.

---

## 1. Direction Artistique & Jetons de Design (Design Tokens)

FeedCrafter adopte une esthétique **Gaming & Cyberpunk moderne et épurée** (type Vercel x Discord).

### 🎨 Palette de Couleurs (Tailwind Config)
- **Fond d'Écran Principal (Deep Carbon)** : `#090A0F` (`bg-dark-950`) avec motif radial cyber-grid.
- **Cartes & Panneaux (Slate Dark)** : `#12151E` (`bg-dark-900`), `#1A1E2C` (`bg-dark-800`).
- **Accents Néon / Indigo** : `#6366F1` (`brand-500`), `#4F46E5` (`brand-600`), `#8B5CF6` (`brand-accent`).
- **Statuts Dynamiques** :
  - Vert Néon (`#10B981` / `neon-green`) : Webhook actif & fonctionnel.
  - Rouge Néon (`#EF4444` / `neon-red`) : Erreur 404 / Webhook invalide.
  - Ambre (`#F59E0B` / `neon-amber`) : Traitement en cours.
- **Discord Integration** : `#5865F2` (`discord`).

### ✍️ Typographie
- **Titres & En-têtes** : `Outfit` (Google Fonts), polices bold & tracking-tight.
- **Corps de texte & UI** : `Inter` (Sans-serif moderne).

### ✨ Effets Visuels (Glassmorphism & Shadows)
- `glass-panel` : Arrière-plan sombre translucide (`bg-dark-900/80`), `backdrop-blur-xl`, bordure fine `border-dark-700/60`.
- `shadow-glow-indigo` : Ombre portée violette (`0 0 25px -5px rgba(99, 102, 241, 0.35)`).

---

## 2. Arborescence des Composants et Layouts

```
apps/frontend/
├── components/
│   ├── AppHeader.vue        # Navigation publique principale & CTA Discord
│   ├── AppFooter.vue        # Footer public avec statut des services
│   ├── Sidebar.vue          # Navigation latérale du Dashboard
│   ├── PlatformBadge.vue    # Badges des plateformes (Steam, Epic, Battle.net, RSS)
│   ├── StatusIndicator.vue  # Pastille de statut animée (Pulse green/red)
│   ├── GameCard.vue         # Vignette de jeu avec couverture HD & action
│   └── WebhookModal.vue     # Modal d'ajout/édition de Webhook Discord
├── layouts/
│   ├── default.vue          # Layout public pour la Landing et le Login
│   └── dashboard.vue        # Layout administration avec Sidebar et Topbar
└── pages/
    ├── index.vue            # Hero Cyberpunk, grille de fonctionnalités, showcase
    ├── auth/
    │   └── login.vue        # Authentification Discord OAuth2
    └── dashboard/
        ├── index.vue        # Gestion des abonnements & Webhooks Discord
        ├── games.vue        # Catalogue interactif de jeux & filtre plateforme
        └── logs.vue         # Historique des traductions Gemini & envois
```

---

## 3. Guide d'Utilisation des Composants

### `<PlatformBadge platform="steam" size="sm" />`
Affiche le badge identifiant la source de l'actualité (`steam`, `epic`, `bnet`, `rss`).

### `<StatusIndicator status="active" label="En ligne" />`
Pastille de statut lumineuse avec animation de clignotement pour les webhooks actifs ou en erreur.

### `<WebhookModal :isOpen="true" :game="game" @close="..." @save="..." />`
Modal réutilisable permettant de saisir une URL de Webhook Discord, de tester l'envoi en direct et de sélectionner la langue cible pour Gemini AI.
