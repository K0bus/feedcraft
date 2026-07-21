<template>
  <div class="min-h-screen flex flex-col bg-dark-950 text-slate-100 bg-cyber-grid">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
