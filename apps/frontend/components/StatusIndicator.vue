<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'active' | 'error' | 'pending' | boolean
  label?: string
}>()

const isCurrentActive = computed(() => {
  if (typeof props.status === 'boolean') return props.status
  return props.status === 'active'
})

const isPending = computed(() => {
  return props.status === 'pending'
})

const textLabel = computed(() => {
  if (props.label) return props.label
  if (isPending.value) return 'En attente'
  return isCurrentActive.value ? 'Actif' : 'Invalide'
})
</script>

<template>
  <div class="inline-flex items-center gap-2 text-xs font-medium">
    <span class="relative flex h-2.5 w-2.5">
      <span
        v-if="isCurrentActive"
        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"
      ></span>
      <span
        v-else-if="isPending"
        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-amber opacity-75"
      ></span>
      <span
        class="relative inline-flex rounded-full h-2.5 w-2.5"
        :class="[
          isCurrentActive
            ? 'bg-neon-green shadow-glow-green'
            : isPending
            ? 'bg-neon-amber'
            : 'bg-neon-red shadow-glow-red'
        ]"
      ></span>
    </span>
    <span
      :class="[
        isCurrentActive
          ? 'text-emerald-400'
          : isPending
          ? 'text-amber-400'
          : 'text-rose-400'
      ]"
    >
      {{ textLabel }}
    </span>
  </div>
</template>
