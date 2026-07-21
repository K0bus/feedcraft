export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchUser } = useAuth()

  // Fetch user profile if not already in state
  if (!user.value) {
    await fetchUser()
  }

  // Redirect to login if user is not authenticated
  if (!user.value) {
    return navigateTo('/auth/login')
  }
})
