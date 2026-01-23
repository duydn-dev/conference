import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

interface LoginCredentials {
  username: string
  password: string
  remember?: boolean
}

interface User {
  id: string
  username: string
  email: string
  name?: string
}

interface AuthResponse {
  user: User
  token: string
}

const user = ref<User | null>(null)
const token = ref<string | null>(null)
const loading = ref(false)

export const useAuth = () => {
  const router = useRouter()
  const config = useRuntimeConfig()

  // Load auth state from localStorage on initialization
  if (process.client) {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Error parsing stored user:', e)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    loading.value = true
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    try {
      const response = await $fetch<AuthResponse>(
        `${apiBase}/auth/login`,
        {
          method: 'POST',
          body: {
            username: credentials.username,
            password: credentials.password
          }
        }
      )

      // Set auth state
      user.value = response.user
      token.value = response.token

      // Store in localStorage
      if (process.client) {
        if (credentials.remember) {
          localStorage.setItem('auth_token', response.token)
          localStorage.setItem('auth_user', JSON.stringify(response.user))
        } else {
          sessionStorage.setItem('auth_token', response.token)
          sessionStorage.setItem('auth_user', JSON.stringify(response.user))
        }
      }

      return response
    } catch (error: any) {
      // Handle authentication errors
      const status = error.status || error.statusCode || error.response?.status
      
      if (status === 401) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng')
      }
      
      if (status === 404) {
        throw new Error('Không tìm thấy endpoint đăng nhập. Vui lòng kiểm tra cấu hình API.')
      }
      
      const message = error.data?.message || error.message || 'Không thể kết nối đến server'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      // Call logout API if available
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiBase}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      }).catch(() => {
        // Ignore errors on logout
      })
    } catch (e) {
      // Ignore errors
    } finally {
      // Clear auth state
      user.value = null
      token.value = null

      // Clear storage
      if (process.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        sessionStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_user')
      }

      // Redirect to login
      await router.push('/login')
    }
  }

  const getAuthHeaders = () => {
    if (!token.value) {
      return {}
    }
    return {
      Authorization: `Bearer ${token.value}`
    }
  }

  return {
    user: computed(() => user.value),
    token: computed(() => token.value),
    isAuthenticated,
    loading: computed(() => loading.value),
    login,
    logout,
    getAuthHeaders
  }
}