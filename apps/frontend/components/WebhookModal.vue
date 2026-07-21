<script setup lang="ts">
import { ref } from 'vue'
import type { GameDTO } from '@feedcrafter/shared'

const props = defineProps<{
  isOpen: boolean
  game?: GameDTO | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { webhookUrl: string; language: string; channelName?: string }): void
}>()

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || ''

const webhookUrl = ref('')
const channelName = ref('')
const language = ref('fr')
const isTesting = ref(false)
const testStatus = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')

const handleTestWebhook = async () => {
  if (!webhookUrl.value) return
  isTesting.value = true
  testStatus.value = 'idle'
  errorMessage.value = ''
  
  try {
    const requestFetch = useRequestFetch()
    await requestFetch(`${apiBaseUrl}/api/subscriptions/test-webhook`, {
      method: 'POST',
      body: {
        webhookUrl: webhookUrl.value,
        gameName: props.game?.name || 'FeedCrafter'
      }
    })
    testStatus.value = 'success'
  } catch (err: any) {
    testStatus.value = 'error'
    errorMessage.value = err.data?.error || err.message || 'Échec de la connexion.'
  } finally {
    isTesting.value = false
  }
}

const handleSave = () => {
  if (!webhookUrl.value) return
  emit('save', {
    webhookUrl: webhookUrl.value,
    language: language.value,
    channelName: channelName.value
  })
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div @click="emit('close')" class="absolute inset-0 bg-dark-950/80 backdrop-blur-md"></div>

    <!-- Modal Box -->
    <div class="relative w-full max-w-lg glass-panel p-6 border border-dark-700 shadow-2xl space-y-6">
      <div class="flex items-center justify-between border-b border-dark-700/60 pb-4">
        <div>
          <h3 class="text-xl font-bold font-outfit text-white">
            Configuration Webhook Discord
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            {{ game ? `Abonnement aux actualités de ${game.name}` : 'Nouveau routeur Webhook' }}
          </p>
        </div>
        <button @click="emit('close')" class="text-slate-400 hover:text-white text-xl">×</button>
      </div>

      <div class="space-y-4">
        <!-- Webhook URL input -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            URL du Webhook Discord *
          </label>
          <input
            v-model="webhookUrl"
            type="text"
            placeholder="https://discord.com/api/webhooks/..."
            class="w-full glass-input"
          />
          <p class="text-[11px] text-slate-500 mt-1">
            Créez un webhook dans Paramètres du salon > Intégrations > Webhooks dans votre serveur Discord.
          </p>
        </div>

        <!-- Optional Channel Name -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Nom du Salon Discord (Optionnel)
          </label>
          <input
            v-model="channelName"
            type="text"
            placeholder="#patch-notes"
            class="w-full glass-input"
          />
        </div>

        <!-- Target Language -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Langue de Traduction IA (Gemini)
          </label>
          <select v-model="language" class="w-full glass-input bg-dark-900">
            <option value="fr">🇫🇷 Français (Défaut)</option>
            <option value="en">🇬🇧 Anglais</option>
            <option value="es">🇪🇸 Espagnol</option>
            <option value="de">🇩🇪 Allemand</option>
          </select>
        </div>

        <!-- Test status alert -->
        <div v-if="testStatus === 'success'" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          ✅ Test réussi ! Un message de confirmation a été envoyé sur votre salon Discord.
        </div>
        <div v-else-if="testStatus === 'error'" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          ❌ {{ errorMessage || "Échec du test. Vérifiez la validité de l'URL de Webhook Discord." }}
        </div>
      </div>

      <!-- Footer Action Buttons -->
      <div class="flex items-center justify-between pt-4 border-t border-dark-700/60">
        <button
          @click="handleTestWebhook"
          :disabled="!webhookUrl || isTesting"
          class="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-medium border border-dark-600 disabled:opacity-50"
        >
          {{ isTesting ? 'Envoi du test...' : '🧪 Tester le Webhook' }}
        </button>

        <div class="flex items-center space-x-3">
          <button
            @click="emit('close')"
            class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Annuler
          </button>
          <button
            @click="handleSave"
            :disabled="!webhookUrl"
            class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 disabled:opacity-50"
          >
            Valider l'Abonnement
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
