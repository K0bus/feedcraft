<script setup lang="ts">
import type { GameDTO } from '@feedcrafter/shared'

const props = defineProps<{
  game: GameDTO & { platform?: string; isSubscribed?: boolean }
}>()

const emit = defineEmits<{
  (e: 'subscribe', game: GameDTO): void
  (e: 'preview', game: GameDTO): void
}>()
</script>

<template>
  <div class="glass-panel group relative overflow-hidden flex flex-col h-full border border-dark-700/60 hover:border-brand-500/50 hover:shadow-glow-indigo transition-all duration-300">
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
        <PlatformBadge :platform="game.platform || 'steam'" size="sm" />
        <span v-if="game.isSubscribed" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
          Abonné
        </span>
      </div>

      <!-- Quick Preview Overlay Button -->
      <button
        @click.stop="emit('preview', game)"
        class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-dark-950/80 hover:bg-dark-900 text-slate-200 text-[11px] font-semibold backdrop-blur-md border border-dark-700 flex items-center gap-1 transition-all opacity-90 group-hover:opacity-100 shadow-md"
        title="Prévisualiser la dernière actualité"
      >
        <span>👁 Preview</span>
      </button>
    </div>

    <!-- Details Body -->
    <div class="p-5 flex flex-col justify-between flex-1 space-y-4">
      <div>
        <h3 class="text-lg font-bold text-white group-hover:text-brand-500 transition-colors line-clamp-1">
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
          class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200"
          :class="[
            game.isSubscribed
              ? 'bg-dark-800 hover:bg-dark-700 text-slate-300 border border-dark-600'
              : 'bg-gradient-to-r from-brand-600 to-indigo-500 hover:from-brand-500 hover:to-indigo-400 text-white shadow-lg shadow-brand-500/25'
          ]"
        >
          <span v-if="game.isSubscribed">Gérer l'abonnement</span>
          <span v-else>S'abonner aux actualités</span>
        </button>
      </div>
    </div>
  </div>
</template>
