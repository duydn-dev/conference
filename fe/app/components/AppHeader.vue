<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="flex items-center justify-between px-6 py-4">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <img src="/imgs/ihanoi.png" alt="Logo" class="h-10 w-auto" />
        <span class="hidden md:inline text-xl font-bold text-gray-800">Quản lý sự kiện</span>
      </div>

      <!-- Right side actions -->
      <div class="flex items-center gap-4 relative">
        <!-- Search -->
        <div class="relative hidden md:block">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            class="pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent w-64"
            @keyup.enter="handleSearch"
            @input="handleSearchInput"
          />
          <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <i class="pi pi-times text-sm"></i>
          </button>
        </div>

        <!-- Icons -->
        <div class="flex items-center gap-3">
          <!-- Notifications button -->
          <button
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            @click="toggleNotifications"
          >
            <i class="pi pi-bell text-gray-600"></i>
            <span
              v-if="unreadCount > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Notifications Modal -->
          <Dialog
            v-model:visible="showNotifications"
            modal
            :style="{ width: '90vw', maxWidth: '500px' }"
            :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
            :draggable="false"
            :closable="true"
            header="Thông báo"
            class="notifications-modal"
          >
            <template #header>
              <div class="flex items-center justify-between w-full px-1">
                <span class="text-lg font-semibold text-gray-800">Thông báo</span>
                <button
                  class="text-sm text-sky-600 hover:underline flex items-center gap-1"
                  type="button"
                  @click="refreshNotifications"
                  :disabled="loadingNotifications"
                >
                  <i class="pi pi-refresh" :class="{ 'pi-spin': loadingNotifications }"></i>
                  Làm mới
                </button>
              </div>
            </template>

            <div class="notifications-content">
              <template v-if="loadingNotifications">
                <div class="px-4 py-8 text-center text-gray-400 text-sm">
                  <i class="pi pi-spin pi-spinner mr-2"></i>
                  Đang tải thông báo...
                </div>
              </template>
              <template v-else-if="notifications.length === 0">
                <div class="px-4 py-8 text-center text-gray-400 text-sm">
                  Chưa có thông báo nào
                </div>
              </template>
              <template v-else>
                <ul class="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                  <li
                    v-for="item in sortedNotifications"
                    :key="item.id"
                    class="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    @click="handleNotificationClick(item)"
                  >
                    <div class="flex flex-col gap-1">
                      <span class="text-sm font-medium text-gray-800 break-words">
                        {{ item.title }}
                      </span>
                      <span class="text-xs text-gray-500 break-words">
                        {{ formatEventTime(item.event?.start_time, item.event?.end_time) }}
                      </span>
                      <span
                        v-if="item.event?.organizerUnit?.name"
                        class="text-xs text-gray-500 break-words"
                      >
                        Đơn vị tổ chức: {{ item.event.organizerUnit.name }}
                      </span>
                    </div>
                  </li>
                </ul>
                <button
                  v-if="hasMore && !loadingNotifications"
                  type="button"
                  class="w-full text-center text-sm text-sky-600 hover:bg-gray-50 py-3 border-t border-gray-100 transition-colors"
                  @click.stop="loadMoreNotifications"
                >
                  Xem thêm
                </button>
              </template>
            </div>
          </Dialog>

          <!-- User dropdown -->
          <div class="relative">
            <button
              class="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              @click="toggleUserMenu"
            >
              <div class="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                <i class="pi pi-user text-sky-600 text-sm"></i>
              </div>
              <span v-if="currentUser" class="hidden md:block text-sm font-medium text-gray-700">
                {{ currentUser.fullname || currentUser.email || 'User' }}
              </span>
              <i class="pi pi-chevron-down text-xs text-gray-500 hidden md:block"></i>
            </button>

            <!-- Dropdown panel -->
            <div
              v-if="showUserMenu"
              v-click-outside="() => showUserMenu = false"
              class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
            >
              <div class="px-4 py-3 border-b border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <i class="pi pi-user text-sky-600"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">
                      {{ currentUser?.fullname || 'Người dùng' }}
                    </p>
                    <p v-if="currentUser?.email" class="text-xs text-gray-500 truncate">
                      {{ currentUser.email }}
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="py-1">
                <button
                  type="button"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  @click="handleLogout"
                >
                  <i class="pi pi-sign-out text-gray-400"></i>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import { useNotifications } from '~/composables/useNotifications'
