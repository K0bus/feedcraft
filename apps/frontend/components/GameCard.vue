<script setup lang="ts">
import type { GameDTO } from '@feedcrafter/shared'
import { FileText, Eye, Bell, Check } from 'lucide-vue-next'

defineProps<{
  game: GameDTO & { platform?: string; isSubscribed?: boolean }
}>()

const emit = defineEmits<{
  (e: 'subscribe', game: GameDTO): void
  (e: 'preview', game: GameDTO): void
  (e: 'details', game: GameDTO): void
}>()
</script>

<template>
  <div class="glass-card group relative overflow-hidden flex flex-col h-full border border-dark-700/60 hover:border-brand-500/50 hover:shadow-glow-indigo transition-all duration-300">
    <!-- Cover Image Container -->
    <div class="relative h-48 w-full overflow-hidden bg-dark-950">
      <img
        :src="game.coverUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'"
        :alt="game.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"></div>
      
      <!-- Top Badges -->
      <div class="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <PlatformBadge :platform="game.platform || 'rss'" size="sm" />
        <span v-if="game.isSubscribed" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
          <Check class="w-3 h-3" />
          <span>Abonné</span>
        </span>
      </div>

      <!-- Quick Action Overlay Buttons -->
      <div class="absolute bottom-3 right-3 flex items-center gap-1.5">
        <button
          @click.stop="emit('details', game)"
          class="px-2.5 py-1 rounded-lg bg-dark-950/80 hover:bg-brand-600 text-slate-200 text-[11px] font-bold backdrop-blur-md border border-dark-700 hover:border-brand-500 flex items-center gap-1 transition-all shadow-md"
          title="Voir la fiche détaillée IGDB"
        >
          <FileText class="w-3.5 h-3.5" />
          <span>Détails</span>
        </button>

        <button
          @click.stop="emit('preview', game)"
          class="px-2.5 py-1 rounded-lg bg-dark-950/80 hover:bg-dark-900 text-slate-200 text-[11px] font-bold backdrop-blur-md border border-dark-700 flex items-center gap-1 transition-all shadow-md"
          title="Prévisualiser la dernière actualité"
        >
          <Eye class="w-3.5 h-3.5" />
          <span>News</span>
        </button>
      </div>
    </div>

    <!-- Details Body -->
    <div class="p-5 flex flex-col justify-between flex-1 space-y-4">
      <div>
        <h3 class="text-lg font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
          {{ game.name }}
        </h3>
        <p class="text-xs text-slate-400 mt-1 line-clamp-2">
          Suivi automatique des actualités, mises à jour et patch notes traduits via IA.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-1 gap-2">
        <button
          @click="emit('subscribe', game)"
          class="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200"
          :class="[
            game.isSubscribed
              ? 'bg-dark-800 hover:bg-dark-700 text-slate-300 border border-dark-600'
              : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25'
          ]"
        >
          <Bell class="w-4 h-4" />
          <span v-if="game.isSubscribed">Gérer l'abonnement</span>
          <span v-else>S'abonner aux actualités</span>
        </button>
      </div>
    </div>
  </div>
</template>
