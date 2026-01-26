import { io, Socket } from 'socket.io-client'
import { ref, computed } from 'vue'

let socket: Socket | null = null
const isConnected = ref(false)

export const useSocket = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:3001'

  const connect = (token: string) => {
    console.log('[SOCKET_CLIENT] Attempting to connect Socket.IO...')
    console.log('[SOCKET_CLIENT] API Base:', apiBase)
    console.log('[SOCKET_CLIENT] Token provided:', token ? 'Yes (length: ' + token.length + ')' : 'No')
    console.log('[SOCKET_CLIENT] Token preview:', token ? token.substring(0, 50) + '...' : 'No token')
    
    if (socket?.connected) {
      console.log('[SOCKET_CLIENT] ⚠️ Socket already connected, skipping')
      return
    }

    // Disconnect existing socket if any
    if (socket) {
      console.log('[SOCKET_CLIENT] Disconnecting existing socket...')
      socket.disconnect()
      socket.removeAllListeners()
    }

    console.log('[SOCKET_CLIENT] Creating new Socket.IO connection...')
    console.log('[SOCKET_CLIENT] Connection config:', {
      auth: { token: token ? token.substring(0, 20) + '...' : 'No token' },
      transports: ['websocket', 'polling']
    })
    
    // Thử cả auth và query để đảm bảo token được gửi
    socket = io(apiBase, {
      auth: {
        token,
      },
      query: {
        token, // Gửi cả trong query để backup
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      forceNew: true, // Force new connection
    })

    socket.on('connect', () => {
      console.log('[SOCKET_CLIENT] ✅ Socket.IO connected successfully!')
      console.log('[SOCKET_CLIENT] Socket ID:', socket?.id)
      console.log('[SOCKET_CLIENT] Socket transport:', socket?.io?.engine?.transport?.name)
      isConnected.value = true
    })

    socket.on('disconnect', (reason: string) => {
      console.log('[SOCKET_CLIENT] ❌ Socket.IO disconnected')
      console.log('[SOCKET_CLIENT] Disconnect reason:', reason)
      console.log('[SOCKET_CLIENT] Socket ID before disconnect:', socket?.id)
      isConnected.value = false
      
      // Nếu bị disconnect do server, có thể là token không hợp lệ
      if (reason === 'io server disconnect') {
        console.error('[SOCKET_CLIENT] ⚠️ Server disconnected the client - possible authentication issue')
        console.error('[SOCKET_CLIENT] ⚠️ Check server logs for authentication errors')
      }
    })

    socket.on('connected', (data: any) => {
      console.log('[SOCKET_CLIENT] ✅ Socket.IO authenticated successfully!')
      console.log('[SOCKET_CLIENT] Authentication data:', JSON.stringify(data))
    })

    socket.on('connect_error', (error: any) => {
      console.error('[SOCKET_CLIENT] ❌ Socket.IO connection error:', error)
      console.error('[SOCKET_CLIENT] Error message:', error.message)
      console.error('[SOCKET_CLIENT] Error type:', error.type)
      console.error('[SOCKET_CLIENT] Error details:', JSON.stringify(error))
      isConnected.value = false
    })

    socket.on('notification', (notification: any) => {
      console.log('[SOCKET_CLIENT] 🔔 Received notification via Socket.IO!')
      console.log('[SOCKET_CLIENT] Notification data:', JSON.stringify(notification, null, 2))
    })
    
    // Listen for any errors
    socket.on('error', (error: any) => {
      console.error('[SOCKET_CLIENT] ❌ Socket.IO error event:', error)
    })
  }

  const disconnect = () => {
    console.log('[SOCKET_CLIENT] Disconnecting Socket.IO...')
    if (socket) {
      socket.disconnect()
      socket = null
      isConnected.value = false
      console.log('[SOCKET_CLIENT] ✅ Socket.IO disconnected')
    } else {
      console.log('[SOCKET_CLIENT] No socket to disconnect')
    }
  }

  const onNotification = (callback: (notification: any) => void) => {
    console.log('[SOCKET_CLIENT] Setting up notification listener...')
    
    if (!socket) {
      console.warn('[SOCKET_CLIENT] ⚠️ Socket not connected. Call connect() first.')
      return () => {}
    }

    if (!socket.connected) {
      console.warn('[SOCKET_CLIENT] ⚠️ Socket exists but not connected')
    } else {
      console.log('[SOCKET_CLIENT] ✅ Socket is connected, registering notification listener')
    }

    socket.on('notification', (notification: any) => {
      console.log('[SOCKET_CLIENT] 🔔 Notification received in listener callback!')
      console.log('[SOCKET_CLIENT] Notification:', JSON.stringify(notification, null, 2))
      callback(notification)
    })

    console.log('[SOCKET_CLIENT] ✅ Notification listener registered')

    // Return cleanup function
    return () => {
      if (socket) {
        console.log('[SOCKET_CLIENT] Removing notification listener...')
        socket.off('notification', callback)
      }
    }
  }

  const emit = (event: string, data: any) => {
    if (!socket?.connected) {
      console.warn('Socket not connected')
      return
    }
    socket.emit(event, data)
  }

  return {
    connect,
    disconnect,
    onNotification,
    emit,
    isConnected: computed(() => isConnected.value),
    socket: computed(() => socket),
  }
}
