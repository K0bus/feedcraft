<script setup lang="ts">
import { ref, watch } from 'vue'
import type { GameDTO, NewsPreviewResponse } from '@feedcrafter/shared'
import { Eye, Sparkles, RotateCw, X, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  game?: GameDTO | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || ''

const isLoading = ref<boolean>(false)
const previewData = ref<NewsPreviewResponse | null>(null)
const error = ref<string | null>(null)

const fetchPreview = async (force: boolean = false) => {
  if (!props.game) return

  isLoading.value = true
  error.value = null
  if (force) {
    previewData.value = null
  }

  try {
    const requestFetch = useRequestFetch()
    previewData.value = await requestFetch<NewsPreviewResponse>(`${apiBaseUrl}/api/news/preview`, {
      method: 'POST',
      body: {
        igdbId: props.game.igdbId,
        steamAppId: props.game.steamAppId || undefined,
        gameName: props.game.name,
        forceRegenerate: force
      }
    })
  } catch (err: any) {
    error.value = err.data?.error || err.message || 'Erreur réseau lors de la prévisualisation.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.game) {
      fetchPreview(false)
    }
  }
)
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div @click="emit('close')" class="absolute inset-0 bg-dark-950/85 backdrop-blur-md"></div>

    <!-- Modal Window -->
    <div class="relative w-full max-w-3xl glass-card p-6 border border-dark-700 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-dark-700/60 pb-4 flex-shrink-0">
        <div class="flex items-center space-x-3">
          <div class="h-9 w-9 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold">
            <Eye class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-xl font-extrabold font-outfit text-white">
              Prévisualisation de la dernière actualité
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              {{ game ? game.name : 'Jeu sélectionné' }}
            </p>
          </div>
        </div>
        <button @click="emit('close')" class="p-1.5 rounded-lg bg-dark-900 text-slate-400 hover:text-white transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Content Container -->
      <div class="flex-1 overflow-y-auto">
        <!-- Skeleton Loader / Gemini AI Animation -->
        <div v-if="isLoading" class="p-12 text-center space-y-6">
          <div class="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 animate-pulse">
            <Sparkles class="w-8 h-8" />
          </div>
          <div class="space-y-2">
            <h4 class="text-base font-extrabold text-white font-outfit">
              Extraction du patch note & Traduction IA en cours...
            </h4>
            <p class="text-xs text-slate-400 max-w-md mx-auto">
              Récupération du dernier article officiel et génération du rendu Discord optimisé.
            </p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-8 text-center space-y-4">
          <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-center gap-2">
            <AlertCircle class="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{{ error }}</span>
          </div>
          <button
            @click="fetchPreview(true)"
            class="px-4 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-300 text-xs font-bold border border-dark-700/60"
          >
            Réessayer
          </button>
        </div>

        <!-- Rendered Preview -->
        <DiscordEmbedPreview v-else-if="previewData" :data="previewData" />
      </div>

      <!-- Footer Buttons -->
      <div class="pt-4 border-t border-dark-700/60 flex items-center justify-between flex-shrink-0">
        <button
          @click="fetchPreview(true)"
          :disabled="isLoading"
          class="px-4 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-400 hover:text-brand-300 border border-brand-500/30 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>Régénérer l'actualité</span>
        </button>

        <button
          @click="emit('close')"
          class="px-5 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-300 text-xs font-bold border border-dark-700/60"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>
