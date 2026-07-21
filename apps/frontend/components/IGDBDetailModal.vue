<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import type { GameDTO, IGDBGameDetailsResponse } from '@feedcrafter/shared'

const props = defineProps<{
  isOpen: boolean
  game?: GameDTO | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refreshed', game: GameDTO): void
}>()

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || ''

const activeTab = ref<'details' | 'json'>('details')
const isLoading = ref<boolean>(false)
const detailsData = ref<IGDBGameDetailsResponse | null>(null)
const error = ref<string | null>(null)
const isCopied = ref<boolean>(false)
const isRefreshedSuccess = ref<boolean>(false)

// Lightbox state
const selectedImageIndex = ref<number | null>(null)

const openLightbox = (index: number) => {
  selectedImageIndex.value = index
}

const closeLightbox = () => {
  selectedImageIndex.value = null
}

const nextImage = () => {
  if (selectedImageIndex.value === null || !detailsData.value?.normalized.screenshots?.length) return
  const screenshots = detailsData.value.normalized.screenshots
  selectedImageIndex.value = (selectedImageIndex.value + 1) % screenshots.length
}

const prevImage = () => {
  if (selectedImageIndex.value === null || !detailsData.value?.normalized.screenshots?.length) return
  const screenshots = detailsData.value.normalized.screenshots
  selectedImageIndex.value = (selectedImageIndex.value - 1 + screenshots.length) % screenshots.length
}

const handleKeydown = (e: KeyboardEvent) => {
  if (selectedImageIndex.value === null) return
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'Escape') closeLightbox()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const fetchDetails = async (refresh: boolean = false) => {
  if (!props.game?.igdbId) return

  isLoading.value = true
  error.value = null
  if (!refresh) {
    detailsData.value = null
  }
  isRefreshedSuccess.value = false
  selectedImageIndex.value = null

  try {
    const requestFetch = useRequestFetch()
    const url = `${apiBaseUrl}/api/games/${props.game.igdbId}/details${refresh ? '?refresh=true' : ''}`
    detailsData.value = await requestFetch<IGDBGameDetailsResponse>(url)

    if (refresh && detailsData.value?.normalized) {
      isRefreshedSuccess.value = true
      emit('refreshed', detailsData.value.normalized)
      setTimeout(() => {
        isRefreshedSuccess.value = false
      }, 3000)
    }
  } catch (err: any) {
    error.value = err.data?.error || err.message || 'Erreur lors du chargement des détails IGDB.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.game) {
      activeTab.value = 'details'
      fetchDetails(false)
    } else {
      selectedImageIndex.value = null
    }
  }
)

const jsonFormatted = computed(() => {
  if (!detailsData.value?.raw) return ''
  return JSON.stringify(detailsData.value.raw, null, 2)
})

