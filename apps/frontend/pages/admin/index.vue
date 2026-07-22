<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type {
  AdminUserDTO,
  AdminWebhookDTO,
  AdminWorkerStatusDTO,
  AdminAiModelConfig,
  AdminPromptConfigDTO
} from '@feedcrafter/shared'
import {
  Users,
  Webhook,
  Cpu,
  Bot,
  RotateCw,
  Search,
  Send,
  Save,
  TestTube,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Zap,
  FileCode,
  ShieldCheck,
  Play,
  Plus,
  Trash2,
  ListPlus,
  Sparkles,
  ChevronsUp,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Clock,
  Flame,
  ShieldAlert
} from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || ''

// Active Tab
const activeTab = ref<'users' | 'webhooks' | 'workers' | 'ai'>('users')

// Feedback / Toast State
const feedbackMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null)
function showToast(text: string, type: 'success' | 'error' = 'success') {
  feedbackMessage.value = { text, type }
  setTimeout(() => {
    feedbackMessage.value = null
  }, 4500)
}

// Helper to handle API requests with Auth Token
async function fetchAdminApi<T>(endpoint: string, options: any = {}): Promise<T> {
  const token = localStorage.getItem('feedcrafter_token')
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  const requestFetch = useRequestFetch()
  return await requestFetch<T>(`${apiBaseUrl}/api/admin${endpoint}`, {
    ...options,
    headers
  })
}

// ----------------------------------------------------
// 👥 Tab 1: Users Data
// ----------------------------------------------------
const users = ref<AdminUserDTO[]>([])
const usersLoading = ref(false)
const userSearchQuery = ref('')

async function loadUsers() {
  usersLoading.value = true
  try {
    const res = await fetchAdminApi<{ users: AdminUserDTO[] }>('/users')
    users.value = res.users
  } catch (err: any) {
    showToast(`Erreur chargement utilisateurs: ${err.data?.error || err.message}`, 'error')
  } finally {
    usersLoading.value = false
  }
}

const filteredUsers = computed(() => {
  if (!userSearchQuery.value.trim()) return users.value
  const q = userSearchQuery.value.toLowerCase()
  return users.value.filter(
    u => u.username.toLowerCase().includes(q) || u.discordId.toLowerCase().includes(q)
  )
})

// ----------------------------------------------------
// 🔗 Tab 2: Webhooks Data
// ----------------------------------------------------
const webhooks = ref<AdminWebhookDTO[]>([])
const webhooksLoading = ref(false)
const testingWebhookId = ref<string | null>(null)

async function loadWebhooks() {
  webhooksLoading.value = true
  try {
    const res = await fetchAdminApi<{ webhooks: AdminWebhookDTO[] }>('/webhooks')
    webhooks.value = res.webhooks
  } catch (err: any) {
    showToast(`Erreur chargement webhooks: ${err.data?.error || err.message}`, 'error')
  } finally {
    webhooksLoading.value = false
  }
}

async function testWebhook(id: string) {
  testingWebhookId.value = id
  try {
    const res = await fetchAdminApi<{ success: boolean; message: string }>(`/webhooks/${id}/test`, {
      method: 'POST'
    })
    showToast(res.message, 'success')
  } catch (err: any) {
    showToast(`Échec du test webhook: ${err.data?.error || err.message}`, 'error')
  } finally {
    testingWebhookId.value = null
  }
}

async function toggleWebhookStatus(id: string) {
  try {
    const res = await fetchAdminApi<{ success: boolean; status: string }>(`/webhooks/${id}/toggle`, {
      method: 'PATCH'
    })
    const sub = webhooks.value.find(w => w.id === id)
    if (sub) sub.status = res.status
    showToast(`Statut du webhook mis à jour: ${res.status}`, 'success')
  } catch (err: any) {
    showToast(`Erreur modification statut: ${err.data?.error || err.message}`, 'error')
  }
}

// ----------------------------------------------------
// ⚙️ Tab 3: Workers & Queues Data
// ----------------------------------------------------
const workerStatus = ref<AdminWorkerStatusDTO | null>(null)
const workersLoading = ref(false)
const triggeringPipeline = ref(false)

async function loadWorkerStatus() {
  workersLoading.value = true
  try {
    workerStatus.value = await fetchAdminApi<AdminWorkerStatusDTO>('/workers')
  } catch (err: any) {
    showToast(`Erreur statut workers: ${err.data?.error || err.message}`, 'error')
  } finally {
    workersLoading.value = false
  }
}

async function triggerManualPipeline() {
  triggeringPipeline.value = true
  try {
    const res = await fetchAdminApi<{ success: boolean; message: string }>('/workers/trigger', {
      method: 'POST'
    })
    showToast(res.message, 'success')
    await loadWorkerStatus()
  } catch (err: any) {
    showToast(`Échec du déclenchement: ${err.data?.error || err.message}`, 'error')
  } finally {
    triggeringPipeline.value = false
  }
}

// ----------------------------------------------------
// 🤖 Tab 4: Prompt & Dynamic AI Models Data
// ----------------------------------------------------
const aiModels = ref<AdminAiModelConfig[]>([])
const aiModelsLoading = ref(false)
const savingModels = ref(false)

// Available Models Catalog Modal State
const isModelModalOpen = ref(false)
const availableModels = ref<any[]>([])
const availableModelsLoading = ref(false)
const modelSearchQuery = ref('')
const customModelInput = ref('')

