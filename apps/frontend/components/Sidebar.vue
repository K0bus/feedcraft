<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Gamepad2,
  History,
  ShieldCheck,
  Crown
} from 'lucide-vue-next'

const route = useRoute()
const { user, isSuperAdmin } = useAuth()

const navItems = computed(() => {
  const items = [
    { label: 'Mes Abonnements', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Catalogue Jeux', path: '/dashboard/games', icon: Gamepad2 },
    { label: 'Historique & Logs', path: '/dashboard/logs', icon: History }
  ]
  if (isSuperAdmin.value) {
    items.push({ label: 'Administration', path: '/admin', icon: ShieldCheck, isSpecial: true })
  }
  return items
})

const isActive = (path: string) => {
  if (path === '/dashboard') return route.path === '/dashboard'
  if (path === '/admin') return route.path.startsWith('/admin')
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="w-64 border-r border-dark-700/60 bg-dark-900/90 backdrop-blur-xl flex flex-col justify-between hidden md:flex min-h-screen sticky top-0 z-30">
    <div>
      <!-- Brand Bar -->
      <NuxtLink to="/" class="h-16 px-6 flex items-center space-x-3 border-b border-dark-700/60 group cursor-pointer">
        <div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-amber-400 flex items-center justify-center font-bold font-outfit text-white text-sm shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
          FC
        </div>
        <div class="flex flex-col">
          <span class="text-base font-extrabold font-outfit text-white tracking-tight leading-none">FeedCrafter</span>
          <span class="text-[10px] text-slate-400 font-medium mt-0.5">Discord Gaming Feeds</span>
        </div>
      </NuxtLink>

      <!-- Navigation Links -->
      <nav class="px-3 space-y-1.5 mt-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
          :class="[
            isActive(item.path)
              ? item.isSpecial
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
                : 'bg-brand-600/20 text-brand-400 border border-brand-500/30 shadow-glow-indigo'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60 border border-transparent'
          ]"
        >
          <component
            :is="item.icon"
            class="w-4 h-4"
            :class="[
              isActive(item.path)
                ? (item.isSpecial ? 'text-amber-400' : 'text-brand-400')
                : 'text-slate-400'
            ]"
          />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Bottom Account Status -->
    <div class="p-4 border-t border-dark-700/60">
      <div class="glass-card p-3 flex items-center space-x-3 border border-dark-700/60">
        <div class="relative flex-shrink-0">
          <img
            :src="user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
            :alt="user?.username || 'Avatar'"
            class="h-9 w-9 rounded-full object-cover bg-dark-700 border border-slate-600"
          />
          <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-dark-900"></span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-white truncate flex items-center gap-1">
            <span>{{ user?.username || 'Utilisateur Discord' }}</span>
            <Crown v-if="isSuperAdmin" class="w-3 h-3 text-amber-400 flex-shrink-0" />
          </div>
          <div class="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>En ligne</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
