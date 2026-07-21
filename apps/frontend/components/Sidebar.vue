<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const { user } = useAuth()

const navItems = [
  { label: 'Mes Abonnements', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Catalogue Jeux', path: '/dashboard/games', icon: 'Gamepad2' },
  { label: 'Historique / Logs', path: '/dashboard/logs', icon: 'History' }
]

const isActive = (path: string) => {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="w-64 border-r border-dark-700/60 bg-dark-900/90 backdrop-blur-xl flex flex-col justify-between hidden md:flex min-h-screen sticky top-0">
    <div>
      <!-- Brand Bar (Redirects to Home /) -->
      <NuxtLink to="/" class="h-16 px-6 flex items-center space-x-3 border-b border-dark-700/60 group cursor-pointer">
        <div class="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center font-bold font-outfit text-white text-sm shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
          FC
        </div>
        <span class="text-lg font-bold font-outfit text-white tracking-tight">FeedCrafter</span>
      </NuxtLink>

      <!-- Server Switcher Select -->
      <div class="p-4">
        <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Serveur Discord Sélectionné
        </label>
        <select class="w-full glass-input text-xs bg-dark-950 font-medium">
          <option value="g1">🎮 Mon Serveur Gaming FR</option>
          <option value="g2">⚔️ Guilde MMO RPG</option>
          <option value="g3">🚀 Esport Community</option>
        </select>
      </div>

      <!-- Navigation Links -->
      <nav class="px-3 space-y-1 mt-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
          :class="[
            isActive(item.path)
              ? 'bg-brand-600/15 text-brand-500 border border-brand-500/30 shadow-glow-indigo'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
          ]"
        >
          <span class="h-2 w-2 rounded-full" :class="isActive(item.path) ? 'bg-brand-500' : 'bg-slate-600'"></span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Bottom Account Status -->
    <div class="p-4 border-t border-dark-700/60">
      <div class="glass-card p-3 flex items-center space-x-3">
        <div class="relative flex-shrink-0">
          <img
            :src="user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
            :alt="user?.username || 'Avatar'"
            class="h-9 w-9 rounded-full object-cover bg-dark-700 border border-slate-600"
          />
          <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-dark-900"></span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-white truncate">
            {{ user?.username || 'Utilisateur Discord' }}
          </div>
          <div class="text-[10px] text-emerald-400 flex items-center gap-1">
            <span>● Connecté</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