async function loadAiModels() {
  aiModelsLoading.value = true
  try {
    const res = await fetchAdminApi<{ models: AdminAiModelConfig[] }>('/ai/models')
    aiModels.value = res.models
  } catch (err: any) {
    showToast(`Erreur chargement modèles IA: ${err.data?.error || err.message}`, 'error')
  } finally {
    aiModelsLoading.value = false
  }
}

async function openAddModelModal() {
  isModelModalOpen.value = true
  availableModelsLoading.value = true
  try {
    const res = await fetchAdminApi<{ availableModels: any[] }>('/ai/models/available')
    availableModels.value = res.availableModels
  } catch (err: any) {
    showToast(`Erreur chargement catalogue modèles: ${err.data?.error || err.message}`, 'error')
  } finally {
    availableModelsLoading.value = false
  }
}

const filteredAvailableModels = computed(() => {
  if (!modelSearchQuery.value.trim()) return availableModels.value
  const q = modelSearchQuery.value.toLowerCase()
  return availableModels.value.filter(
    m => (m.name || '').toLowerCase().includes(q) || (m.displayName || '').toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
  )
})

function isModelAlreadyInList(name: string): boolean {
  return aiModels.value.some(m => m.name.toLowerCase() === name.toLowerCase())
}

function addModelToChain(name: string, displayName?: string) {
  if (isModelAlreadyInList(name)) {
    showToast(`Le modèle "${name}" est déjà présent dans la liste.`, 'error')
    return
  }
  const cleanName = name.trim()
  const cleanDisplay = displayName || cleanName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  aiModels.value.push({
    name: cleanName,
    displayName: cleanDisplay,
    enabled: true,
    order: aiModels.value.length + 1
  })
  showToast(`Modèle "${cleanName}" ajouté à la chaîne de secours !`, 'success')
}

function addCustomModel() {
  if (!customModelInput.value.trim()) return
  addModelToChain(customModelInput.value.trim())
  customModelInput.value = ''
}

function removeModelFromChain(index: number) {
  const removed = aiModels.value.splice(index, 1)
  aiModels.value.forEach((m, idx) => {
    m.order = idx + 1
  })
  if (removed[0]) {
    showToast(`Modèle "${removed[0].name}" retiré de la liste.`, 'success')
  }
}

function moveModelOrder(index: number, direction: 'up' | 'down') {
  if (direction === 'up' && index > 0) {
    const temp = aiModels.value[index]
    aiModels.value[index] = aiModels.value[index - 1]
    aiModels.value[index - 1] = temp
  } else if (direction === 'down' && index < aiModels.value.length - 1) {
    const temp = aiModels.value[index]
    aiModels.value[index] = aiModels.value[index + 1]
    aiModels.value[index + 1] = temp
  }
  // Re-assign order numbers
  aiModels.value.forEach((m, idx) => {
    m.order = idx + 1
  })
}

function moveModelToTop(index: number) {
  if (index <= 0 || index >= aiModels.value.length) return
  const [model] = aiModels.value.splice(index, 1)
  if (model) {
    aiModels.value.unshift(model)
    aiModels.value.forEach((m, idx) => {
      m.order = idx + 1
    })
    showToast(`Modèle "${model.displayName || model.name}" placé en 1ère position !`, 'success')
  }
}

const activeModelFilterQuery = ref('')
const showAllActiveModels = ref(false)

const filteredActiveModels = computed(() => {
  if (!activeModelFilterQuery.value.trim()) return aiModels.value
  const q = activeModelFilterQuery.value.toLowerCase()
  return aiModels.value.filter(
    m => m.name.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)
  )
})

const displayedAiModels = computed(() => {
  if (showAllActiveModels.value || activeModelFilterQuery.value.trim()) {
    return filteredActiveModels.value
  }
  return filteredActiveModels.value.slice(0, 7)
})

async function saveAiModels() {
  savingModels.value = true
  try {
    await fetchAdminApi('/ai/models', {
      method: 'PUT',
      body: { models: aiModels.value }
    })
    showToast('Priorité et activation des modèles enregistrées avec succès !', 'success')
  } catch (err: any) {
    showToast(`Erreur enregistrement modèles: ${err.data?.error || err.message}`, 'error')
  } finally {
    savingModels.value = false
  }
}

const systemPrompt = ref('')
const defaultPrompt = ref('')
const promptLoading = ref(false)
const savingPrompt = ref(false)

const selectedTestModel = ref('')
const enabledModels = computed(() => aiModels.value.filter(m => m.enabled))

const sampleTitle = ref('Update 1.0.4 - Major Performance & Bug Fixes')
const sampleContent = ref(
  'We are thrilled to release update 1.0.4 today! Fixed crash issues on startup, improved framerate on modern GPUs, and added 3 new festive weapons.'
)
const testingPrompt = ref(false)
const promptTestResult = ref<{ usedModel?: string; rawOutput: string; parsedOutput: any } | null>(null)

async function loadPrompt() {
  promptLoading.value = true
  try {
    const res = await fetchAdminApi<AdminPromptConfigDTO>('/ai/prompt')
    systemPrompt.value = res.systemPrompt
    defaultPrompt.value = res.defaultPrompt
  } catch (err: any) {
    showToast(`Erreur chargement prompt: ${err.data?.error || err.message}`, 'error')
  } finally {
    promptLoading.value = false
  }
}

