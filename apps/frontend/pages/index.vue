<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const features = [
  {
    title: 'Extraction Multi-Plateformes',
    description: 'Centralisez les actualités et patch notes provenant de Steam, Epic Games Store, Battle.net et flux RSS personnalisés.',
    badge: 'Multi-Sources'
  },
  {
    title: 'Traduction & Résumé IA Gemini',
    description: 'Le modèle Google Gemini 2.5 Flash traduit automatiquement le contenu en Français et génère un résumé prêt pour Discord.',
    badge: 'Gemini 2.5 Flash'
  },
  {
    title: 'Distribution Webhook Instantanée',
    description: 'Acheminement fluide et sécurisé vers les canaux Discord de vos serveurs communautaires grâce à BullMQ & Redis.',
    badge: 'Zero Latency'
  },
  {
    title: 'Panel d\'Administration Intuitif',
    description: 'Gérez vos abonnements, testez vos Webhooks Discord et consultez l\'historique des traductions en temps réel.',
    badge: 'UX Optimisée'
  }
]
</script>

<template>
  <div class="space-y-24 py-12">
    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
      <!-- Glow effect -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div class="max-w-4xl mx-auto space-y-6 relative z-10">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-500 border border-brand-500/20 shadow-glow-indigo">
          <span class="animate-pulse">✨</span>
          <span>Traduction automatique des Patch Notes via Google Gemini AI</span>
        </div>

        <h1 class="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none font-outfit">
          Automatisez vos actualités <span class="bg-clip-text text-transparent bg-gradient-to-r from-brand-500 via-indigo-400 to-violet-400">Discord</span> en Français
        </h1>

        <p class="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Abonnez vos canaux communautaires aux jeux Steam, Epic Games & Battle.net. FeedCrafter extrait, traduit par IA et distribue vos actualités en temps réel via Webhook.
        </p>

        <!-- CTA Action Buttons -->
        <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink
            to="/auth/login"
            class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-discord hover:bg-discord-hover text-white font-bold text-sm transition-all duration-200 shadow-xl shadow-discord/30 flex items-center justify-center space-x-3 group"
          >
            <span class="w-5 h-5 bg-white rounded-full flex items-center justify-center text-discord font-black text-xs">D</span>
            <span>Connecter avec Discord</span>
          </NuxtLink>

          <NuxtLink
            to="/dashboard"
            class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-dark-800 hover:bg-dark-700 text-slate-200 font-semibold text-sm border border-dark-600 transition-all flex items-center justify-center"
          >
            Explorer le Dashboard
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Platform Showcase Banner -->
    <section id="platforms" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="glass-panel p-8 md:p-12 text-center space-y-8">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Sources & Plateformes de Jeux Intégrées
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center">
          <div class="glass-card flex items-center justify-center space-x-3 p-4 hover:border-sky-500/40 transition-colors">
            <PlatformBadge platform="steam" size="md" />
            <span class="text-sm font-semibold text-white">Steam News</span>
          </div>

          <div class="glass-card flex items-center justify-center space-x-3 p-4 hover:border-slate-400/40 transition-colors">
            <PlatformBadge platform="epic" size="md" />
            <span class="text-sm font-semibold text-white">Epic Store</span>
          </div>

          <div class="glass-card flex items-center justify-center space-x-3 p-4 hover:border-cyan-500/40 transition-colors">
            <PlatformBadge platform="bnet" size="md" />
            <span class="text-sm font-semibold text-white">Battle.net</span>
          </div>

          <div class="glass-card flex items-center justify-center space-x-3 p-4 hover:border-amber-500/40 transition-colors">
            <PlatformBadge platform="rss" size="md" />
            <span class="text-sm font-semibold text-white">RSS Feeds</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section id="features" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div class="text-center space-y-3">
        <h2 class="text-3xl sm:text-4xl font-bold font-outfit text-white">
          Pourquoi choisir FeedCrafter ?
        </h2>
        <p class="text-slate-400 max-w-xl mx-auto text-sm">
          Une infrastructure conçue pour les administrateurs de serveurs Discord exigeants.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(feat, idx) in features"
          :key="idx"
          class="glass-panel-hover p-6 space-y-4 flex flex-col justify-between"
        >
          <div class="space-y-3">
            <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-brand-600/20 text-brand-400 border border-brand-500/30">
              {{ feat.badge }}
            </span>
            <h3 class="text-lg font-bold text-white font-outfit">
              {{ feat.title }}
            </h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              {{ feat.description }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