import { useNotificationReceivers } from '~/composables/useNotificationReceivers'
import { useAuth, getUser } from '~/composables/useAuth'
import { useSocket } from '~/composables/useSocket'
import { useToastSafe } from '~/composables/useToastSafe'
import type { Notification } from '~/types/notification'

const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const showNotifications = ref(false)
const showUserMenu = ref(false)
const loadingNotifications = ref(false)
const notifications = ref<any[]>([])
const readNotificationIds = ref<string[]>([])
const currentPage = ref(1)
const pageSize = 10
const hasMore = ref(true)

const { getPagination: getNotifications } = useNotifications()
const { markAllAsReadByNotification } = useNotificationReceivers()
const { logout } = useAuth()
const { onNotification: onSocketNotification, isConnected } = useSocket()
const toast = useToastSafe()

// Get current user from cookie
const currentUser = computed(() => {
  if (process.client) {
    return getUser()
  }
  return null
})

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  try {
    showUserMenu.value = false
    await logout()
  } catch (error) {
    console.error('Error logging out:', error)
  }
}

// Watch route changes to sync search query
watch(() => route.query.search, (newSearch) => {
  if (typeof newSearch === 'string') {
    searchQuery.value = newSearch
  } else {
    searchQuery.value = ''
  }
}, { immediate: true })

const handleSearchInput = () => {
  // Optional: debounce or handle input changes
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    // Navigate to events page with search query
    router.push({
      path: '/events',
      query: {
        search: searchQuery.value.trim(),
        ...(route.query.status && { status: route.query.status })
      }
    })
  } else {
    // If search is empty, navigate without search query
    router.push({
      path: '/events',
      query: {
        ...(route.query.status && { status: route.query.status })
      }
    })
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  router.push({
    path: '/events',
    query: {
      ...(route.query.status && { status: route.query.status })
    }
  })
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value && notifications.value.length === 0) {
    refreshNotifications()
  }
}

const refreshNotifications = async () => {
  try {
    loadingNotifications.value = true
    currentPage.value = 1
    console.log('[APP_HEADER] Loading notifications...')
    const response: any = await getNotifications({
      page: currentPage.value,
      limit: pageSize,
      relations: true
    })
    console.log('[APP_HEADER] API Response:', response)
    
    // $fetch trả về data trực tiếp, không có wrapper response.data.value
    const result = response
    console.log('[APP_HEADER] Result:', result)
    console.log('[APP_HEADER] Result.data:', result?.data)
    console.log('[APP_HEADER] Result.pagination:', result?.pagination)
    
    notifications.value = result?.data || []
    console.log('[APP_HEADER] Notifications set:', notifications.value.length, 'items')
    
    const pagination = result?.pagination
    hasMore.value = pagination ? pagination.page < pagination.totalPages : false
    console.log('[APP_HEADER] Has more:', hasMore.value)
  } catch (error) {
    console.error('[APP_HEADER] Error loading notifications:', error)
  } finally {
    loadingNotifications.value = false
  }
}

const unreadCount = computed(
  () => notifications.value.filter(n => !readNotificationIds.value.includes(n.id)).length,
)

const sortedNotifications = computed(() => {
  const unread = notifications.value.filter(n => !readNotificationIds.value.includes(n.id))
  const read = notifications.value.filter(n => readNotificationIds.value.includes(n.id))
  return [...unread, ...read]
})

