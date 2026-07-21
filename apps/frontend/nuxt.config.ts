// Nuxt 3 Configuration for FeedCrafter Admin Panel

export default defineNuxtConfig({
  devtools: { enabled: true },
  experimental: {
    appManifest: false
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'FeedCrafter - Dynamic Gaming News & Discord Router',
      meta: [
        { name: 'description', content: 'Automated gaming news & patch notes translation and Discord webhook router.' }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || ''
    }
  },
  routeRules: {
    '/api/**': { proxy: `${process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/**` }
  },
  typescript: {
    strict: true,
    typeCheck: false
  }
})
