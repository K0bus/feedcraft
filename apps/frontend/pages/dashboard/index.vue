<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Gamepad2,
  Radio,
  Bot,
  Plus,
  FileText,
  Eye,
  RefreshCw,
  Send,
  Edit,
  Trash2,
  Copy,
  Check,
  Clock,
  Sparkles
} from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || ''

const subscriptions = ref<any[]>([])
const isLoading = ref<boolean>(true)
const isModalOpen = ref(false)
const isPreviewModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const selectedGameForEdit = ref<any>(null)
const selectedGameForPreview = ref<any>(null)
const selectedGameForDetail = ref<any>(null)
const copiedId = ref<string | null>(null)

const fetchSubscriptions = async () => {
  isLoading.value = true
  try {
    const requestFetch = useRequestFetch()
    subscriptions.value = await requestFetch<any[]>(`${apiBaseUrl}/api/subscriptions`)
  } catch (err) {
    console.error('Error fetching subscriptions:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchSubscriptions()
})

const copyWebhookUrl = (url: string, id: string) => {
  navigator.clipboard.writeText(url)
  copiedId.value = id
  setTimeout(() => {
    copiedId.value = null
  }, 2000)
}

const openEditModal = (sub: any) => {
  selectedGameForEdit.value = { name: sub.game?.name || 'Jeu' }
  isModalOpen.value = true
}

const openPreviewModal = (sub: any) => {
  if (sub.game) {
    selectedGameForPreview.value = sub.game
    isPreviewModalOpen.value = true
  }
}

const openDetailModal = (sub: any) => {
  if (sub.game) {
    selectedGameForDetail.value = sub.game
    isDetailModalOpen.value = true
  }
}

const handleGameRefreshed = (updatedGame: any) => {
  if (!updatedGame) return
  subscriptions.value.forEach((sub) => {
    if (sub.game && sub.game.igdbId === updatedGame.igdbId) {
      sub.game = { ...sub.game, ...updatedGame }
    }
  })
}

const testWebhook = async (sub: any) => {
  if (!sub.discordWebhookUrl) return
  try {
    const res = await fetch(`${apiBaseUrl}/api/subscriptions/test-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: sub.discordWebhookUrl,
        gameName: sub.game?.name || 'FeedCrafter'
      })
    })

    if (res.ok) {
      alert(`Message de test envoyé avec succès sur le salon Discord de ${sub.game?.name || 'votre jeu'} !`)
    } else {
      const err = await res.json()
      alert(`Échec de l'envoi : ${err.error || 'Erreur inconnue'}`)
    }
  } catch (err: any) {
    alert(`Échec de la connexion au serveur : ${err.message}`)
  }
}

const clearingCacheId = ref<string | null>(null)

const clearSubscriptionCache = async (sub: any) => {
  if (!confirm(`Voulez-vous vider le cache d'envoi et renvoyer la dernière actualité de ${sub.game?.name || 'ce jeu'} sur Discord ?`)) return

  clearingCacheId.value = sub.id
  try {
    const requestFetch = useRequestFetch()
    const res = await requestFetch<any>(`${apiBaseUrl}/api/subscriptions/${sub.id}/clear-cache`, {
      method: 'POST'
    })
    alert(res.message || 'Cache réinitialisé avec succès !')
  } catch (err: any) {
    alert(`Échec de la réinitialisation : ${err.data?.error || err.message || 'Erreur inconnue'}`)
  } finally {
    clearingCacheId.value = null
  }
}

const deleteSubscription = async (id: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) return

  try {
    const requestFetch = useRequestFetch()
    await requestFetch(`${apiBaseUrl}/api/subscriptions/${id}`, {
      method: 'DELETE'
    })
    subscriptions.value = subscriptions.value.filter((s) => s.id !== id)
  } catch (err) {
    console.error('Error deleting subscription:', err)
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Top Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="glass-card p-6 space-y-2 relative overflow-hidden border border-dark-700/60 hover:border-brand-500/30 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Jeux Suivis</span>
          <div class="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Gamepad2 class="w-4 h-4" />
          </div>
        </div>
        <div class="text-4xl font-extrabold font-outfit text-white">
          {{ subscriptions.length }}
        </div>
        <div class="text-xs text-slate-400 font-medium">Abonnements actifs sur ce compte</div>
      </div>

      <div class="glass-card p-6 space-y-2 relative overflow-hidden border border-dark-700/60 hover:border-emerald-500/30 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Webhooks Opérationnels</span>
          <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio class="w-4 h-4" />
          </div>
        </div>
        <div class="text-4xl font-extrabold font-outfit text-emerald-400">
          {{ subscriptions.filter(s => s.status === 'ACTIVE').length }}
        </div>
        <div class="text-xs text-emerald-400 font-medium flex items-center gap-1">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Prêts pour la distribution</span>
        </div>
      </div>

      <div class="glass-card p-6 space-y-2 relative overflow-hidden border border-dark-700/60 hover:border-amber-500/30 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">IA & Service Worker</span>
          <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Bot class="w-4 h-4" />
          </div>
        </div>
        <div class="text-xl font-bold font-outfit text-white flex items-center gap-2">
          <span>FeedCrafter AI Engine</span>
        </div>
        <div class="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Clock class="w-3 h-3 text-amber-400" />
          <span>Scan Cron automatique / 15 min</span>
        </div>
      </div>
    </div>

    <!-- Subscriptions Header & Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold font-outfit text-white tracking-tight flex items-center gap-2">
          <span>Mes Abonnements Jeux & Webhooks</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Gérez le routage automatique de vos actualités vers vos salons Discord.
        </p>
      </div>

      <NuxtLink
        to="/dashboard/games"
        class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center space-x-2 transition-all self-start sm:self-auto"
      >
        <Plus class="w-4 h-4" />
        <span>Ajouter un Jeu</span>
      </NuxtLink>
    </div>

    <!-- Subscriptions List Cards -->
    <div v-if="isLoading" class="glass-card p-12 text-center text-slate-400">
      <p class="text-sm font-semibold animate-pulse flex items-center justify-center gap-2">
        <RefreshCw class="w-4 h-4 animate-spin text-brand-400" />
        <span>Chargement de vos abonnements...</span>
      </p>
    </div>

    <div v-else-if="subscriptions.length > 0" class="space-y-4">
      <div
        v-for="sub in subscriptions"
        :key="sub.id"
        class="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-500/40 transition-all border border-dark-700/60"
      >
        <!-- Game details -->
        <div class="flex items-center space-x-4 min-w-[240px]">
          <img
            @click="openDetailModal(sub)"
            :src="sub.game?.coverUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'"
            :alt="sub.game?.name || 'Jeu'"
            class="h-16 w-16 rounded-xl object-cover border border-dark-700 bg-dark-950 cursor-pointer hover:opacity-90 hover:border-brand-500 transition-all"
            title="Voir la fiche détaillée IGDB"
          />
          <div>
            <div class="flex items-center space-x-2">
              <h3 @click="openDetailModal(sub)" class="font-bold text-white text-base hover:text-brand-400 cursor-pointer transition-colors">{{ sub.game?.name || 'Jeu Inconnu' }}</h3>
              <PlatformBadge :platform="sub.game?.steamAppId ? 'steam' : sub.game?.epicSlug ? 'epic' : sub.game?.bnetSlug ? 'bnet' : (sub.game?.platform || 'rss')" size="sm" />
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Serveur / Salon : <span class="text-slate-200 font-medium">{{ sub.guildName || '#général' }}</span>
            </p>
          </div>
        </div>

        <!-- Webhook Info & Masked URL -->
        <div class="flex-1 max-w-md bg-dark-950/80 p-3 rounded-xl border border-dark-700/60 space-y-1">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400 font-semibold">URL Webhook Discord</span>
            <button
              @click="copyWebhookUrl(sub.discordWebhookUrl, sub.id)"
              class="text-brand-400 hover:text-brand-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
            >
              <Check v-if="copiedId === sub.id" class="w-3 h-3 text-emerald-400" />
              <Copy v-else class="w-3 h-3" />
              <span>{{ copiedId === sub.id ? 'Copié !' : 'Copier l\'URL' }}</span>
            </button>
          </div>
          <div class="font-mono text-xs text-slate-300 truncate">
            {{ sub.discordWebhookUrl }}
          </div>
        </div>

        <!-- Status & Action Icon Buttons -->
        <div class="flex items-center space-x-4 justify-between md:justify-end">
          <StatusIndicator :status="sub.status === 'ACTIVE'" />

          <div class="flex items-center space-x-2">
            <!-- Fiche IGDB -->
            <div class="relative group/tooltip">
              <button
                @click="openDetailModal(sub)"
                class="w-9 h-9 rounded-xl bg-dark-950/80 hover:bg-brand-600/20 text-slate-300 hover:text-brand-300 border border-dark-700/80 hover:border-brand-500/50 flex items-center justify-center transition-all shadow-sm"
                aria-label="Fiche détaillée & JSON IGDB"
              >
                <FileText class="w-4 h-4" />
              </button>
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-dark-950 text-slate-200 text-[11px] font-medium border border-dark-700 shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                Fiche détaillée IGDB
              </div>
            </div>

            <!-- Preview News -->
            <div class="relative group/tooltip">
              <button
                @click="openPreviewModal(sub)"
                class="w-9 h-9 rounded-xl bg-dark-950/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-dark-700/80 hover:border-sky-500/50 flex items-center justify-center transition-all shadow-sm"
                aria-label="Prévisualiser l'actualité"
              >
                <Eye class="w-4 h-4" />
              </button>
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-dark-950 text-slate-200 text-[11px] font-medium border border-dark-700 shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                Prévisualiser la dernière actualité
              </div>
            </div>

            <!-- Vider le cache & Re-expédier -->
            <div class="relative group/tooltip">
              <button
                @click="clearSubscriptionCache(sub)"
                :disabled="clearingCacheId === sub.id"
                class="w-9 h-9 rounded-xl bg-dark-950/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-dark-700/80 hover:border-amber-500/50 flex items-center justify-center transition-all shadow-sm disabled:opacity-50"
                aria-label="Purger le cache et ré-expédier"
              >
                <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': clearingCacheId === sub.id }" />
              </button>
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-dark-950 text-amber-200 text-[11px] font-medium border border-amber-900/40 shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                Purger le cache & ré-expédier
              </div>
            </div>

            <!-- Tester le Webhook -->
            <div class="relative group/tooltip">
              <button
                @click="testWebhook(sub)"
                class="w-9 h-9 rounded-xl bg-dark-950/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-dark-700/80 hover:border-emerald-500/50 flex items-center justify-center transition-all shadow-sm"
                aria-label="Tester le Webhook Discord"
              >
                <Send class="w-4 h-4" />
              </button>
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-dark-950 text-slate-200 text-[11px] font-medium border border-dark-700 shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                Tester le Webhook Discord
              </div>
            </div>

            <!-- Éditer -->
            <div class="relative group/tooltip">
              <button
                @click="openEditModal(sub)"
                class="w-9 h-9 rounded-xl bg-dark-950/80 hover:bg-slate-700/50 text-slate-300 hover:text-white border border-dark-700/80 hover:border-slate-500/50 flex items-center justify-center transition-all shadow-sm"
                aria-label="Éditer l'abonnement"
              >
                <Edit class="w-4 h-4" />
              </button>
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-dark-950 text-slate-200 text-[11px] font-medium border border-dark-700 shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                Éditer l'abonnement
              </div>
            </div>

            <!-- Supprimer -->
            <div class="relative group/tooltip">
              <button
                @click="deleteSubscription(sub.id)"
                class="w-9 h-9 rounded-xl bg-dark-950/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-dark-700/80 hover:border-rose-500/50 flex items-center justify-center transition-all shadow-sm"
                aria-label="Supprimer l'abonnement"
              >
                <Trash2 class="w-4 h-4" />
              </button>
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-dark-950 text-rose-300 text-[11px] font-medium border border-rose-900/50 shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                Supprimer l'abonnement
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="glass-card p-12 text-center text-slate-400 space-y-4 border border-dark-700/60">
      <Gamepad2 class="w-12 h-12 text-slate-600 mx-auto" />
      <p class="text-base font-semibold text-white">Vous n'avez aucun abonnement actif.</p>
      <p class="text-xs">Explorez le catalogue pour vous abonner aux actualités de vos jeux préférés.</p>
      <NuxtLink
        to="/dashboard/games"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all"
      >
        <Sparkles class="w-4 h-4" />
        <span>Parcourir le catalogue IGDB</span>
      </NuxtLink>
    </div>

    <!-- Webhook Edit Modal -->
    <WebhookModal
      :is-open="isModalOpen"
      :game="selectedGameForEdit"
      @close="isModalOpen = false"
    />

    <!-- News Preview & Regenerate Modal -->
    <PreviewModal
      :is-open="isPreviewModalOpen"
      :game="selectedGameForPreview"
      @close="isPreviewModalOpen = false"
    />

    <!-- IGDB Game Details & Raw JSON Modal -->
    <IGDBDetailModal
      :is-open="isDetailModalOpen"
      :game="selectedGameForDetail"
      @close="isDetailModalOpen = false"
      @refreshed="handleGameRefreshed"
    />
  </div>
</template>
