<script setup lang="ts">
import { ref } from 'vue'
import type { DispatchLogDTO } from '@feedcrafter/shared'
import {
  X,
  Bot,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Columns,
  Globe,
  Radio,
  FileText
} from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  log?: DispatchLogDTO | any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isCopied = ref(false)

const copyTranslatedText = () => {
  if (!props.log?.translatedContent) return
  const fullText = `${props.log.translatedTitle || ''}\n\n${props.log.translatedContent}`
  navigator.clipboard.writeText(fullText)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
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
  <div v-if="isOpen && log" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div @click="emit('close')" class="absolute inset-0 bg-dark-950/85 backdrop-blur-md"></div>

    <!-- Modal Box -->
    <div class="relative w-full max-w-5xl max-h-[90vh] glass-card p-6 border border-dark-700 shadow-2xl flex flex-col space-y-6 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-dark-700/60 pb-4 flex-shrink-0">
        <div class="flex items-center space-x-3">
          <div class="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Columns class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-xl font-extrabold font-outfit text-white">
                {{ log.subscription?.game?.name || 'Comparatif Post' }}
              </h3>
              <PlatformBadge :platform="log.subscription?.game?.steamAppId ? 'steam' : log.subscription?.game?.epicSlug ? 'epic' : 'bnet'" size="sm" />
            </div>
            <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Diffusé le {{ formatDate(log.sentAt) }}</span>
              <span>•</span>
              <span class="text-slate-300 font-medium">➡️ {{ log.subscription?.guildName || '#salon' }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <!-- AI Model Badge -->
          <div class="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
            <span>Modèle : {{ log.modelUsed || 'gemini-2.5-flash' }}</span>
          </div>

          <button @click="emit('close')" class="p-2 rounded-xl bg-dark-900 text-slate-400 hover:text-white transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Side-by-Side Content Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        <!-- LEFT COLUMN: Post Original (Raw) -->
        <div class="glass-card p-5 space-y-4 border border-dark-700/80 bg-dark-950/60 flex flex-col justify-between">
          <div class="space-y-4">
            <!-- Header Tag -->
            <div class="flex items-center justify-between border-b border-dark-700/60 pb-3">
              <div class="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Globe class="w-4 h-4 text-sky-400" />
                <span>Post Original ({{ log.newsFeed?.source || 'STEAM' }})</span>
              </div>
              <span class="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar class="w-3 h-3 text-slate-500" />
                <span>{{ formatDate(log.newsFeed?.publishedAt) }}</span>
              </span>
            </div>

            <!-- Original Image -->
            <img
              v-if="log.newsFeed?.imageUrl"
              :src="log.newsFeed.imageUrl"
              alt="Image originale"
              class="w-full h-40 object-cover rounded-xl border border-dark-700"
            />

            <!-- Original Title -->
            <h4 class="text-base font-bold text-white leading-snug">
              {{ log.newsFeed?.title || log.translatedTitle || 'Titre original' }}
            </h4>

            <!-- Original Body Content -->
            <div class="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {{ log.newsFeed?.content || 'Contenu original non disponible' }}
            </div>
          </div>

          <!-- Original Source Link -->
          <div class="pt-4 border-t border-dark-700/60 flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Lien direct vers la source</span>
            <a
              v-if="log.newsFeed?.url"
              :href="log.newsFeed.url"
              target="_blank"
              class="text-sky-400 hover:text-sky-300 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <span>Ouvrir l'article original</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <!-- RIGHT COLUMN: Post Traduit IA (Discord Format) -->
        <div class="glass-card p-5 space-y-4 border border-brand-500/30 bg-brand-950/20 flex flex-col justify-between">
          <div class="space-y-4">
            <!-- Header Tag -->
            <div class="flex items-center justify-between border-b border-dark-700/60 pb-3">
              <div class="flex items-center space-x-2 text-xs font-bold text-brand-300 uppercase tracking-wider">
                <Bot class="w-4 h-4 text-brand-400" />
                <span>Post Traduit & Structuré IA</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 font-bold">
                Français (FR)
              </span>
            </div>

            <!-- Translated Title -->
            <h4 class="text-base font-extrabold text-brand-300 leading-snug">
              {{ log.translatedTitle || 'Titre traduit' }}
            </h4>

            <!-- AI Summary Box -->
            <div v-if="log.summary" class="p-3.5 rounded-xl bg-dark-950/80 border border-brand-500/20 text-xs text-slate-200 space-y-1">
              <div class="text-[10px] font-extrabold text-brand-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles class="w-3 h-3 text-brand-400" />
                <span>Résumé Synthétique IA</span>
              </div>
              <p class="leading-relaxed text-slate-300">{{ log.summary }}</p>
            </div>

            <!-- Translated Content Body (Discord Markdown style) -->
            <div class="space-y-2">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rendu du Message Discord</div>
              <div class="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-80 overflow-y-auto pr-2 custom-scrollbar bg-dark-950 p-4 rounded-xl border border-dark-700">
                {{ log.translatedContent || 'Contenu traduit non disponible' }}
              </div>
            </div>
          </div>

          <!-- Footer Copy Actions -->
          <div class="pt-4 border-t border-dark-700/60 flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Format prêt pour Discord</span>
            <button
              @click="copyTranslatedText"
              class="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-300" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ isCopied ? 'Copié !' : 'Copier le message' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between pt-4 border-t border-dark-700/60 flex-shrink-0">
        <div class="text-xs text-slate-400 flex items-center gap-2">
          <Radio class="w-3.5 h-3.5 text-emerald-400" />
          <span>Statut d'envoi : <strong class="text-white">{{ log.status || 'SUCCESS' }}</strong></span>
        </div>

        <button
          @click="emit('close')"
          class="px-5 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-white text-xs font-bold border border-dark-700 transition-all"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>
