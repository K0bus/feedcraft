<script setup lang="ts">
import { ref, onMounted } from 'vue'

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
const selectedGameForEdit = ref<any>(null)
const selectedGameForPreview = ref<any>(null)
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
      alert(`✅ Message de test envoyé avec succès sur le salon Discord de ${sub.game?.name || 'votre jeu'} !`)
    } else {
      const err = await res.json()
      alert(`❌ Échec de l'envoi : ${err.error || 'Erreur inconnue'}`)
    }
  } catch (err: any) {
    alert(`❌ Échec de la connexion au serveur : ${err.message}`)
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
    alert(`✅ ${res.message || 'Cache réinitialisé avec succès !'}`)
  } catch (err: any) {
    alert(`❌ Échec de la réinitialisation : ${err.data?.error || err.message || 'Erreur inconnue'}`)
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
      <div class="glass-panel p-6 space-y-2 relative overflow-hidden">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jeux Suivis</div>
        <div class="text-4xl font-bold font-outfit text-white">
          {{ subscriptions.length }}
        </div>
        <div class="text-xs text-slate-400">Abonnements actifs sur ce compte</div>
      </div>

      <div class="glass-panel p-6 space-y-2 relative overflow-hidden">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Webhooks Operationnels</div>
        <div class="text-4xl font-bold font-outfit text-brand-500">
          {{ subscriptions.filter(s => s.status === 'ACTIVE').length }}
        </div>
        <div class="text-xs text-emerald-400">Prêts pour la distribution</div>
      </div>

      <div class="glass-panel p-6 space-y-2 relative overflow-hidden">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moteur d'IA & Worker</div>
        <div class="text-xl font-bold font-outfit text-white">
          FeedCrafter AI Engine
        </div>
        <div class="text-xs text-slate-400">Scan Cron toutes les 15 min</div>
      </div>
    </div>

    <!-- Subscriptions Header & Actions -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold font-outfit text-white">
          Mes Abonnements Jeux & Webhooks
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Gérez le routage de vos actualités vers vos salons Discord.
        </p>
      </div>

      <NuxtLink
        to="/dashboard/games"
        class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 flex items-center space-x-2"
      >
        <span>+ Ajouter un Jeu</span>
      </NuxtLink>
    </div>

    <!-- Subscriptions List Cards -->
    <div v-if="isLoading" class="glass-panel p-12 text-center text-slate-400">
      <p class="text-sm font-semibold animate-pulse">Chargement de vos abonnements...</p>
    </div>

    <div v-else-if="subscriptions.length > 0" class="space-y-4">
      <div
        v-for="sub in subscriptions"
        :key="sub.id"
        class="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-500/30 transition-all"
      >
        <!-- Game details -->
        <div class="flex items-center space-x-4 min-w-[240px]">
          <img
            :src="sub.game?.coverUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'"
            :alt="sub.game?.name || 'Jeu'"
            class="h-16 w-16 rounded-xl object-cover border border-dark-700 bg-dark-950"
          />
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="font-bold text-white text-base">{{ sub.game?.name || 'Jeu Inconnu' }}</h3>
              <PlatformBadge :platform="sub.game?.steamAppId ? 'steam' : sub.game?.epicSlug ? 'epic' : 'bnet'" size="sm" />
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Serveur / Salon : <span class="text-slate-200 font-medium">{{ sub.guildName || '#général' }}</span>
            </p>
          </div>
        </div>

        <!-- Webhook Info & Masked URL -->
        <div class="flex-1 max-w-md bg-dark-950/60 p-3 rounded-xl border border-dark-700/60 space-y-1">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400 font-semibold">URL Webhook Discord</span>
            <button
              @click="copyWebhookUrl(sub.discordWebhookUrl, sub.id)"
              class="text-brand-400 hover:underline text-[10px]"
            >
              {{ copiedId === sub.id ? 'Copié !' : 'Copier l\'URL' }}
            </button>
          </div>
          <div class="font-mono text-xs text-slate-300 truncate">
            {{ sub.discordWebhookUrl }}
          </div>
        </div>

        <!-- Status & Actions -->
        <div class="flex items-center space-x-4 justify-between md:justify-end">
          <StatusIndicator :status="sub.status === 'ACTIVE'" />

          <div class="flex items-center space-x-2">
            <button
              @click="openPreviewModal(sub)"
              class="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 text-xs border border-dark-600 transition-colors"
              title="Prévisualiser et régénérer l'actualité"
            >
              👁 Preview
            </button>

            <button
              @click="clearSubscriptionCache(sub)"
              :disabled="clearingCacheId === sub.id"
              class="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30 transition-colors disabled:opacity-50"
              title="Purger l'historique d'envoi et renvoyer la dernière actualité sur Discord"
            >
              {{ clearingCacheId === sub.id ? '🧹 Purge...' : '🧹 Vider le cache' }}
            </button>

            <button
              @click="testWebhook(sub)"
              class="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs border border-dark-600 transition-colors"
              title="Envoyer un test Webhook"
            >
              🧪 Tester
            </button>

            <button
              @click="openEditModal(sub)"
              class="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs border border-dark-600 transition-colors"
            >
              Éditer
            </button>

            <button
              @click="deleteSubscription(sub.id)"
              class="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs border border-rose-500/30 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="glass-panel p-12 text-center text-slate-400 space-y-4">
      <p class="text-base font-semibold text-white">Vous n'avez aucun abonnement actif.</p>
      <p class="text-xs">Explorez le catalogue pour vous abonner aux actualités de vos jeux préférés.</p>
      <NuxtLink
        to="/dashboard/games"
        class="inline-block px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20"
      >
        Parcourir le catalogue IGDB
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
  </div>
</template>