const formatEventTime = (start?: string | Date, end?: string | Date) => {
  if (!start || !end) return ''
  const startDate = new Date(start)
  const endDate = new Date(end)
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const fmt = (d: Date) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`
  return `${fmt(startDate)} - ${fmt(endDate)}`
}

const loadMoreNotifications = async () => {
  try {
    if (!hasMore.value || loadingNotifications.value) return
    loadingNotifications.value = true
    const nextPage = currentPage.value + 1
    console.log('[APP_HEADER] Loading more notifications, page:', nextPage)
    const response: any = await getNotifications({
      page: nextPage,
      limit: pageSize,
      relations: true
    })
    console.log('[APP_HEADER] Load more response:', response)
    
    // $fetch trả về data trực tiếp, không có wrapper response.data.value
    const result = response
    const data = result?.data || []
    console.log('[APP_HEADER] Load more data:', data.length, 'items')
    
    notifications.value = [...notifications.value, ...data]
    const pagination = result?.pagination
    currentPage.value = pagination?.page || nextPage
    hasMore.value = pagination ? pagination.page < pagination.totalPages : data.length === pageSize
    console.log('[APP_HEADER] Total notifications now:', notifications.value.length)
  } catch (error) {
    console.error('[APP_HEADER] Error loading more notifications:', error)
  } finally {
    loadingNotifications.value = false
  }
}

const handleNotificationClick = async (item: any) => {
  try {
    // Đánh dấu thông báo là đã đọc (cho tất cả receiver liên quan)
    await markAllAsReadByNotification(item.id)
    if (!readNotificationIds.value.includes(item.id)) {
      readNotificationIds.value.push(item.id)
    }
    // Điều hướng sang trang chi tiết sự kiện
    const eventId = item.event?.id || item.event_id
    if (eventId) {
      showNotifications.value = false
      router.push(`/events/${eventId}`)
    }
  } catch (error) {
    console.error('Error handling notification click:', error)
  }
}

// Setup Socket.IO notification listener
let notificationCleanup: (() => void) | null = null

onMounted(() => {
  console.log('[APP_HEADER] Component mounted, setting up Socket.IO listener...')
  console.log('[APP_HEADER] Socket connected:', isConnected.value)
  
  // Load ban đầu 1 lần (có thể bỏ nếu muốn chỉ load khi user bấm chuông)
  refreshNotifications()
  
  // Setup Socket.IO notification listener
  notificationCleanup = onSocketNotification((notification: any) => {
    console.log('[APP_HEADER] 🔔 Received notification via Socket.IO!')
    console.log('[APP_HEADER] Notification:', JSON.stringify(notification, null, 2))
    
    // Kiểm tra xem đây có phải notification mới không
    const existingIndex = notifications.value.findIndex(n => n.id === notification.id)
    const isNewNotification = existingIndex === -1
    
    if (isNewNotification) {
      // Notification mới - hiển thị toast và reload
      toast.add({
        severity: 'info',
        summary: 'Thông báo mới',
        detail: notification.title || notification.message || 'Bạn có thông báo mới',
        life: 5000,
        closable: true,
      })
      console.log('[APP_HEADER] ✅ New notification - showing toast and reloading')
    } else {
      // Notification đã tồn tại - chỉ cập nhật
      notifications.value[existingIndex] = notification
      console.log('[APP_HEADER] ✅ Updated existing notification')
    }
    
    // Tự động reload notifications để lấy đầy đủ thông tin (event, organizerUnit, etc.)
    // và đảm bảo danh sách được cập nhật
    refreshNotifications()
  })
  
  console.log('[APP_HEADER] ✅ Socket.IO notification listener registered')
})

onBeforeUnmount(() => {
  console.log('[APP_HEADER] Component unmounting, cleaning up Socket.IO listener...')
  if (notificationCleanup) {
    notificationCleanup()
    notificationCleanup = null
    console.log('[APP_HEADER] ✅ Socket.IO listener cleaned up')
  }
})
</script>

<style scoped>
/* Notifications Modal Styles */
:deep(.notifications-modal .p-dialog) {
  margin: 1rem;
}

:deep(.notifications-modal .p-dialog-content) {
  padding: 0;
  overflow: hidden;
}

.notifications-content {
  min-height: 200px;
  max-height: 70vh;
}

/* Mobile responsive */
@media (max-width: 640px) {
  :deep(.notifications-modal .p-dialog) {
    width: calc(100vw - 2rem) !important;
    max-width: calc(100vw - 2rem) !important;
    margin: 1rem;
  }
  
  :deep(.notifications-modal .p-dialog-header) {
    padding: 1rem;
  }
  
  .notifications-content {
    max-height: calc(100vh - 200px);
  }
}
</style>
