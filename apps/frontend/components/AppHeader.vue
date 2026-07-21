<script setup lang="ts">
const { user, isAuthenticated, logout } = useAuth()
</script>

<template>
  <header class="border-b border-dark-700/60 bg-dark-950/80 backdrop-blur-md sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Brand Logo (Redirects to Home /) -->
      <NuxtLink to="/" class="flex items-center space-x-3 group cursor-pointer">
        <div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center font-bold font-outfit text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
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
      <div class="flex items-center space-x-4">
        <!-- Logged In Profile -->
        <div v-if="isAuthenticated && user" class="flex items-center space-x-3">
          <NuxtLink
            to="/dashboard"
            class="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center space-x-2"
          >
            <span>Tableau de Bord</span>
          </NuxtLink>

          <div class="flex items-center space-x-2 bg-dark-800/80 border border-dark-700/60 rounded-xl px-3 py-1.5">
            <img
              :src="user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
              :alt="user.username"
              class="h-7 w-7 rounded-full object-cover border border-slate-600 bg-dark-900"
            />
            <span class="text-xs font-semibold text-white max-w-[120px] truncate">
              {{ user.username }}
            </span>
          </div>

          <button
            @click="logout"
            class="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white border border-dark-700 text-xs transition-colors"
            title="Déconnexion"
          >
            Déconnexion
          </button>
        </div>

        <!-- Logged Out Login Button -->
        <NuxtLink
          v-else
          to="/auth/login"
          class="px-4 py-2 rounded-xl bg-discord hover:bg-discord-hover text-white font-semibold text-xs transition-all shadow-lg shadow-discord/25 flex items-center space-x-2"
        >
          <span class="w-4 h-4 bg-white rounded-full flex items-center justify-center text-discord font-black text-[10px]">D</span>
          <span>Connexion avec Discord</span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
