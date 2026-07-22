<script setup lang="ts">
import { Home, ChevronRight, Crown, LogOut } from 'lucide-vue-next'

const { user, logout } = useAuth()
</script>

<template>
  <div class="min-h-screen flex bg-dark-950 text-slate-100 font-sans">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Admin Top Header -->
      <header class="h-16 border-b border-amber-500/20 bg-dark-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <!-- Breadcrumbs / Admin Context -->
        <div class="flex items-center space-x-2 text-xs">
          <NuxtLink to="/" class="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 font-medium">
            <Home class="w-3.5 h-3.5 text-slate-400" />
            <span>Accueil</span>
          </NuxtLink>
          <ChevronRight class="w-3.5 h-3.5 text-slate-600" />
          <NuxtLink to="/dashboard" class="text-slate-400 hover:text-white transition-colors font-medium">
            <span>Dashboard</span>
          </NuxtLink>
          <ChevronRight class="w-3.5 h-3.5 text-slate-600" />
          <span class="text-amber-400 font-bold flex items-center gap-1.5">
            <Crown class="w-3.5 h-3.5 text-amber-400" />
            <span>Administration</span>
          </span>
        </div>

        <!-- Top Right Admin Profile & Actions -->
        <div class="flex items-center space-x-3">
          <div class="hidden sm:flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5">
            <span class="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span class="text-xs font-bold text-amber-300">Mode Super Admin</span>
          </div>

          <!-- Logged in User Profile Badge -->
          <div v-if="user" class="hidden sm:flex items-center space-x-2 bg-dark-800/80 border border-dark-700/60 rounded-xl px-3 py-1.5">
            <img
              :src="user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
              :alt="user.username"
              class="h-6 w-6 rounded-full object-cover border border-amber-500/50 bg-dark-900"
            />
            <span class="text-xs font-semibold text-white max-w-[120px] truncate">
              {{ user.username }}
            </span>
          </div>

          <!-- Logout Button -->
          <button
            @click="logout"
            class="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white border border-dark-700 text-xs transition-colors flex items-center gap-1"
            title="Se déconnecter"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </header>

      <!-- Main Slot -->
      <main class="flex-1 p-6 md:p-8 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
