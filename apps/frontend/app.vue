<script setup lang="ts">
const { fetchUser } = useAuth()

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div class="min-h-screen bg-dark-950 text-slate-100 font-sans antialiased selection:bg-brand-500 selection:text-white">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
