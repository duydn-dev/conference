import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket } from './useSocket'

interface LoginCredentials {
  username: string
  password: string
  remember?: boolean
}

interface User {
  id: string
  username?: string
  email: string
  name?: string
  fullname?: string
  identity_number?: string
  sdt?: string
}

interface AuthResponse {
  user: User
  token: string
}

const user = ref<User | null>(null)
const token = ref<string | null>(null)
const loading = ref(false)


export const getUser = () => {
  if (process.client) {
    // Đọc từ cookie trước, fallback về localStorage nếu không có
    const authUserCookie = useCookie('auth_user', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    
    if (authUserCookie.value) {
      try {
        return typeof authUserCookie.value === 'string' 
          ? JSON.parse(authUserCookie.value) 
          : authUserCookie.value
      } catch (e) {
        console.error('Error parsing auth_user cookie:', e)
      }
    }
    
    // Fallback về localStorage
    const storedUser = localStorage.getItem('auth_user')
    if (storedUser) {
      try {
        return JSON.parse(storedUser)
      } catch (e) {
        console.error('Error parsing auth_user from localStorage:', e)
      }
    }
  }
  return {}
}

export const decodeJWT = (token: any) =>  {
  try {
    // Kiểm tra định dạng JWT (3 phần)
    const parts = (token ? token.value : token)?.split('.') || [];
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Base64 decode payload (phần thứ 2)
    const base64Payload = parts[1];
    
    // Thay thế các ký tự đặc biệt của Base64Url
    const base64 = base64Payload?.replace(/-/g, '+')
      .replace(/_/g, '/') || '';
    
    // Thêm padding nếu cần
    const padding = base64?.length % 4 || 0;
    const paddedBase64 = padding ? 
      base64 + '='.repeat(4 - padding) : 
      base64;
    
    // Decode Base64
    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    // Parse JSON
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

export const isAuthenticated = () => {
  const user = useCookie('auth_user');
  return user && user.value;
}

export const useAuth = () => {
  const router = useRouter()
  const config = useRuntimeConfig()

  // Load auth state từ cookie
  if (process.client) {
    // Đọc user từ cookie (không httpOnly)
    const authUserCookie = useCookie('auth_user', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    
    if (authUserCookie.value) {
      try {
        const userData = typeof authUserCookie.value === 'string' 
          ? JSON.parse(authUserCookie.value) 
          : authUserCookie.value
        user.value = userData
        // Token được lưu trong cookie httpOnly từ server
        // Không thể đọc trực tiếp từ client, nhưng cookie sẽ tự động gửi trong request
        token.value = 'authenticated'
        
        // Connect Socket.IO nếu có token
        const socketTokenCookie = useCookie('socket_token', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        if (socketTokenCookie.value) {
          console.log('[USE_AUTH] Found socket_token cookie, connecting Socket.IO...')
          console.log('[USE_AUTH] Token length:', socketTokenCookie.value.length)
          console.log('[USE_AUTH] Token preview:', socketTokenCookie.value.substring(0, 50) + '...')
          const { connect } = useSocket()
          connect(socketTokenCookie.value)
        } else {
          console.warn('[USE_AUTH] No socket_token cookie found, skipping Socket.IO connection')
        }
      } catch (e) {
        console.error('Error parsing auth_user cookie:', e)
        authUserCookie.value = null
      }
    } else {
      // Fallback: Đọc từ localStorage (để migrate dữ liệu cũ)
      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
          token.value = 'authenticated'
          // Migrate từ localStorage sang cookie
          const authUserCookie = useCookie('auth_user', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          })
          authUserCookie.value = storedUser
        } catch (e) {
          console.error('Error parsing stored user:', e)
          localStorage.removeItem('auth_user')
        }
      }
    }
  }

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    loading.value = true
    
    try {
      const response = await $fetch<AuthResponse>(
        '/api/auth/login',
        {
          method: 'POST',
          body: {
            username: credentials.username,
            password: credentials.password,
            remember: credentials.remember
          }
        }
      )

      // Set auth state
      user.value = response.user
      // Lưu token vào memory để dùng cho Authorization header khi cần
      token.value = response.token

      // Lưu token vào cookie không httpOnly để Socket.IO có thể đọc
      if (process.client) {
        const socketTokenCookie = useCookie('socket_token', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        socketTokenCookie.value = response.token

        // Connect Socket.IO
        const { connect } = useSocket()
        connect(response.token)
      }

      // auth_user đã được set vào cookie từ server (login.post.ts)
      // Đồng bộ với cookie để đảm bảo có dữ liệu
      if (process.client) {
        const authUserCookie = useCookie('auth_user', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        // Đọc lại từ cookie để đảm bảo đồng bộ
        if (authUserCookie.value) {
          try {
            const userData = typeof authUserCookie.value === 'string' 
              ? JSON.parse(authUserCookie.value) 
              : authUserCookie.value
            user.value = userData
          } catch (e) {
            console.error('Error parsing auth_user cookie after login:', e)
          }
        }
        // Giữ localStorage như backup (có thể xóa sau khi migrate xong)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
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
      // Disconnect Socket.IO
      if (process.client) {
        const { disconnect } = useSocket()
        disconnect()
      }

      // Gọi API logout để xóa cookie từ server
      await $fetch('/api/auth/logout', {
        method: 'POST'
      }).catch(() => {
        // Ignore errors on logout
      })
    } catch (e) {
      // Ignore errors
    } finally {
      // Clear auth state
      user.value = null
      token.value = null

      // Clear cookie và localStorage
      if (process.client) {
        const authUserCookie = useCookie('auth_user', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        authUserCookie.value = null
        
        const socketTokenCookie = useCookie('socket_token', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        socketTokenCookie.value = null
        
        localStorage.removeItem('auth_user')
      }

      // Redirect to login
      await router.push('/login')
    }
  }

  const getAuthHeaders = () => {
    // Token được lưu trong cookie httpOnly và trong memory
    // Sử dụng token trong memory để gửi Authorization header khi cần
    if (!token.value || token.value === 'authenticated') {
      return {}
    }
    return {
      Authorization: `Bearer ${token.value}`
    }
  }

  return {
    user: computed(() => user.value),
    token: computed(() => token.value),
    loading: computed(() => loading.value),
    login,
    logout,
    getAuthHeaders,
    getUser
  }
}