async function savePrompt() {
  savingPrompt.value = true
  try {
    await fetchAdminApi('/ai/prompt', {
      method: 'PUT',
      body: { systemPrompt: systemPrompt.value }
    })
    showToast('Prompt système Gemini mis à jour !', 'success')
  } catch (err: any) {
    showToast(`Erreur enregistrement prompt: ${err.data?.error || err.message}`, 'error')
  } finally {
    savingPrompt.value = false
  }
}

function resetPromptToDefault() {
  systemPrompt.value = defaultPrompt.value
  showToast('Prompt réinitialisé à la valeur par défaut (non enregistré).', 'success')
}

async function runPromptTest() {
  testingPrompt.value = true
  promptTestResult.value = null
  try {
    const modelToTest = selectedTestModel.value || enabledModels.value[0]?.name
    const res = await fetchAdminApi<{ usedModel?: string; rawOutput: string; parsedOutput: any }>('/ai/prompt/test', {
      method: 'POST',
      body: {
        systemPrompt: systemPrompt.value,
        sampleTitle: sampleTitle.value,
        sampleContent: sampleContent.value,
        model: modelToTest
      }
    })
    promptTestResult.value = res
    showToast(`Test exécuté avec succès via ${res.usedModel || modelToTest || 'Gemini'} !`, 'success')
  } catch (err: any) {
    showToast(`Échec du test de prompt: ${err.data?.error || err.message}`, 'error')
  } finally {
    testingPrompt.value = false
  }
}

// Realtime AI Usage Stats
const aiUsageStats = ref<any>(null)
const aiUsageLoading = ref(false)

async function loadAiUsage() {
  aiUsageLoading.value = true
  try {
    const res = await fetchAdminApi<{ stats: any }>('/ai/usage')
    aiUsageStats.value = res.stats
  } catch (err: any) {
    console.warn('[Admin UI] Erreur lors du chargement des statistiques d\'utilisation IA:', err)
  } finally {
    aiUsageLoading.value = false
  }
}

