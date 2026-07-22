export default defineNuxtRouteMiddleware(async () => {
  const { user, isSuperAdmin, fetchUser } = useAuth()

  if (!user.value) {
    await fetchUser()
  }

  if (!user.value) {
    return navigateTo('/auth/login')
  }

  if (!isSuperAdmin.value) {
    return navigateTo('/dashboard')
  }
})
