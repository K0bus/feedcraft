<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { GameDTO, CreateSubscriptionPayload } from '@feedcrafter/shared'
import { Search, Loader2, Gamepad2, Sparkles, Layers } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || ''

const searchQuery = ref('')
const activePlatform = ref<string>('all')
const isLoading = ref<boolean>(false)
const games = ref<GameDTO[]>([])

const isModalOpen = ref(false)
const isPreviewModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const selectedGame = ref<GameDTO | null>(null)

// Filter games by active platform tab
const filteredGames = computed(() => {
  if (activePlatform.value === 'all') return games.value
  return games.value.filter((g) => {
    const p = (g.platform || '').toLowerCase()
    if (activePlatform.value === 'steam') return !!g.steamAppId || p === 'steam'
    if (activePlatform.value === 'epic') return !!g.epicSlug || p === 'epic'
    if (activePlatform.value === 'bnet') return !!g.bnetSlug || p === 'bnet' || p.includes('blizzard') || p.includes('battle.net')
    return p === activePlatform.value
  })
})

// Fetch popular games on mount
const fetchPopularGames = async () => {
  isLoading.value = true
  try {
    const requestFetch = useRequestFetch()
    games.value = await requestFetch<GameDTO[]>(`${apiBaseUrl}/api/games/popular`)
  } catch (err) {
    console.error('Error fetching popular games:', err)
  } finally {
    isLoading.value = false
  }
}

// Search IGDB games with debounce
let searchTimeout: any = null
const searchGames = async (query: string) => {
  if (!query || query.trim().length === 0) {
    return fetchPopularGames()
  }

  isLoading.value = true
  try {
    const requestFetch = useRequestFetch()
    games.value = await requestFetch<GameDTO[]>(`${apiBaseUrl}/api/games/search?query=${encodeURIComponent(query)}`)
  } catch (err) {
    console.error('Error searching games:', err)
  } finally {
    isLoading.value = false
  }
}

watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchGames(newQuery)
  }, 400)
})

onMounted(() => {
  fetchPopularGames()
})

const handleSubscribeClick = (game: GameDTO) => {
  selectedGame.value = game
  isModalOpen.value = true
}

const handlePreviewClick = (game: GameDTO) => {
  selectedGame.value = game
  isPreviewModalOpen.value = true
}

const handleDetailsClick = (game: GameDTO) => {
  selectedGame.value = game
  isDetailModalOpen.value = true
}

const handleSaveWebhook = async (data: {
  webhookUrl: string
  language: string
  channelName?: string
  guildId?: string
  guildName?: string
  guildIcon?: string
}) => {
  if (!selectedGame.value) return

  const payload: CreateSubscriptionPayload = {
    igdbId: selectedGame.value.igdbId,
    gameName: selectedGame.value.name,
    coverUrl: selectedGame.value.coverUrl || undefined,
    steamAppId: selectedGame.value.steamAppId || undefined,
    epicSlug: selectedGame.value.epicSlug || undefined,
    bnetSlug: selectedGame.value.bnetSlug || undefined,
    discordWebhookUrl: data.webhookUrl,
    guildId: data.guildId,
    guildName: data.guildName || data.channelName || 'Serveur Discord',
    guildIcon: data.guildIcon
  }

  try {
    const requestFetch = useRequestFetch()
    await requestFetch(`${apiBaseUrl}/api/subscriptions`, {
      method: 'POST',
      body: payload
    })

    alert(`Abonnement réussi aux actualités de ${selectedGame.value.name} !`)
    const target = games.value.find((g) => g.igdbId === selectedGame.value?.igdbId)
    if (target) target.isSubscribed = true
  } catch (err: any) {
    alert(`Échec de la création de l'abonnement : ${err.data?.error || err.message || 'Erreur inconnue'}`)
    console.error('Subscription error:', err)
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header & Filters -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold font-outfit text-white tracking-tight flex items-center gap-2">
          <Gamepad2 class="w-6 h-6 text-brand-400" />
          <span>Catalogue des Jeux & Patch Notes (IGDB API)</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Recherchez dans la base de données IGDB, prévisualisez les actualités traduites et abonnez vos canaux Discord.
        </p>
      </div>

      <!-- Realtime Search Input -->
      <div class="w-full md:w-80 relative flex items-center">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher (ex: Counter-Strike, WoW)..."
          class="w-full glass-input glass-search-input text-xs"
          style="padding-left: 2.75rem !important; padding-right: 2.5rem !important;"
        />
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
        <Loader2 v-if="isLoading" class="w-4 h-4 text-brand-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 z-10" />
      </div>
    </div>

    <!-- Platform Filter Tabs -->
    <div class="flex items-center space-x-2 border-b border-dark-700/60 pb-3 overflow-x-auto">
      <button
        @click="activePlatform = 'all'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        :class="activePlatform === 'all' ? 'bg-brand-600 text-white shadow-glow-indigo' : 'bg-dark-900 text-slate-400 hover:text-white border border-dark-700/60'"
      >
        <Layers class="w-3.5 h-3.5" />
        <span>Tous les jeux</span>
      </button>

      <button
        @click="activePlatform = 'steam'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
        :class="activePlatform === 'steam' ? 'bg-sky-600 text-white shadow-lg' : 'bg-dark-900 text-slate-400 hover:text-white border border-dark-700/60'"
      >
        Steam
      </button>

      <button
        @click="activePlatform = 'epic'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
        :class="activePlatform === 'epic' ? 'bg-slate-200 text-dark-950 shadow-lg' : 'bg-dark-900 text-slate-400 hover:text-white border border-dark-700/60'"
      >
        Epic Games
      </button>

      <button
        @click="activePlatform = 'bnet'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
        :class="activePlatform === 'bnet' ? 'bg-cyan-600 text-white shadow-lg' : 'bg-dark-900 text-slate-400 hover:text-white border border-dark-700/60'"
      >
        Battle.net
      </button>
    </div>

    <!-- Games Grid -->
    <div v-if="isLoading && games.length === 0" class="glass-card p-12 text-center text-slate-400">
      <p class="text-sm font-semibold animate-pulse flex items-center justify-center gap-2">
        <Loader2 class="w-4 h-4 text-brand-400 animate-spin" />
        <span>Chargement du catalogue IGDB...</span>
      </p>
    </div>

    <div v-else-if="filteredGames.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <GameCard
        v-for="game in filteredGames"
        :key="game.igdbId"
        :game="game"
        @subscribe="handleSubscribeClick"
        @preview="handlePreviewClick"
        @details="handleDetailsClick"
      />
    </div>

    <div v-else class="glass-card p-12 text-center text-slate-400 space-y-3 border border-dark-700/60">
      <Sparkles class="w-8 h-8 text-slate-600 mx-auto" />
      <p class="text-base font-semibold text-white">Aucun jeu ne correspond à votre recherche.</p>
      <p class="text-xs">Essayez de saisir un autre mot-clé dans la barre de recherche.</p>
    </div>

    <!-- Webhook Setup Modal -->
    <WebhookModal
      :is-open="isModalOpen"
      :game="selectedGame"
      @close="isModalOpen = false"
      @save="handleSaveWebhook"
    />

    <!-- News Preview Modal -->
    <PreviewModal
      :is-open="isPreviewModalOpen"
      :game="selectedGame"
      @close="isPreviewModalOpen = false"
    />

    <!-- IGDB Game Details & Raw JSON Modal -->
    <IGDBDetailModal
      :is-open="isDetailModalOpen"
      :game="selectedGame"
      @close="isDetailModalOpen = false"
    />
  </div>
</template>
