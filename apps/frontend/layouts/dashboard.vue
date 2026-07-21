<script setup lang="ts">
const { user, logout } = useAuth()
</script>

<template>
  <div class="min-h-screen flex bg-dark-950 text-slate-100">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Dashboard Top Header -->
      <header class="h-16 border-b border-dark-700/60 bg-dark-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <!-- Breadcrumbs / Page Context -->
        <div class="flex items-center space-x-2 text-xs">
          <NuxtLink to="/" class="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
            <span>🏠 Accueil</span>
          </NuxtLink>
          <span class="text-slate-600">/</span>
          <span class="text-slate-400">Dashboard</span>
          <span class="text-slate-600">/</span>
          <span class="text-slate-200 font-medium capitalize">
            {{ $route.name?.toString().replace('dashboard-', '') || 'Abonnements' }}
          </span>
        </div>

        <!-- Top Right Actions -->
        <div class="flex items-center space-x-4">
          <NuxtLink
            to="/dashboard/games"
            class="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 flex items-center space-x-2 transition-all"
          >
            <span>+ Ajouter un Jeu</span>
          </NuxtLink>

          <!-- Logged in User Profile Badge -->
          <div v-if="user" class="hidden sm:flex items-center space-x-2 bg-dark-800/80 border border-dark-700/60 rounded-xl px-3 py-1.5">
            <img
              :src="user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
              :alt="user.username"
              class="h-6 w-6 rounded-full object-cover border border-slate-600"
            />
            <span class="text-xs font-semibold text-white max-w-[100px] truncate">
              {{ user.username }}
            </span>
          </div>

          <!-- Logout Button -->
          <button
            @click="logout"
            class="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white border border-dark-700 text-xs transition-colors"
            title="Se déconnecter"
          >
            Déconnexion
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
