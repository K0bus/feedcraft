<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || ''

const isLoading = ref(true)
const rawLogs = ref<any[]>([])

const fetchLogs = async () => {
  isLoading.value = true
  try {
    const requestFetch = useRequestFetch()
    rawLogs.value = await requestFetch<any[]>(`${apiBaseUrl}/api/subscriptions/logs`)
  } catch (err) {
    console.error('Error fetching dispatch logs:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold font-outfit text-white">
          Historique & Journaux de Distribution (BDD)
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Historique des messages envoyés par Webhook et enregistrés en base de données.
        </p>
      </div>

      <button
        @click="fetchLogs"
        class="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-semibold border border-dark-600 flex items-center space-x-2"
      >
        <span>🔄 Rafraîchir</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="glass-panel p-12 text-center text-slate-400">
      <p class="text-sm font-semibold animate-pulse">Chargement de l'historique des envois BDD...</p>
    </div>

    <!-- Timeline List -->
    <div v-else-if="rawLogs.length > 0" class="space-y-4">
      <div
        v-for="log in rawLogs"
        :key="log.id"
        class="glass-panel p-6 space-y-4 hover:border-brand-500/30 transition-all"
      >
        <!-- Log top bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-700/60 pb-3">
          <div class="flex items-center space-x-3">
            <span class="font-bold text-white text-base">{{ log.subscription?.game?.name || 'Jeu Inconnu' }}</span>
            <PlatformBadge :platform="log.subscription?.game?.steamAppId ? 'steam' : log.subscription?.game?.epicSlug ? 'epic' : 'bnet'" size="sm" />
            <span class="text-xs text-slate-400">➡️ {{ log.subscription?.guildName || '#webhook' }}</span>
          </div>

          <div class="flex items-center space-x-3">
            <span class="text-xs font-mono text-slate-500">{{ formatDate(log.sentAt) }}</span>
            <StatusIndicator :status="log.status === 'SUCCESS'" :label="log.status === 'SUCCESS' ? 'Livré' : 'Échec'" />
          </div>
        </div>

        <!-- Translated Content & Summary -->
        <div class="space-y-2">
          <h3 class="text-base font-bold text-brand-400">
            {{ log.translatedTitle || log.newsFeed?.title || 'Titre indisponible' }}
          </h3>
          <p v-if="log.summary" class="text-xs text-slate-300 leading-relaxed bg-dark-950/50 p-3 rounded-xl border border-dark-700/50">
            <span class="font-semibold text-brand-500">Résumé Gemini IA :</span> {{ log.summary }}
          </p>

          <p v-if="log.errorMessage" class="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
            ⚠️ {{ log.errorMessage }}
          </p>
        </div>

        <!-- Log Footer Link -->
        <div class="flex items-center justify-between pt-2 text-xs">
          <span class="text-slate-500 truncate max-w-xs md:max-w-md">Article source : {{ log.newsFeed?.title || 'Lien d\'origine' }}</span>
          <a
            v-if="log.newsFeed?.url"
            :href="log.newsFeed.url"
            target="_blank"
            class="text-brand-500 hover:underline font-semibold flex items-center space-x-1"
          >
            <span>Voir le post d'origine ↗</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="glass-panel p-12 text-center text-slate-400 space-y-3">
      <p class="text-base font-semibold text-white">Aucun historique d'envoi en base de données.</p>
      <p class="text-xs">Les messages envoyés par le worker ou déclenchés via "Vider le cache" apparaîtront ici.</p>
    </div>
  </div>
</template>
