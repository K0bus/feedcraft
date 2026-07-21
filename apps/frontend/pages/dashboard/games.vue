<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { GameDTO, CreateSubscriptionPayload } from '@feedcrafter/shared'

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
const selectedGame = ref<GameDTO | null>(null)

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

const handleSaveWebhook = async (data: { webhookUrl: string; language: string; channelName?: string }) => {
  if (!selectedGame.value) return

  const payload: CreateSubscriptionPayload = {
    igdbId: selectedGame.value.igdbId,
    gameName: selectedGame.value.name,
    coverUrl: selectedGame.value.coverUrl || undefined,
    steamAppId: selectedGame.value.steamAppId || undefined,
    epicSlug: selectedGame.value.epicSlug || undefined,
    bnetSlug: selectedGame.value.bnetSlug || undefined,
    discordWebhookUrl: data.webhookUrl,
    guildName: data.channelName || 'Serveur Discord'
  }

  try {
    const requestFetch = useRequestFetch()
    await requestFetch(`${apiBaseUrl}/api/subscriptions`, {
      method: 'POST',
      body: payload
    })

    alert(`✅ Abonnement réussi aux actualités de ${selectedGame.value.name} !`)
    const target = games.value.find((g) => g.igdbId === selectedGame.value?.igdbId)
    if (target) target.isSubscribed = true
  } catch (err: any) {
    alert(`❌ Échec de la création de l'abonnement : ${err.data?.error || err.message || 'Erreur inconnue'}`)
    console.error('Subscription error:', err)
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header & Filters -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold font-outfit text-white">
          Catalogue des Jeux & Patch Notes (IGDB API)
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Recherchez dans la base de données IGDB, prévisualisez les actualités traduites et abonnez vos canaux Discord.
        </p>
      </div>

      <!-- Realtime Search Input -->
      <div class="w-full md:w-80 relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Rechercher un jeu (ex: Counter-Strike, WoW)..."
          class="w-full glass-input pr-10"
        />
        <span v-if="isLoading" class="absolute right-3 top-3 text-xs text-brand-500 animate-spin">⏳</span>
      </div>
    </div>

    <!-- Platform Filter Tabs -->
    <div class="flex items-center space-x-2 border-b border-dark-700/60 pb-3 overflow-x-auto">
      <button
        @click="activePlatform = 'all'"
        class="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
        :class="activePlatform === 'all' ? 'bg-brand-600 text-white shadow-glow-indigo' : 'bg-dark-800 text-slate-400 hover:text-white'"
      >
        Tous les jeux
      </button>

      <button
        @click="activePlatform = 'steam'"
        class="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
        :class="activePlatform === 'steam' ? 'bg-sky-500 text-white' : 'bg-dark-800 text-slate-400 hover:text-white'"
      >
        Steam
      </button>

      <button
        @click="activePlatform = 'epic'"
        class="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
        :class="activePlatform === 'epic' ? 'bg-slate-300 text-dark-950' : 'bg-dark-800 text-slate-400 hover:text-white'"
      >
        Epic Games
      </button>

      <button
        @click="activePlatform = 'bnet'"
        class="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
        :class="activePlatform === 'bnet' ? 'bg-cyan-500 text-white' : 'bg-dark-800 text-slate-400 hover:text-white'"
      >
        Battle.net
      </button>
    </div>

    <!-- Games Grid -->
    <div v-if="isLoading && games.length === 0" class="glass-panel p-12 text-center text-slate-400">
      <p class="text-sm font-semibold animate-pulse">Chargement du catalogue IGDB...</p>
    </div>

    <div v-else-if="games.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <GameCard
        v-for="game in games"
        :key="game.igdbId"
        :game="game"
        @subscribe="handleSubscribeClick"
        @preview="handlePreviewClick"
      />
    </div>

    <div v-else class="glass-panel p-12 text-center text-slate-400 space-y-3">
      <p class="text-base font-semibold">Aucun jeu ne correspond à votre recherche.</p>
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
  </div>
</template>
