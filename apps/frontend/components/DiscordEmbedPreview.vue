<script setup lang="ts">
import { ref } from 'vue'
import type { NewsPreviewResponse } from '@feedcrafter/shared'

const props = defineProps<{
  data: NewsPreviewResponse
}>()

const activeTab = ref<'discord' | 'raw'>('discord')
</script>

<template>
  <div class="space-y-4">
    <!-- Tab Switcher Header -->
    <div class="flex items-center space-x-2 border-b border-dark-700/60 pb-3">
      <button
        @click="activeTab = 'discord'"
        class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2"
        :class="[
          activeTab === 'discord'
            ? 'bg-discord text-white shadow-lg shadow-discord/30'
            : 'bg-dark-800 text-slate-400 hover:text-white'
        ]"
      >
        <span>🤖 Rendu Discord (IA Gemini)</span>
      </button>

      <button
        @click="activeTab = 'raw'"
        class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2"
        :class="[
          activeTab === 'raw'
            ? 'bg-brand-600 text-white shadow-glow-indigo'
            : 'bg-dark-800 text-slate-400 hover:text-white'
        ]"
      >
        <span>📄 Texte d'origine (Anglais)</span>
      </button>
    </div>

    <!-- TAB 1: Discord Dark Mode UI Embed -->
    <div
      v-if="activeTab === 'discord'"
      class="bg-[#313338] text-slate-200 rounded-2xl p-4 sm:p-5 font-sans border border-slate-700/50 shadow-2xl space-y-3 selection:bg-[#5865F2] selection:text-white"
    >
      <!-- Discord Message Author Header -->
      <div class="flex items-start space-x-3">
        <!-- Bot Avatar -->
        <div class="h-10 w-10 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-white text-sm shadow-md flex-shrink-0">
          FC
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 leading-none">
            <span class="font-bold text-white text-sm hover:underline cursor-pointer">
              FeedCrafter Bot
            </span>
            <span class="bg-[#5865F2] text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
              BOT ✓
            </span>
            <span class="text-[11px] text-slate-400">
              Aujourd'hui à {{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>

          <!-- Message Text intro -->
          <p class="text-xs text-slate-300 mt-1.5">
            Nouvelle mise à jour disponible ! Voici le patch note traduit et résumé :
          </p>

          <!-- Discord Embed Card -->
          <div class="mt-3 bg-[#2b2d31] rounded-lg p-4 border-l-4 border-[#6366F1] max-w-2xl space-y-3 shadow-lg">
            <!-- Embed Provider / App Title -->
            <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              🎮 FeedCrafter Updates
            </div>

            <!-- Embed Title (Clickable) -->
            <h4 class="text-base font-bold text-white hover:text-sky-400 transition-colors">
              <a :href="data.raw.url" target="_blank" class="hover:underline flex items-center gap-1.5">
                <span>{{ data.translated.title }}</span>
                <span class="text-xs text-slate-400">↗</span>
              </a>
            </h4>

            <!-- Embed Description Content -->
            <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
              <p class="font-semibold text-slate-200 bg-[#1e1f22] p-2.5 rounded-md border border-slate-700/40">
                💡 {{ data.translated.summary }}
              </p>
              <div class="pt-1 text-slate-300">
                {{ data.translated.content }}
              </div>
            </div>

            <!-- Embed Footer & Timestamp -->
            <div class="pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
              <span>{{ data.discordEmbed.footerText || 'Propulsé par FeedCrafter × Gemini 2.5 Flash' }}</span>
              <span>{{ new Date(data.raw.publishedAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: Raw Article Content (English) -->
    <div
      v-else
      class="glass-panel p-5 space-y-4 text-xs font-mono text-slate-300 max-h-[450px] overflow-y-auto"
    >
      <div class="border-b border-dark-700 pb-3">
        <h4 class="text-sm font-bold font-sans text-white">{{ data.raw.title }}</h4>
        <a :href="data.raw.url" target="_blank" class="text-brand-400 hover:underline text-[11px] mt-1 inline-block">
          {{ data.raw.url }} ↗
        </a>
      </div>
      <div class="whitespace-pre-line leading-relaxed text-slate-300">
        {{ data.raw.content }}
      </div>
    </div>
  </div>
</template>
