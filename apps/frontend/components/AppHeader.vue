<script setup lang="ts">
import {
  Crown,
  LayoutDashboard,
  LogOut,
  LogIn
} from 'lucide-vue-next'

const { user, isAuthenticated, logout } = useAuth()
</script>

<template>
  <header class="border-b border-dark-700/60 bg-dark-950/80 backdrop-blur-md sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Brand Logo -->
      <NuxtLink to="/" class="flex items-center space-x-3 group cursor-pointer">
        <div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-amber-400 flex items-center justify-center font-bold font-outfit text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
          FC
        </div>
        <span class="text-xl font-bold font-outfit tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          FeedCrafter
        </span>
      </NuxtLink>

      <!-- Public Navigation Links -->
      <nav class="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
        <NuxtLink to="/" class="hover:text-white transition-colors">Accueil</NuxtLink>
        <NuxtLink to="/#features" class="hover:text-white transition-colors">Fonctionnalités</NuxtLink>
        <NuxtLink to="/#platforms" class="hover:text-white transition-colors">Plateformes</NuxtLink>
      </nav>

      <!-- Authenticated User Profile OR Discord Login CTA -->
      <div class="flex items-center space-x-3">
        <!-- Logged In Profile -->
        <div v-if="isAuthenticated && user" class="flex items-center space-x-2.5">
          <NuxtLink
            v-if="user.isSuperAdmin"
            to="/admin"
            class="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5"
          >
            <Crown class="w-3.5 h-3.5 text-amber-400" />
            <span>Administration</span>
          </NuxtLink>

          <NuxtLink
            to="/dashboard"
            class="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center space-x-1.5"
          >
            <LayoutDashboard class="w-3.5 h-3.5" />
            <span>Tableau de Bord</span>
          </NuxtLink>

          <div class="hidden sm:flex items-center space-x-2 bg-dark-800/80 border border-dark-700/60 rounded-xl px-3 py-1.5">
            <img
              :src="user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
              :alt="user.username"
              class="h-6 w-6 rounded-full object-cover border border-slate-600 bg-dark-900"
            />
            <span class="text-xs font-semibold text-white max-w-[120px] truncate">
              {{ user.username }}
            </span>
          </div>

          <button
            @click="logout"
            class="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white border border-dark-700 text-xs transition-colors flex items-center gap-1"
            title="Se déconnecter"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>

        <!-- Logged Out Login Button -->
        <NuxtLink
          v-else
          to="/auth/login"
          class="px-4 py-2 rounded-xl bg-discord hover:bg-discord-hover text-white font-semibold text-xs transition-all shadow-lg shadow-discord/25 flex items-center space-x-2"
        >
          <LogIn class="w-4 h-4" />
          <span>Connexion avec Discord</span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
