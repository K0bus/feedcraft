<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  platform: 'steam' | 'epic' | 'bnet' | 'rss' | string
  size?: 'sm' | 'md'
}>()

const badgeConfig = computed(() => {
  const p = props.platform.toLowerCase()
  switch (p) {
    case 'steam':
      return {
        label: 'Steam',
        bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        icon: 'Gamepad2'
      }
    case 'epic':
      return {
        label: 'Epic Games',
        bg: 'bg-slate-100/10 text-slate-200 border-slate-400/20',
        icon: 'Zap'
      }
    case 'bnet':
    case 'blizzard':
    case 'battlenet':
    case 'battle.net':
      return {
        label: 'Battle.net',
        bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        icon: 'Flame'
      }
    case 'gog':
      return {
        label: 'GOG',
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        icon: 'Store'
      }
    case 'playstation':
    case 'ps5':
    case 'ps4':
      return {
        label: 'PlayStation',
        bg: 'bg-blue-600/10 text-blue-400 border-blue-500/20',
        icon: 'Gamepad'
      }
    case 'xbox':
      return {
        label: 'Xbox',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: 'Box'
      }
    default:
      if (p && p !== 'rss') {
        return {
          label: props.platform,
          bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
          icon: 'Globe'
        }
      }
      return {
        label: 'RSS Feed',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: 'Rss'
      }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 font-medium border rounded-full transition-all"
    :class="[
      badgeConfig.bg,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
    ]"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
    <span>{{ badgeConfig.label }}</span>
  </span>
</template>
