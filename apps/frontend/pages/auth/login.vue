<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { loginWithDiscord } = useAuth()

const handleDiscordLogin = () => {
  loginWithDiscord()
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
    <div class="w-full max-w-md glass-panel p-8 md:p-10 border border-dark-700 shadow-2xl space-y-8 text-center relative overflow-hidden">
      <!-- Glow decoration -->
      <div class="absolute -top-12 -right-12 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Logo & Title -->
      <div class="space-y-3">
        <div class="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center font-bold font-outfit text-white text-xl shadow-xl shadow-brand-500/30 mx-auto">
          FC
        </div>
        <h2 class="text-2xl font-bold font-outfit text-white">
          Connexion à FeedCrafter
        </h2>
        <p class="text-xs text-slate-400">
          Connectez-vous avec votre compte Discord pour gérer les abonnements et webhooks de vos serveurs.
        </p>
      </div>

      <!-- Discord Login Action -->
      <div class="space-y-4">
        <button
          @click="handleDiscordLogin"
          class="w-full py-3.5 px-6 rounded-xl bg-discord hover:bg-discord-hover text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-discord/30 flex items-center justify-center space-x-3 group"
        >
          <span class="w-6 h-6 bg-white rounded-full flex items-center justify-center text-discord font-black text-xs group-hover:scale-110 transition-transform">D</span>
          <span>Se connecter avec Discord</span>
        </button>

        <p class="text-[11px] text-slate-500 leading-relaxed">
          En vous connectant, FeedCrafter demande l'accès à votre profil de base Discord (`identify`) et à la liste de vos serveurs (`guilds`).
        </p>
      </div>

      <!-- Footer Info -->
      <div class="pt-6 border-t border-dark-700/60 text-xs text-slate-400">
        <p>🔒 Authentification sécurisée via OAuth2 officiel Discord.</p>
      </div>
    </div>
  </div>
</template>
