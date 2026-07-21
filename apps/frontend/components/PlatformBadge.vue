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
      return {
        label: 'Battle.net',
        bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        icon: 'Flame'
      }
    default:
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