// Initial Data Load
onMounted(() => {
  loadUsers()
  loadWebhooks()
  loadWorkerStatus()
  loadAiModels()
  loadPrompt()
  loadAiUsage()
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Toast Notification -->
    <div
      v-if="feedbackMessage"
      class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center space-x-3 transition-all animate-bounce"
      :class="[
        feedbackMessage.type === 'success'
          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10'
          : 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-500/10'
      ]"
    >
      <Check v-if="feedbackMessage.type === 'success'" class="w-4 h-4 text-emerald-400" />
      <X v-else class="w-4 h-4 text-rose-400" />
      <span>{{ feedbackMessage.text }}</span>
    </div>

    <!-- Header Title Banner -->
    <div class="glass-card p-6 border border-amber-500/30 bg-gradient-to-r from-dark-900 via-dark-800 to-amber-950/20">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
              <ShieldCheck class="w-3 h-3 text-amber-400" />
              <span>Super Admin Console</span>
            </span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold font-outfit text-white tracking-tight">
            Panneau d'Administration FeedCrafter
          </h1>
          <p class="text-xs text-slate-400">
            Supervision globale des utilisateurs, des webhooks, de l'état des workers BullMQ et de l'IA Gemini.
          </p>
        </div>

        <button
          @click="loadUsers(); loadWebhooks(); loadWorkerStatus(); loadAiModels(); loadPrompt();"
          class="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-bold border border-dark-700 transition-all flex items-center space-x-2 self-start md:self-auto"
        >
          <RotateCw class="w-3.5 h-3.5" />
          <span>Rafraîchir Tout</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center space-x-2 border-b border-dark-700/60 pb-2 overflow-x-auto">
      <button
        @click="activeTab = 'users'"
        class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap"
        :class="[
          activeTab === 'users'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
            : 'text-slate-400 hover:text-white hover:bg-dark-800/60 border border-transparent'
        ]"
      >
        <Users class="w-4 h-4 text-amber-400" />
        <span>Utilisateurs ({{ users.length }})</span>
      </button>

      <button
        @click="activeTab = 'webhooks'"
        class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap"
        :class="[
          activeTab === 'webhooks'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
            : 'text-slate-400 hover:text-white hover:bg-dark-800/60 border border-transparent'
        ]"
      >
        <Webhook class="w-4 h-4 text-amber-400" />
        <span>Webhooks ({{ webhooks.length }})</span>
      </button>

      <button
        @click="activeTab = 'workers'"
        class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap"
        :class="[
          activeTab === 'workers'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
            : 'text-slate-400 hover:text-white hover:bg-dark-800/60 border border-transparent'
        ]"
      >
        <Cpu class="w-4 h-4 text-amber-400" />
        <span>State Workers BullMQ</span>
        <span
          class="h-2 w-2 rounded-full"
          :class="workerStatus?.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'"
        ></span>
      </button>

      <button
        @click="activeTab = 'ai'"
        class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap"
        :class="[
          activeTab === 'ai'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
            : 'text-slate-400 hover:text-white hover:bg-dark-800/60 border border-transparent'
        ]"
      >
        <Bot class="w-4 h-4 text-amber-400" />
        <span>Prompt & Modèles IA</span>
      </button>
    </div>

    <!-- ========================================== -->
    <!-- TAB 1: USERS -->
    <!-- ========================================== -->
    <div v-if="activeTab === 'users'" class="space-y-4">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="w-full sm:w-80 relative flex items-center">
          <input
            v-model="userSearchQuery"
            type="text"
            placeholder="Rechercher utilisateur ou ID Discord..."
            class="glass-input glass-search-input text-xs w-full"
            style="padding-left: 2.75rem !important;"
          />
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
        </div>
        <div class="text-xs text-slate-400 font-medium">
          Affichage de {{ filteredUsers.length }} sur {{ users.length }} utilisateurs
        </div>
      </div>

      <div class="glass-card overflow-hidden border border-dark-700/60">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-dark-900/80 text-slate-400 font-bold border-b border-dark-700/60 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="px-4 py-3">Utilisateur</th>
                <th class="px-4 py-3">ID Discord</th>
                <th class="px-4 py-3">Inscrit le</th>
                <th class="px-4 py-3 text-center">Abonnements</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-dark-700/40">
              <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-dark-800/40 transition-colors">
                <td class="px-4 py-3 flex items-center space-x-3">
                  <img
                    :src="u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
                    :alt="u.username"
                    class="h-8 w-8 rounded-full object-cover border border-slate-600 bg-dark-900"
                  />
                  <div>
                    <div class="font-bold text-white flex items-center space-x-1.5">
                      <span>{{ u.username }}</span>
                    </div>
                    <div class="text-[11px] text-slate-400">{{ u.email || 'Pas d\'email' }}</div>
                  </div>
                </td>
                <td class="px-4 py-3 font-mono text-[11px] text-slate-400">{{ u.discordId }}</td>
                <td class="px-4 py-3 text-slate-400">{{ new Date(u.createdAt).toLocaleDateString('fr-FR') }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2.5 py-1 rounded-full bg-brand-600/20 text-brand-400 font-bold border border-brand-500/30">
                    {{ u.subscriptionsCount }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="4" class="px-4 py-8 text-center text-slate-400">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 2: WEBHOOKS -->
    <!-- ========================================== -->
    <div v-if="activeTab === 'webhooks'" class="space-y-4">
      <div class="glass-card overflow-hidden border border-dark-700/60">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-dark-900/80 text-slate-400 font-bold border-b border-dark-700/60 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="px-4 py-3">Jeu</th>
                <th class="px-4 py-3">Utilisateur</th>
                <th class="px-4 py-3">URL Webhook Discord</th>
                <th class="px-4 py-3">Statut</th>
                <th class="px-4 py-3">Dernier Envoi</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-dark-700/40">
              <tr v-for="w in webhooks" :key="w.id" class="hover:bg-dark-800/40 transition-colors">
                <td class="px-4 py-3 flex items-center space-x-3">
                  <img
                    :src="w.gameCoverUrl || 'https://via.placeholder.com/40'"
                    :alt="w.gameName"
                    class="h-9 w-7 rounded object-cover border border-slate-700"
                  />
                  <span class="font-bold text-white">{{ w.gameName }}</span>
                </td>
                <td class="px-4 py-3 font-semibold text-slate-300">{{ w.userName }}</td>
                <td class="px-4 py-3 font-mono text-[10px] text-slate-400 max-w-[200px] truncate" :title="w.discordWebhookUrl">
                  {{ w.discordWebhookUrl }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    :class="[
                      w.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    ]"
                  >
                    {{ w.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-400">
                  <div v-if="w.lastDispatchAt">
                    <span
                      class="font-semibold"
                      :class="w.lastDispatchStatus === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'"
                    >
                      {{ w.lastDispatchStatus }}
                    </span>
                    <span class="text-[10px] text-slate-500 block">
                      {{ new Date(w.lastDispatchAt).toLocaleString('fr-FR') }}
                    </span>
                  </div>
                  <span v-else class="text-slate-500 italic">Aucun envoi</span>
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button
                    @click="testWebhook(w.id)"
                    :disabled="testingWebhookId === w.id"
                    class="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold transition-all inline-flex items-center gap-1"
                  >
                    <Send class="w-3 h-3" />
                    <span>{{ testingWebhookId === w.id ? 'Test...' : 'Tester' }}</span>
                  </button>

                  <button
                    @click="toggleWebhookStatus(w.id)"
                    class="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 border border-dark-700 font-bold transition-all"
                  >
                    {{ w.status === 'ACTIVE' ? 'Désactiver' : 'Activer' }}
                  </button>
                </td>
              </tr>
              <tr v-if="webhooks.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-slate-400">
                  Aucun webhook enregistré.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 3: WORKERS & BULLMQ QUEUES -->
    <!-- ========================================== -->
    <div v-if="activeTab === 'workers'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Queue 1: News Fetch Queue -->
        <div class="glass-card p-6 space-y-4 border border-dark-700/60">
          <div class="flex items-center justify-between border-b border-dark-700/60 pb-3">
            <h3 class="text-base font-bold text-white flex items-center space-x-2">
              <Cpu class="w-4 h-4 text-brand-400" />
              <span>File d'Attente Actualités</span>
            </h3>
            <span class="text-xs font-mono text-slate-400">news-fetch-queue</span>
          </div>

          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
              <div class="text-xs text-slate-400">En attente</div>
              <div class="text-xl font-bold text-amber-400">
                {{ workerStatus?.newsFetchQueue.waiting ?? 0 }}
              </div>
            </div>

            <div class="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
              <div class="text-xs text-slate-400">En cours (Actif)</div>
              <div class="text-xl font-bold text-brand-400">
                {{ workerStatus?.newsFetchQueue.active ?? 0 }}
              </div>
            </div>

            <div class="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
              <div class="text-xs text-slate-400">Terminés</div>
              <div class="text-xl font-bold text-emerald-400">
                {{ workerStatus?.newsFetchQueue.completed ?? 0 }}
              </div>
            </div>

            <div class="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
              <div class="text-xs text-slate-400">Échoués</div>
              <div class="text-xl font-bold text-rose-400">
                {{ workerStatus?.newsFetchQueue.failed ?? 0 }}
              </div>
            </div>
          </div>
        </div>

        <!-- Queue 2: Discord Dispatch Queue -->
        <div class="glass-card p-6 space-y-4 border border-dark-700/60">
          <div class="flex items-center justify-between border-b border-dark-700/60 pb-3">
            <h3 class="text-base font-bold text-white flex items-center space-x-2">
              <Zap class="w-4 h-4 text-amber-400" />
              <span>File d'Attente Discord Dispatch</span>
            </h3>
            <span class="text-xs font-mono text-slate-400">discord-dispatch-queue</span>
          </div>

          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
              <div class="text-xs text-slate-400">En attente</div>
              <div class="text-xl font-bold text-amber-400">
                {{ workerStatus?.discordDispatchQueue.waiting ?? 0 }}
              </div>
            </div>

            <div class="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
              <div class="text-xs text-slate-400">En cours (Actif)</div>
              <div class="text-xl font-bold text-brand-400">
                {{ workerStatus?.discordDispatchQueue.active ?? 0 }}
              </div>
            </div>

            <div class="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
              <div class="text-xs text-slate-400">Terminés</div>
              <div class="text-xl font-bold text-emerald-400">
                {{ workerStatus?.discordDispatchQueue.completed ?? 0 }}
              </div>
            </div>

            <div class="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
              <div class="text-xs text-slate-400">Échoués</div>
              <div class="text-xl font-bold text-rose-400">
                {{ workerStatus?.discordDispatchQueue.failed ?? 0 }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trigger Manual Pipeline Card -->
      <div class="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-amber-500/20">
        <div>
          <h4 class="text-base font-bold text-white flex items-center gap-2">
            <Zap class="w-4 h-4 text-amber-400" />
            <span>Déclenchement Manuel de la Synchronisation</span>
          </h4>
          <p class="text-xs text-slate-400 mt-1">
            Force l'exécution immédiate du scan d'actualités et de la livraison des webhooks Discord sans attendre le cron de 15 minutes.
          </p>
        </div>

        <button
          @click="triggerManualPipeline"
          :disabled="triggeringPipeline"
          class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 whitespace-nowrap"
        >
          <Play class="w-4 h-4 fill-dark-950" />
          <span>{{ triggeringPipeline ? 'Lancement...' : 'Lancer le Pipeline Maintenant' }}</span>
        </button>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 4: PROMPT & DYNAMIC AI MODELS -->
    <!-- ========================================== -->
    <div v-if="activeTab === 'ai'" class="space-y-8">
      <!-- Section 0: Realtime Google AI Studio Dashboard -->
      <div class="glass-card p-6 space-y-6 border border-amber-500/30 bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-700/60 pb-4">
          <div>
            <div class="flex items-center space-x-2">
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                <Activity class="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Google AI Studio API - Temps Réel</span>
              </span>
            </div>
            <h3 class="text-xl font-extrabold font-outfit text-white mt-1 flex items-center gap-2">
              <BarChart3 class="w-5 h-5 text-amber-400" />
              <span>Consommation Réelle & Métriques API</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Statistiques d'utilisation réelles enregistrées aujourd'hui ({{ aiUsageStats?.date || new Date().toISOString().split('T')[0] }}).
            </p>
          </div>

          <button
            @click="loadAiUsage"
            :disabled="aiUsageLoading"
            class="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-bold border border-dark-700 transition-all flex items-center gap-1.5"
          >
            <RotateCw class="w-3.5 h-3.5 text-amber-400" :class="{ 'animate-spin': aiUsageLoading }" />
            <span>Actualiser les métriques</span>
          </button>
        </div>

        <!-- 4 Metrics Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-dark-900/90 p-4 rounded-xl border border-dark-700/60 space-y-1">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Requêtes Aujourd'hui</span>
              <Activity class="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div class="text-2xl font-extrabold text-white">
              {{ aiUsageStats?.totalRequestsToday ?? 0 }}
            </div>
            <div class="text-[10px] text-slate-500 font-mono">
              Limite gratuite : 10 000 RPD
            </div>
          </div>

          <div class="bg-dark-900/90 p-4 rounded-xl border border-dark-700/60 space-y-1">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tokens Consommés</span>
              <Flame class="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div class="text-2xl font-extrabold text-amber-400 font-mono">
              {{ (aiUsageStats?.totalTokensToday ?? 0).toLocaleString('fr-FR') }}
            </div>
            <div class="text-[10px] text-slate-500">
              Cumul des tokens d'entrée/sortie
            </div>
          </div>

          <div class="bg-dark-900/90 p-4 rounded-xl border border-dark-700/60 space-y-1">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Latence Moyenne</span>
              <Clock class="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div class="text-2xl font-extrabold text-emerald-400 font-mono">
              {{ aiUsageStats?.avgLatencyMs ?? 0 }} ms
            </div>
            <div class="text-[10px] text-slate-500">
              Temps de réponse serveur
            </div>
          </div>

          <div class="bg-dark-900/90 p-4 rounded-xl border border-dark-700/60 space-y-1">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Alertes Quota (429)</span>
              <ShieldAlert class="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div class="text-2xl font-extrabold" :class="(aiUsageStats?.totalRateLimitHits ?? 0) > 0 ? 'text-rose-400' : 'text-slate-400'">
              {{ aiUsageStats?.totalRateLimitHits ?? 0 }}
            </div>
            <div class="text-[10px] text-slate-500">
              Dépassements de taux détectés
            </div>
          </div>
        </div>

        <!-- Breakdown per model table -->
        <div v-if="aiUsageStats?.models && Object.keys(aiUsageStats.models).length > 0" class="space-y-2">
          <div class="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Répartition de l'utilisation par Modèle aujourd'hui :
          </div>
          <div class="overflow-x-auto rounded-xl border border-dark-700/60">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-dark-900 text-slate-400 font-bold border-b border-dark-700 uppercase text-[10px] tracking-wider">
                <tr>
                  <th class="px-4 py-2.5">Modèle</th>
                  <th class="px-4 py-2.5 text-center">Appels</th>
                  <th class="px-4 py-2.5 text-center">Tokens</th>
                  <th class="px-4 py-2.5 text-center">Latence Moy.</th>
                  <th class="px-4 py-2.5 text-right">Dernière Utilisation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-700/40">
                <tr v-for="(mStats, mKey) in aiUsageStats.models" :key="mKey" class="hover:bg-dark-800/40 font-mono text-[11px]">
                  <td class="px-4 py-2.5 font-bold text-white flex items-center gap-1.5">
                    <span>{{ mKey }}</span>
                    <span v-if="mKey.includes('3.')" class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">3.X</span>
                  </td>
                  <td class="px-4 py-2.5 text-center font-bold text-brand-400">{{ mStats.requestsToday }}</td>
                  <td class="px-4 py-2.5 text-center text-amber-300">{{ mStats.tokensToday.toLocaleString('fr-FR') }}</td>
                  <td class="px-4 py-2.5 text-center text-emerald-400">{{ mStats.avgLatencyMs }} ms</td>
                  <td class="px-4 py-2.5 text-right text-slate-400 font-sans text-[11px]">
                    {{ mStats.lastUsedAt ? new Date(mStats.lastUsedAt).toLocaleTimeString('fr-FR') : 'N/A' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Section 1: Dynamic Gemini Models -->
      <div class="glass-card p-6 space-y-4 border border-dark-700/60">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-700/60 pb-4">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center space-x-2">
              <Bot class="w-5 h-5 text-amber-400" />
              <span>Modèles d'IA Gemini Dynamiques</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Modèles actifs pour la traduction des actualités. Activez, ordonnez ou ajoutez de nouveaux modèles Gemini (ex: 3.5, 3.1, Gemma).
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="openAddModelModal"
              class="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ListPlus class="w-4 h-4 text-amber-400" />
              <span>+ Catalogue complet / Ajouter</span>
            </button>

            <button
              @click="saveAiModels"
              :disabled="savingModels"
              class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save class="w-3.5 h-3.5" />
              <span>{{ savingModels ? 'Enregistrement...' : 'Enregistrer la Liste' }}</span>
            </button>
          </div>
        </div>

        <!-- Search & Info bar -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-900/90 p-3 rounded-xl border border-dark-700/60">
          <div class="w-full sm:w-72 relative flex items-center">
            <input
              v-model="activeModelFilterQuery"
              type="text"
              placeholder="Filtrer vos modèles (ex: 3.5, flash)..."
              class="glass-input glass-search-input text-xs w-full"
              style="padding-left: 2.75rem !important;"
            />
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          </div>

          <div class="text-xs text-slate-400 font-medium">
            <span class="text-amber-400 font-bold">{{ enabledModels.length }}</span> sur {{ aiModels.length }} modèles activés
          </div>
        </div>

        <div class="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          <div
            v-for="m in displayedAiModels"
            :key="m.name"
            class="flex items-center justify-between p-3 rounded-xl bg-dark-900/80 border border-dark-700/60 hover:border-slate-600 transition-all"
          >
            <div class="flex items-center space-x-3">
              <span class="text-xs font-bold text-slate-400 w-6">#{{ m.order }}</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="m.enabled" class="sr-only peer" />
                <div class="w-9 h-5 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>

              <div>
                <div class="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>{{ m.displayName }}</span>
                  <span v-if="m.name.includes('3.')" class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    Modèle 3.X
                  </span>
                  <span v-if="m.rpm" class="px-2 py-0.5 rounded-md bg-dark-950 text-emerald-400 font-mono text-[10px] border border-dark-700/80" title="Requêtes par minute (RPM)">
                    ⚡ {{ m.rpm }}
                  </span>
                  <span v-if="m.rpd" class="px-2 py-0.5 rounded-md bg-dark-950 text-amber-400 font-mono text-[10px] border border-dark-700/80" title="Requêtes par jour (RPD)">
                    📅 {{ m.rpd }}
                  </span>
                  <span v-if="m.inputTokenFormatted" class="px-2 py-0.5 rounded-md bg-dark-950 text-slate-300 font-mono text-[10px] border border-dark-700/80" title="Fenêtre de contexte maximale d'entrée">
                    📥 {{ m.inputTokenFormatted }}
                  </span>
                </div>
                <div class="text-[10px] font-mono text-slate-400">{{ m.name }}</div>
              </div>
            </div>

            <div class="flex items-center space-x-1.5">
              <!-- Move to 1st Position Button -->
              <button
                @click="moveModelToTop(aiModels.findIndex(item => item.name === m.name))"
                :disabled="aiModels.findIndex(item => item.name === m.name) === 0"
                class="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition-all"
                title="Placer en 1ère position (Priorité absolue)"
              >
                <ChevronsUp class="w-3.5 h-3.5 text-amber-400" />
                <span class="hidden sm:inline">1er</span>
              </button>

              <button
                @click="moveModelOrder(aiModels.findIndex(item => item.name === m.name), 'up')"
                :disabled="aiModels.findIndex(item => item.name === m.name) === 0"
                class="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 disabled:opacity-30 text-xs"
                title="Monter en priorité"
              >
                <ArrowUp class="w-3.5 h-3.5" />
              </button>
              <button
                @click="moveModelOrder(aiModels.findIndex(item => item.name === m.name), 'down')"
                :disabled="aiModels.findIndex(item => item.name === m.name) === aiModels.length - 1"
                class="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 disabled:opacity-30 text-xs"
                title="Descendre en priorité"
              >
                <ArrowDown class="w-3.5 h-3.5" />
              </button>

              <button
                @click="removeModelFromChain(aiModels.findIndex(item => item.name === m.name))"
                class="p-1.5 rounded-lg bg-dark-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-dark-700 hover:border-rose-500/40 text-xs transition-colors"
                title="Retirer le modèle de la liste"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Show More / Show Less Toggle Button -->
        <div v-if="aiModels.length > 7 && !activeModelFilterQuery.trim()" class="pt-2 text-center">
          <button
            @click="showAllActiveModels = !showAllActiveModels"
            class="px-4 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-amber-300 border border-dark-700 hover:border-amber-500/40 text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <ChevronUp v-if="showAllActiveModels" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
            <span>{{ showAllActiveModels ? 'Réduire l\'affichage (7 premiers)' : `Voir la totalité des ${aiModels.length} modèles` }}</span>
          </button>
        </div>
      </div>

      <!-- Section 2: Prompt System Administration -->
      <div class="glass-card p-6 space-y-4 border border-dark-700/60">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-700/60 pb-4">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center space-x-2">
              <FileCode class="w-5 h-5 text-amber-400" />
              <span>Configuration du Prompt Système</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Personnalisez le prompt système utilisé par l'IA Gemini pour traduire et formater les actualités Discord.
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="resetPromptToDefault"
              class="px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-semibold border border-dark-700 transition-all"
            >
              Par Défaut
            </button>
            <button
              @click="savePrompt"
              :disabled="savingPrompt"
              class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save class="w-3.5 h-3.5" />
              <span>{{ savingPrompt ? 'Enregistrement...' : 'Enregistrer le Prompt' }}</span>
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-300">Prompt Système :</label>
          <textarea
            v-model="systemPrompt"
            rows="6"
            class="w-full glass-input text-xs font-mono p-3 leading-relaxed"
            placeholder="Entrez le prompt système..."
          ></textarea>
        </div>
      </div>

      <!-- Section 3: Live Prompt Tester -->
      <div class="glass-card p-6 space-y-4 border border-brand-500/30">
        <div class="border-b border-dark-700/60 pb-4">
          <h3 class="text-lg font-bold text-white flex items-center space-x-2">
            <TestTube class="w-5 h-5 text-brand-400" />
            <span>Outil de Test du Prompt en Direct</span>
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Testez la génération de traduction Gemini en temps réel avec votre prompt actuel avant de l'appliquer en production.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Modèle pour le Test :</label>
              <select v-model="selectedTestModel" class="w-full glass-input text-xs bg-dark-900 font-mono">
                <option value="">(Automatique : Premier modèle actif de la liste)</option>
                <option v-for="m in enabledModels" :key="m.name" :value="m.name">
                  {{ m.displayName }} ({{ m.name }})
                </option>
              </select>
            </div>

            <label class="block text-xs font-bold text-slate-300 mt-2">Titre de test (Anglais) :</label>
            <input v-model="sampleTitle" type="text" class="glass-input text-xs w-full" />

            <label class="block text-xs font-bold text-slate-300 mt-2">Contenu de test (Anglais) :</label>
            <textarea v-model="sampleContent" rows="4" class="glass-input text-xs w-full p-3 font-mono"></textarea>

            <button
              @click="runPromptTest"
              :disabled="testingPrompt"
              class="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all mt-2 flex items-center justify-center gap-2"
            >
              <TestTube class="w-4 h-4" />
              <span>{{ testingPrompt ? 'Exécution du test Gemini...' : 'Lancer le Test en Direct' }}</span>
            </button>
          </div>

          <!-- Test Output Preview -->
          <div class="bg-dark-900/90 rounded-2xl p-4 border border-dark-700/60 flex flex-col justify-between">
            <div>
              <div class="text-xs font-bold text-slate-300 border-b border-dark-700/60 pb-2 mb-3 flex items-center justify-between">
                <span>Résultat de la Traduction :</span>
                <span v-if="promptTestResult?.usedModel" class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ⚡ Modèle : {{ promptTestResult.usedModel }}
                </span>
              </div>

              <div v-if="promptTestResult?.parsedOutput" class="space-y-3">
                <div class="bg-dark-950 p-3 rounded-xl border border-brand-500/30">
                  <div class="text-[10px] uppercase tracking-wider text-brand-400 font-bold mb-1">Titre Traduit :</div>
                  <div class="text-xs font-bold text-white">{{ promptTestResult.parsedOutput.translatedTitle }}</div>
                </div>

                <div class="bg-dark-950 p-3 rounded-xl border border-dark-700">
                  <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Contenu Formaté Discord :</div>
                  <div class="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {{ promptTestResult.parsedOutput.translatedContent }}
                  </div>
                </div>
              </div>

              <div v-else-if="promptTestResult?.rawOutput" class="text-xs font-mono text-slate-300 bg-dark-950 p-3 rounded-xl border border-dark-700 whitespace-pre-wrap">
                {{ promptTestResult.rawOutput }}
              </div>

              <div v-else class="text-xs text-slate-500 italic py-12 text-center">
                Cliquez sur "Lancer le Test en Direct" pour prévisualiser la réponse IA.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- CATALOGUE DES MODÈLES GEMINI DISPONIBLES (MODAL) -->
    <!-- ========================================== -->
    <div v-if="isModelModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="isModelModalOpen = false" class="absolute inset-0 bg-dark-950/85 backdrop-blur-md"></div>

      <div class="relative w-full max-w-3xl glass-card p-6 border border-dark-700 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-dark-700/60 pb-4 flex-shrink-0">
          <div class="flex items-center space-x-3">
            <div class="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
              <Bot class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-xl font-extrabold font-outfit text-white">
                Catalogue Complet des Modèles Google Gemini API
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Sélectionnez un modèle répertorié par l'API ou ajoutez un nom de modèle personnalisé.
              </p>
            </div>
          </div>
          <button @click="isModelModalOpen = false" class="p-1.5 rounded-lg bg-dark-900 text-slate-400 hover:text-white transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Custom Add Input Box -->
        <div class="bg-dark-900/90 p-4 rounded-xl border border-amber-500/30 space-y-2 flex-shrink-0">
          <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider">
            + Ajouter un nom de modèle spécifique (ex: gemini-3.5-flash) :
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="customModelInput"
              type="text"
              placeholder="Saisissez le nom exact du modèle..."
              class="glass-input text-xs flex-1 font-mono"
              @keyup.enter="addCustomModel"
            />
            <button
              @click="addCustomModel"
              :disabled="!customModelInput.trim()"
              class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-bold text-xs shadow disabled:opacity-50 transition-all flex items-center gap-1"
            >
              <Plus class="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="flex-shrink-0 relative flex items-center">
          <input
            v-model="modelSearchQuery"
            type="text"
            placeholder="Filtrer la liste (ex: 3.5, 3.1, flash, pro, gemma)..."
            class="glass-input glass-search-input text-xs w-full"
            style="padding-left: 2.75rem !important;"
          />
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
        </div>

        <!-- Models Catalog List -->
        <div class="flex-1 overflow-y-auto space-y-2 pr-1">
          <div v-if="availableModelsLoading" class="p-8 text-center text-slate-400 animate-pulse text-xs font-bold">
            Chargement de la liste des modèles depuis l'API Google GenAI...
          </div>

          <div
            v-else-if="filteredAvailableModels.length > 0"
            v-for="model in filteredAvailableModels"
            :key="model.name"
            class="flex items-center justify-between p-3.5 rounded-xl bg-dark-900/80 border border-dark-700/60 hover:border-slate-600 transition-all"
          >
            <div class="space-y-1">
              <div class="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{{ model.displayName }}</span>
                <span v-if="model.name.includes('3.')" class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Modèle 3.X
                </span>
                <span v-if="model.rpm" class="px-2 py-0.5 rounded-md bg-dark-950 text-emerald-400 font-mono text-[10px] border border-dark-700/80" title="Requêtes par minute (RPM)">
                  ⚡ {{ model.rpm }}
                </span>
                <span v-if="model.rpd" class="px-2 py-0.5 rounded-md bg-dark-950 text-amber-400 font-mono text-[10px] border border-dark-700/80" title="Requêtes par jour (RPD)">
                  📅 {{ model.rpd }}
                </span>
                <span v-if="model.inputTokenFormatted" class="px-2 py-0.5 rounded-md bg-dark-950 text-slate-300 font-mono text-[10px] border border-dark-700/80" title="Fenêtre de contexte maximale d'entrée">
                  📥 {{ model.inputTokenFormatted }}
                </span>
              </div>
              <div class="text-[11px] font-mono text-slate-400">{{ model.name }}</div>
              <div v-if="model.description" class="text-[11px] text-slate-500 line-clamp-1">
                {{ model.description }}
              </div>
            </div>

            <button
              @click="addModelToChain(model.name, model.displayName)"
              :disabled="isModelAlreadyInList(model.name)"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              :class="[
                isModelAlreadyInList(model.name)
                  ? 'bg-dark-800 text-emerald-400 border border-emerald-500/30 opacity-75 cursor-default'
                  : 'bg-amber-500 hover:bg-amber-400 text-dark-950 shadow-md'
              ]"
            >
              <Check v-if="isModelAlreadyInList(model.name)" class="w-3.5 h-3.5" />
              <Plus v-else class="w-3.5 h-3.5" />
              <span>{{ isModelAlreadyInList(model.name) ? 'Déjà Ajouté' : 'Ajouter' }}</span>
            </button>
          </div>

          <div v-else class="p-8 text-center text-slate-400 text-xs italic">
            Aucun modèle ne correspond à la recherche.
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-4 border-t border-dark-700/60 flex justify-end flex-shrink-0">
          <button
            @click="isModelModalOpen = false"
            class="px-5 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-300 text-xs font-bold border border-dark-700/60 transition-colors"
          >
            Fermer le Catalogue
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
