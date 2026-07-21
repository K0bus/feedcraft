import { ref, computed } from 'vue'
import type { UserDTO } from '@feedcrafter/shared'

const user = ref<UserDTO | null>(null)
const authToken = ref<string | null>(null)
const isLoading = ref<boolean>(false)
const error = ref<string | null>(null)

export function useAuth() {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBaseUrl || ''

  const isAuthenticated = computed(() => !!user.value)

  /**
   * Fetches current authenticated user profile from backend
   */
  const fetchUser = async (explicitToken?: string): Promise<UserDTO | null> => {
    isLoading.value = true
    error.value = null

    if (explicitToken) {
      authToken.value = explicitToken
      if (import.meta.client) {
        localStorage.setItem('feedcrafter_token', explicitToken)
      }
    } else if (!authToken.value && import.meta.client) {
      const stored = localStorage.getItem('feedcrafter_token')
      if (stored) {
        authToken.value = stored
      }
    }

    try {
      const requestFetch = useRequestFetch()
      const headers: Record<string, string> = {}
      if (authToken.value) {
        headers['Authorization'] = `Bearer ${authToken.value}`
      }

      const userData = await requestFetch<UserDTO>(`${apiBaseUrl}/api/auth/me`, {
        headers
      })
      user.value = userData
      return userData
    } catch (err: any) {
      error.value = err.data?.error || err.message || 'Erreur réseau lors de l\'authentification'
      user.value = null
      if (import.meta.client) {
        localStorage.removeItem('feedcrafter_token')
      }
      authToken.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Redirects user to backend Discord OAuth authorization URL
   */
  const loginWithDiscord = () => {
    window.location.href = `${apiBaseUrl}/api/auth/discord`
  }

  /**
   * Logs out user and resets authentication state
   */
  const logout = async () => {
    try {
      const requestFetch = useRequestFetch()
      const headers: Record<string, string> = {}
      if (authToken.value) {
        headers['Authorization'] = `Bearer ${authToken.value}`
      }
      await requestFetch(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        headers
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      authToken.value = null
      if (import.meta.client) {
        localStorage.removeItem('feedcrafter_token')
      }
      navigateTo('/auth/login')
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    fetchUser,
    loginWithDiscord,
    logout
  }
}
