<template>
  <footer class="border-t border-dark-700/60 bg-dark-950 py-12 text-slate-400 text-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      <!-- Brand column -->
      <div class="space-y-4 md:col-span-1">
        <div class="flex items-center space-x-3">
          <div class="h-8 w-8 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white text-xs font-outfit">
            FC
          </div>
          <span class="text-lg font-bold text-white font-outfit">FeedCrafter</span>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Service automatisé de diffusion d'actualités et patch notes de jeux vidéo pour serveurs Discord communautaires avec traduction IA Gemini.
        </p>
      </div>

      <!-- Quick links -->
      <div>
        <h4 class="text-xs font-semibold text-white uppercase tracking-wider mb-3">Plateformes</h4>
        <ul class="space-y-2 text-xs">
          <li><a href="#" class="hover:text-white transition-colors">Steam News API</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Epic Games Store</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Battle.net Patch Notes</a></li>
          <li><a href="#" class="hover:text-white transition-colors">RSS Custom Feeds</a></li>
        </ul>
      </div>

      <!-- Service Status -->
      <div>
        <h4 class="text-xs font-semibold text-white uppercase tracking-wider mb-3">Statut du Service</h4>
        <div class="space-y-2 text-xs">
          <div class="flex items-center space-x-2">
            <StatusIndicator status="active" label="API REST (Online)" />
          </div>
          <div class="flex items-center space-x-2">
            <StatusIndicator status="active" label="Worker BullMQ (Operational)" />
          </div>
          <div class="flex items-center space-x-2">
            <StatusIndicator status="active" label="Gemini 2.5 AI (Ready)" />
          </div>
        </div>
      </div>

      <!-- Legal & Community -->
      <div>
        <h4 class="text-xs font-semibold text-white uppercase tracking-wider mb-3">Communauté</h4>
        <ul class="space-y-2 text-xs">
          <li><a href="https://discord.com" target="_blank" class="hover:text-white transition-colors">Serveur Discord Support</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Conditions d'utilisation</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Politique de confidentialité</a></li>
        </ul>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
      <p>© 2026 FeedCrafter. Tous droits réservés.</p>
      <p class="mt-2 sm:mt-0">Propulsé par Nuxt 3, Fastify, BullMQ & Google Gemini AI.</p>
    </div>
  </footer>
</template>
