<script setup lang="ts">
import { onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const { fetchUser } = useAuth()
const route = useRoute()

onMounted(async () => {
  if (route.query.error) {
    console.error('OAuth callback error:', route.query.error)
    navigateTo('/auth/login?error=' + route.query.error)
    return
  }

  const tokenParam = route.query.token as string | undefined
  const user = await fetchUser(tokenParam)
  if (user) {
    navigateTo('/dashboard')
  } else {
    navigateTo('/auth/login?error=session_failed')
  }
})
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4 space-y-4 text-center">
    <div class="h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl animate-pulse">
      FC
    </div>
    <h3 class="text-xl font-bold font-outfit text-white">
      Connexion Discord en cours...
    </h3>
    <p class="text-xs text-slate-400">
      Validation de la session en cours, vous allez être redirigé vers le Dashboard.
    </p>
  </div>
</template>