const copyJson = async () => {
  if (!jsonFormatted.value) return
  try {
    await navigator.clipboard.writeText(jsonFormatted.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Erreur de copie:', err)
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div @click="emit('close')" class="absolute inset-0 bg-dark-950/80 backdrop-blur-md"></div>

    <!-- Modal Container -->
    <div class="relative w-full max-w-4xl glass-panel p-6 border border-dark-700 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-dark-700/60 pb-4 flex-shrink-0">
        <div class="flex items-center space-x-3">
          <img
            v-if="game?.coverUrl"
            :src="game.coverUrl"
            :alt="game.name"
            class="w-10 h-10 rounded-lg object-cover border border-dark-600 shadow"
          />
          <div v-else class="h-10 w-10 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-sm">
            🎮
          </div>
          <div>
            <h3 class="text-xl font-bold font-outfit text-white flex items-center gap-2">
              <span>{{ game ? game.name : 'Détails du jeu' }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                IGDB ID: {{ game?.igdbId }}
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Métadonnées officielles et structure API brute issues de la base de données IGDB
            </p>
          </div>
        </div>

        <button @click="emit('close')" class="text-slate-400 hover:text-white text-2xl font-bold">×</button>
      </div>

      <!-- Navigation Tabs & Refresh Button -->
      <div class="flex items-center justify-between border-b border-dark-700/60 pb-3 flex-shrink-0 gap-3">
        <div class="flex items-center space-x-2 overflow-x-auto">
          <button
            @click="activeTab = 'details'"
            class="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
            :class="[
              activeTab === 'details'
                ? 'bg-brand-600 text-white shadow-glow-indigo'
                : 'bg-dark-800 text-slate-400 hover:text-white'
            ]"
          >
            <span>📌 Détails & Métadonnées</span>
          </button>

          <button
            @click="activeTab = 'json'"
            class="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
            :class="[
              activeTab === 'json'
                ? 'bg-brand-600 text-white shadow-glow-indigo'
                : 'bg-dark-800 text-slate-400 hover:text-white'
            ]"
          >
            <span>💻 Format JSON Brut</span>
          </button>
        </div>

        <!-- Refresh Button -->
        <div class="flex items-center space-x-2">
          <span v-if="isRefreshedSuccess" class="text-xs font-semibold text-emerald-400 animate-fade-in">
            ✅ Cache IGDB à jour !
          </span>
          <button
            @click="fetchDetails(true)"
            :disabled="isLoading"
            class="px-3.5 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            title="Forcer la mise à jour du cache IGDB et des identifiants plateformes"
          >
            <span>🔄 Rafraîchir les données IGDB</span>
          </button>
        </div>
      </div>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-y-auto pr-1">
        <!-- Loading State -->
        <div v-if="isLoading" class="p-12 text-center space-y-4">
          <div class="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-600/20 text-brand-400 border border-brand-500/30 animate-spin">
            🔄
          </div>
          <p class="text-xs text-slate-400 font-semibold">Récupération de la fiche IGDB...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-8 text-center space-y-4">
          <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            ❌ {{ error }}
          </div>
          <button
            @click="fetchDetails"
            class="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-semibold"
          >
            Réessayer
          </button>
        </div>

        <!-- TAB 1: Structured Details -->
        <div v-else-if="activeTab === 'details' && detailsData" class="space-y-6">
          <!-- Overview Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Game Cover & Key Stats -->
            <div class="glass-panel p-4 border border-dark-700 flex flex-col items-center text-center space-y-3">
              <img
                :src="detailsData.normalized.coverUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e'"
                :alt="detailsData.normalized.name"
                class="w-36 h-48 object-cover rounded-xl border border-dark-600 shadow-lg"
              />
              <div class="w-full flex items-center justify-center gap-2 pt-1">
                <PlatformBadge :platform="detailsData.normalized.platform || 'rss'" size="md" />
              </div>
            </div>

            <!-- Main Specs & Ratings -->
            <div class="md:col-span-2 glass-panel p-5 border border-dark-700 space-y-4">
              <!-- Summary -->
              <div>
                <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Résumé</h4>
                <p class="text-sm text-slate-200 leading-relaxed">
                  {{ detailsData.normalized.summary || detailsData.normalized.storyline || 'Aucun résumé disponible.' }}
                </p>
              </div>

              <!-- Stats row -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-dark-800">
                <div v-if="detailsData.normalized.rating">
                  <span class="block text-[11px] text-slate-400">Note Joueurs</span>
                  <span class="text-sm font-bold text-amber-400">⭐ {{ detailsData.normalized.rating }} / 100</span>
                </div>
                <div v-if="detailsData.normalized.aggregatedRating">
                  <span class="block text-[11px] text-slate-400">Note Presse</span>
                  <span class="text-sm font-bold text-sky-400">🏆 {{ detailsData.normalized.aggregatedRating }} / 100</span>
                </div>
                <div v-if="detailsData.normalized.firstReleaseDate">
                  <span class="block text-[11px] text-slate-400">Date de sortie</span>
                  <span class="text-xs font-semibold text-slate-200">{{ detailsData.normalized.firstReleaseDate }}</span>
                </div>
              </div>

              <!-- Developers & Publishers -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dark-800">
                <div v-if="detailsData.normalized.developers && detailsData.normalized.developers.length > 0">
                  <span class="block text-[11px] text-slate-400">Développeur(s)</span>
                  <span class="text-xs font-medium text-slate-300">{{ detailsData.normalized.developers.join(', ') }}</span>
                </div>
                <div v-if="detailsData.normalized.publishers && detailsData.normalized.publishers.length > 0">
                  <span class="block text-[11px] text-slate-400">Éditeur(s)</span>
                  <span class="text-xs font-medium text-slate-300">{{ detailsData.normalized.publishers.join(', ') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Identifiers & External Store Links -->
          <div class="glass-panel p-5 border border-dark-700 space-y-3">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identifiants Plateformes & Liens Directs</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div class="p-3 rounded-xl bg-dark-900 border border-dark-800 flex items-center justify-between">
                <div>
                  <span class="block text-[10px] text-slate-400">Steam App ID</span>
                  <span class="text-xs font-mono font-bold text-sky-400">{{ detailsData.normalized.steamAppId || 'Non associé' }}</span>
                </div>
                <a
                  v-if="detailsData.normalized.steamAppId"
                  :href="`https://store.steampowered.com/app/${detailsData.normalized.steamAppId}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-2 py-1 text-[11px] rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30"
                >
                  Magasin ↗
                </a>
              </div>

              <div class="p-3 rounded-xl bg-dark-900 border border-dark-800 flex items-center justify-between">
                <div>
                  <span class="block text-[10px] text-slate-400">Epic Games Slug</span>
                  <span class="text-xs font-mono font-bold text-slate-200">{{ detailsData.normalized.epicSlug || 'Non associé' }}</span>
                </div>
                <a
                  v-if="detailsData.normalized.epicSlug"
                  :href="`https://store.epicgames.com/fr/p/${detailsData.normalized.epicSlug}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-2 py-1 text-[11px] rounded bg-slate-700 text-slate-200 border border-slate-600 hover:bg-slate-600"
                >
                  Magasin ↗
                </a>
              </div>

              <div class="p-3 rounded-xl bg-dark-900 border border-dark-800 flex items-center justify-between">
                <div>
                  <span class="block text-[10px] text-slate-400">Battle.net Slug</span>
                  <span class="text-xs font-mono font-bold text-cyan-400">{{ detailsData.normalized.bnetSlug || 'Non associé' }}</span>
                </div>
                <a
                  v-if="detailsData.normalized.bnetSlug"
                  href="https://news.blizzard.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-2 py-1 text-[11px] rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                >
                  News ↗
                </a>
              </div>
            </div>
          </div>

          <!-- Genres, Game Modes & Themes -->
          <div class="glass-panel p-5 border border-dark-700 space-y-4">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Genres & Modes de jeu</h4>
            
            <div class="flex flex-wrap gap-2">
              <span
                v-for="genre in detailsData.normalized.genres"
                :key="genre"
                class="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20"
              >
                🏷️ {{ genre }}
              </span>
              <span
                v-for="mode in detailsData.normalized.gameModes"
                :key="mode"
                class="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              >
                🎮 {{ mode }}
              </span>
              <span
                v-for="theme in detailsData.normalized.themes"
                :key="theme"
                class="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20"
              >
                ✨ {{ theme }}
              </span>
            </div>
          </div>

          <!-- Screenshots Preview Grid & Interactive Lightbox Trigger -->
          <div v-if="detailsData.normalized.screenshots && detailsData.normalized.screenshots.length > 0" class="glass-panel p-5 border border-dark-700 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Captures d'écran ({{ detailsData.normalized.screenshots.length }})</h4>
              <span class="text-[11px] text-slate-400 font-medium">Cliquez sur une image pour la visualiser en grand</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                v-for="(img, idx) in detailsData.normalized.screenshots"
                :key="idx"
                @click="openLightbox(idx)"
                class="group relative h-28 rounded-xl overflow-hidden border border-dark-700 hover:border-brand-500 cursor-pointer transition-all shadow-md"
              >
                <img :src="img" alt="Screenshot" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div class="absolute inset-0 bg-dark-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[2px]">
                  🔍 Agrandir
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: Raw JSON View -->
        <div v-else-if="activeTab === 'json' && detailsData" class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400 font-mono">Payload JSON IGDB API v4</span>
            <button
              @click="copyJson"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              :class="[
                isCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow'
              ]"
            >
              <span>{{ isCopied ? '✅ Copié !' : '📋 Copier le JSON' }}</span>
            </button>
          </div>

          <pre class="p-4 rounded-xl bg-dark-950 text-emerald-400 text-xs font-mono border border-dark-800 overflow-x-auto max-h-[500px] leading-relaxed shadow-inner">{{ jsonFormatted }}</pre>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-4 border-t border-dark-700/60 flex justify-end flex-shrink-0">
        <button
          @click="emit('close')"
          class="px-5 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-semibold border border-dark-600 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>

    <!-- Interactive Image Lightbox Overlay -->
    <Teleport to="body">
      <div
        v-if="selectedImageIndex !== null && detailsData?.normalized.screenshots"
        class="fixed inset-0 z-[100] bg-dark-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 select-none"
      >
        <!-- Lightbox Top Navigation Bar -->
        <div class="flex items-center justify-between w-full max-w-7xl mx-auto flex-shrink-0 pt-2 pb-4">
          <div class="flex items-center space-x-3">
            <span class="text-xs font-bold px-3 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-outfit">
              📷 Capture {{ selectedImageIndex + 1 }} / {{ detailsData.normalized.screenshots.length }}
            </span>
            <span class="text-xs text-slate-400 hidden sm:inline">
              Naviguez avec ⬅️ ➡️ ou les flèches du clavier
            </span>
          </div>

          <button
            @click="closeLightbox"
            class="px-4 py-2 rounded-xl bg-dark-800 hover:bg-rose-500/20 text-slate-200 hover:text-rose-400 text-xs font-bold border border-dark-600 hover:border-rose-500/50 flex items-center gap-2 transition-all shadow-lg"
          >
            <span>✕ Masquer l'image (Esc)</span>
          </button>
        </div>

        <!-- Main Center Image Display with Floating Nav Arrows -->
        <div class="relative flex-1 flex items-center justify-center w-full max-w-7xl mx-auto my-2 overflow-hidden">
          <!-- Previous Image Button -->
          <button
            @click.stop="prevImage"
            class="absolute left-2 sm:left-6 z-10 w-12 h-12 rounded-2xl bg-dark-900/80 hover:bg-brand-600 text-white border border-dark-700 hover:border-brand-500 shadow-2xl flex items-center justify-center text-xl font-bold transition-all transform hover:scale-110 active:scale-95"
            title="Image précédente (Flèche Gauche ⬅️)"
          >
            ❮
          </button>

          <!-- Main Image -->
          <div class="relative max-h-full max-w-full flex items-center justify-center p-2">
            <img
              :src="detailsData.normalized.screenshots[selectedImageIndex]"
              :alt="`Capture ${selectedImageIndex + 1}`"
              class="max-h-[75vh] max-w-[85vw] object-contain rounded-2xl border border-dark-700 shadow-2xl transition-all duration-300"
            />
          </div>

          <!-- Next Image Button -->
          <button
            @click.stop="nextImage"
            class="absolute right-2 sm:right-6 z-10 w-12 h-12 rounded-2xl bg-dark-900/80 hover:bg-brand-600 text-white border border-dark-700 hover:border-brand-500 shadow-2xl flex items-center justify-center text-xl font-bold transition-all transform hover:scale-110 active:scale-95"
            title="Image suivante (Flèche Droite ➡️)"
          >
            ❯
          </button>
        </div>

        <!-- Bottom Horizontal Thumbnails Strip -->
        <div class="w-full max-w-5xl mx-auto flex-shrink-0 pt-2 pb-2 overflow-x-auto">
          <div class="flex items-center justify-center gap-2.5 px-4 py-2">
            <button
              v-for="(thumb, tIdx) in detailsData.normalized.screenshots"
              :key="tIdx"
              @click="selectedImageIndex = tIdx"
              class="h-14 w-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0"
              :class="[
                selectedImageIndex === tIdx
                  ? 'border-brand-500 scale-105 shadow-glow-indigo'
                  : 'border-dark-700 opacity-50 hover:opacity-100'
              ]"
            >
              <img :src="thumb" alt="Thumbnail" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
