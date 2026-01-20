<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="flex items-center justify-between px-6 py-4">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <img src="/imgs/ihanoi.png" alt="Logo" class="h-10 w-auto" />
        <span class="text-xl font-bold text-gray-800">Conference</span>
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
          <!-- Notifications dropdown -->
          <div class="relative">
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

            <!-- Dropdown panel -->
            <div
              v-if="showNotifications"
              class="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
            >
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span class="font-semibold text-gray-800 text-sm">Thông báo</span>
                <button
                  class="text-xs text-sky-600 hover:underline"
                  type="button"
                  @click="refreshNotifications"
                >
                  Làm mới
                </button>
              </div>

              <div class="max-h-80 overflow-y-auto">
                <template v-if="loadingNotifications">
                  <div class="px-4 py-6 text-center text-gray-400 text-sm">
                    <i class="pi pi-spin pi-spinner mr-2" />
                    Đang tải thông báo...
                  </div>
                </template>
                <template v-else-if="notifications.length === 0">
                  <div class="px-4 py-6 text-center text-gray-400 text-sm">
                    Chưa có thông báo nào
                  </div>
                </template>
                <template v-else>
                  <ul class="divide-y divide-gray-100">
                    <li
                      v-for="item in sortedNotifications"
                      :key="item.id"
                      class="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      @click="handleNotificationClick(item)"
                    >
                      <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-800">
                          {{ item.event?.name || item.title }}
                        </span>
                        <span class="text-xs text-gray-500 mt-0.5">
                          {{ formatEventTime(item.event?.start_time, item.event?.end_time) }}
                        </span>
                        <span
                          v-if="item.event?.organizerUnit?.name"
                          class="text-xs text-gray-500 mt-0.5"
                        >
                          Đơn vị tổ chức: {{ item.event.organizerUnit.name }}
                        </span>
                      </div>
                    </li>
                  </ul>
                  <button
                    v-if="hasMore && !loadingNotifications"
                    type="button"
                    class="w-full text-center text-xs text-sky-600 hover:bg-gray-50 py-2 border-t border-gray-100"
                    @click.stop="loadMoreNotifications"
                  >
                    Xem thêm
                  </button>
                </template>
              </div>
            </div>
          </div>

          <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <i class="pi pi-cog text-gray-600"></i>
          </button>
          <div class="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
            <i class="pi pi-user text-sky-600 text-sm"></i>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotifications } from '~/composables/useNotifications'
import { useNotificationReceivers } from '~/composables/useNotificationReceivers'
import type { Notification } from '~/types/notification'

const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const showNotifications = ref(false)
const loadingNotifications = ref(false)
const notifications = ref<any[]>([])
const readNotificationIds = ref<string[]>([])
const currentPage = ref(1)
const pageSize = 10
const hasMore = ref(true)

const { getPagination: getNotifications } = useNotifications()
const { markAllAsReadByNotification } = useNotificationReceivers()

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
    const response = await getNotifications({
      page: currentPage.value,
      limit: pageSize,
      relations: true
    })
    const result = (response.data.value as any)
    notifications.value = result?.data || []
    const pagination = result?.pagination
    hasMore.value = pagination ? pagination.page < pagination.totalPages : false
  } catch (error) {
    console.error('Error loading notifications:', error)
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
    const response = await getNotifications({
      page: nextPage,
      limit: pageSize,
      relations: true
    })
    const result = (response.data.value as any)
    const data = result?.data || []
    notifications.value = [...notifications.value, ...data]
    const pagination = result?.pagination
    currentPage.value = pagination?.page || nextPage
    hasMore.value = pagination ? pagination.page < pagination.totalPages : data.length === pageSize
  } catch (error) {
    console.error('Error loading more notifications:', error)
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

onMounted(() => {
  // Load ban đầu 1 lần (có thể bỏ nếu muốn chỉ load khi user bấm chuông)
  refreshNotifications()
})
</script>
