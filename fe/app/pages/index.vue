<template>
  <div class="space-y-6">
    <!-- Stats Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Primary - Tổng sự kiện -->
      <div class="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Tổng sự kiện</p>
            <p class="text-2xl font-bold text-blue-700">{{ stats.totalEvents }}</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-3">
            <i class="pi pi-calendar text-xl text-blue-600"></i>
          </div>
        </div>
      </div>

      <!-- Info - Tổng người tham gia -->
      <div class="bg-white rounded-lg shadow-sm border border-cyan-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Tổng người tham gia</p>
            <p class="text-2xl font-bold text-cyan-700">{{ stats.totalParticipants }}</p>
          </div>
          <div class="bg-cyan-50 rounded-lg p-3">
            <i class="pi pi-users text-xl text-cyan-600"></i>
          </div>
        </div>
      </div>

      <!-- Success - Sự kiện đang hoạt động -->
      <div class="bg-white rounded-lg shadow-sm border border-green-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Sự kiện đã diễn ra</p>
            <p class="text-2xl font-bold text-green-700">{{ stats.activeEvents }}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-3">
            <i class="pi pi-check-circle text-xl text-green-600"></i>
          </div>
        </div>
      </div>

      <!-- Warning - Sự kiện sắp diễn ra -->
      <div class="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Sự kiện sắp diễn ra</p>
            <p class="text-2xl font-bold text-amber-700">{{ stats.organizerUnits }}</p>
          </div>
          <div class="bg-amber-50 rounded-lg p-3">
            <i class="pi pi-clock text-xl text-amber-600"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Events Carousel -->
    <div class="bg-white p-3 sm:p-4 shadow-sm rounded overflow-hidden">
      <div class="flex items-center gap-2 mb-4">
        <i class="pi pi-chart-bar text-sky-600 text-lg"></i>
        <span>Sự kiện sắp diễn ra</span>
      </div>

      <!-- Carousel Container -->
      <div class="relative -mx-3 sm:mx-0">
        <!-- Carousel Wrapper -->
        <div class="overflow-hidden">
          <div class="flex transition-transform duration-300 ease-in-out"
            :style="{ transform: `translateX(-${currentSlide * slideWidth}%)` }">
            <div v-for="(event, index) in recentEvents" :key="event.code"
              class="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 px-2 sm:px-3">
              <NuxtLink :to="`/events/${event.id}`"
                class="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-sky-300 transition-all duration-300 cursor-pointer group h-full">
                <!-- Event Avatar/Image -->
                <div class="relative h-52 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 overflow-hidden">
                  <img v-if="event.avatar" :src="getFullUrl(event.avatar)" :alt="event.name"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <div
                      class="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                      <span class="text-4xl font-bold text-white">{{ event.name?.charAt(0)?.toUpperCase() || 'E'
                        }}</span>
                    </div>
                  </div>

                  <!-- Gradient Overlay -->
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  </div>

                  <!-- Status Badge Overlay -->
                  <div class="absolute top-3 right-3 z-10">
                    <span
                      class="text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md text-white bg-red-500/80 shadow-lg">
                      {{ formatTimeDifferenceCustom(event.start_time, event.end_time) }}
                    </span>
                  </div>

                  <!-- Event Code Overlay -->
                  <div class="absolute top-3 left-3 z-10">
                    <span
                      class="bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                      #{{ event.code }}
                    </span>
                  </div>
                </div>

                <!-- Event Content -->
                <div class="hidden sm:block p-4 sm:p-5 slide-content">
                  <!-- Event Name -->
                  <div
                    class="text-gray-900 font-bold text-base sm:text-lg mb-3 line-clamp-2 min-h-[3rem] sm:min-h-[3.5rem] group-hover:text-sky-600 transition-colors duration-300 break-words">
                    {{ event.name }}
                  </div>

                  <!-- Event Date -->
                  <div class="flex items-center gap-2 text-gray-600 mb-2">
                    <i class="pi pi-calendar text-sky-500 flex-shrink-0"></i>
                    <span class="text-xs sm:text-sm font-medium break-words">{{ formatDateTime(event.start_time)
                      }}</span>
                  </div>

                  <!-- View More Indicator -->
                  <div
                    class="flex items-center gap-2 text-sky-600 text-xs sm:text-sm font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Xem chi tiết</span>
                    <i class="pi pi-arrow-right text-xs"></i>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <button v-if="recentEvents.length > itemsPerSlide" @click="previousSlide" :disabled="currentSlide === 0"
          class="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all z-10"
          :class="{ 'opacity-0': currentSlide === 0 }">
          <i class="pi pi-chevron-left text-gray-600"></i>
        </button>
        <button v-if="recentEvents.length > itemsPerSlide" @click="nextSlide" :disabled="currentSlide >= maxSlide"
          class="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all z-10"
          :class="{ 'opacity-0': currentSlide >= maxSlide }">
          <i class="pi pi-chevron-right text-gray-600"></i>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="recentEvents.length === 0" class="text-center py-8 text-gray-500">
        Không có dữ liệu
      </div>
    </div>

    <!-- Large Chart Section -->
    <div class="bg-white p-3 shadow-sm rounded">
      <div class="flex items-center gap-2">
        <i class="pi pi-chart-bar text-sky-600 text-lg"></i>
        <span>Sự kiện trong năm</span>
      </div>
      <apexchart type="bar" :options="eventsMonthlyOptions" :series="eventsMonthlySeries" height="350" width="100%" />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Events by Status Chart -->

      <div class="bg-white p-3 shadow-sm rounded">
        <div class="flex items-center gap-2">
          <i class="pi pi-chart-pie text-sky-600 text-lg"></i>
          <span>Sự kiện theo trạng thái</span>
        </div>
        <apexchart type="donut" :options="eventsByStatusOptions" :series="eventsByStatusSeries" height="350"
          width="100%" />
      </div>

      <!-- Participants Over Time -->
      <div class="bg-white p-3 shadow-sm rounded">
        <div class="flex items-center gap-2">
          <i class="pi pi-chart-line text-sky-600 text-lg"></i>
          <span>Người tham gia theo thời gian</span>
        </div>
        <apexchart type="area" :options="participantsOverTimeOptions" :series="participantsOverTimeSeries"
          width="100%" />
      </div>

      <!-- Top Organizer Units -->
      <div class="bg-white p-3 shadow-sm rounded">
        <div class="flex items-center gap-2">
          <i class="pi pi-trophy text-sky-600 text-lg"></i>
          <span>Đơn vị tổ chức hàng đầu</span>
        </div>
        <apexchart type="bar" :options="topOrganizersOptions" :series="topOrganizersSeries" height="350" width="100%" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useDashboard } from '~/composables/useDashboard'
import { formatDateLong, formatDateTime, formatTimeDifferenceCustom } from '~/utils/helpers'
import { EventStatus, EventStatusLabels } from '~/types/event'

useHead({
  title: 'Trang chủ'
})
definePageMeta({
  middleware: ['auth']
})
// Stats
const stats = ref({
  totalEvents: 0,
  totalParticipants: 0,
  activeEvents: 0,
  organizerUnits: 0
})

// Recent Events
interface EventItem {
  id: string,
  code: string
  name: string
  avatar?: string | null
  start_time: string
  end_time: string
  status: number
}

const recentEvents = ref<EventItem[]>([])

// File URL helper
const { getFullUrl } = useFileUrl()

// Carousel state
const currentSlide = ref(0)
const isMobile = ref(false)

// Check if mobile
const checkMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 768
  }
}

// Items per slide (1 for mobile, 3 for desktop)
const itemsPerSlide = computed(() => isMobile.value ? 1 : 3)

// Slide width percentage (100% for mobile, 33.333% for desktop)
const slideWidth = computed(() => isMobile.value ? 100 : 33.333)

// Max slide index
const maxSlide = computed(() => {
  if (recentEvents.value.length <= itemsPerSlide.value) return 0
  return Math.ceil(recentEvents.value.length / itemsPerSlide.value) - 1
})

// Navigation functions
const nextSlide = () => {
  if (currentSlide.value < maxSlide.value) {
    currentSlide.value++
  }
}

const previousSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

// Auto-play carousel (optional)
let autoPlayInterval: NodeJS.Timeout | null = null

const startAutoPlay = () => {
  if (recentEvents.value.length > itemsPerSlide.value) {
    autoPlayInterval = setInterval(() => {
      if (currentSlide.value >= maxSlide.value) {
        currentSlide.value = 0
      } else {
        currentSlide.value++
      }
    }, 5000) // Change slide every 5 seconds
  }
}

const stopAutoPlay = () => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
    autoPlayInterval = null
  }
}

// Handle window resize
const handleResize = () => {
  checkMobile()
  currentSlide.value = 0 // Reset to first slide on resize
}

// Events by Status Chart
const eventsByStatusOptions = ref({
  chart: {
    type: 'donut',
    width: '100%',
  },
  labels: ['Bản nháp', 'Đã diễn ra', 'Đã đóng', 'Đã hủy'],
  colors: ['#bae6fd', '#0ea5e9', '#0284c7', '#0369a1'],
  legend: {
    position: 'bottom'
  },
  plotOptions: {
    pie: {
      donut: {
        size: '70%'
      }
    }
  },
  responsive: [{
    breakpoint: 768,
    options: {
      chart: {
        width: '100%'
      },
      legend: {
        position: 'bottom'
      }
    }
  }, {
    breakpoint: 480,
    options: {
      chart: {
        width: '100%'
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
})

const eventsByStatusSeries = ref([0, 0, 0, 0])

// Participants Over Time Chart
const participantsOverTimeOptions = ref({
  chart: {
    type: 'area',
    width: '100%',
    toolbar: {
      show: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth',
    width: 3,
    colors: ['#0ea5e9']
  },
  xaxis: {
    categories: [] as string[]
  },
  colors: ['#0ea5e9'],
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'vertical',
      shadeIntensity: 0.5,
      gradientToColors: ['#38bdf8'],
      inverseColors: false,
      opacityFrom: 0.8,
      opacityTo: 0.2,
      stops: [0, 100]
    }
  },
  tooltip: {
    theme: 'light'
  },
  grid: {
    borderColor: '#f1f5f9',
    strokeDashArray: 4
  },
  responsive: [{
    breakpoint: 768,
    options: {
      chart: {
        width: '100%'
      }
    }
  }, {
    breakpoint: 480,
    options: {
      chart: {
        width: '100%'
      }
    }
  }]
})

const participantsOverTimeSeries = ref([{
  name: 'Người tham gia',
  data: [] as number[]
}])

// Events Monthly Chart
const eventsMonthlyOptions = ref({
  chart: {
    type: 'bar',
    height: '300',
    width: '100%',
    toolbar: {
      show: false
    },
    stacked: true
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '60%',
      borderRadius: 4,
    }
  },
  dataLabels: {
    enabled: false
  },
  xaxis: {
    categories: [] as string[]
  },
  colors: ['#0ea5e9', '#38bdf8', '#7dd3fc'],
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'vertical',
      shadeIntensity: 0.5,
      gradientToColors: ['#38bdf8', '#7dd3fc', '#bae6fd'],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 0.8,
      stops: [0, 100]
    }
  },
  tooltip: {
    theme: 'light'
  },
  grid: {
    borderColor: '#f1f5f9',
    strokeDashArray: 4
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right'
  },
  responsive: [{
    breakpoint: 768,
    options: {
      chart: {
        width: '100%'
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center'
      },
      plotOptions: {
        bar: {
          columnWidth: '50%'
        }
      }
    }
  }, {
    breakpoint: 480,
    options: {
      chart: {
        width: '100%'
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center'
      },
      plotOptions: {
        bar: {
          columnWidth: '40%'
        }
      },
      xaxis: {
        labels: {
          rotate: -45,
          rotateAlways: true
        }
      }
    }
  }]
})

const eventsMonthlySeries = ref([{
  name: 'Sự kiện',
  data: [] as number[]
}])

// Top Organizers Chart
const topOrganizersOptions = ref({
  chart: {
    type: 'bar',
    width: '100%',
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
    }
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: ['#fff'],
      fontSize: '12px',
      fontWeight: 600
    }
  },
  xaxis: {
    categories: [] as string[]
  },
  colors: ['#0284c7'],
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'horizontal',
      shadeIntensity: 0.5,
      gradientToColors: ['#0ea5e9'],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 0.8,
      stops: [0, 100]
    }
  },
  tooltip: {
    theme: 'light'
  },
  grid: {
    borderColor: '#f1f5f9',
    strokeDashArray: 4
  },
  responsive: [{
    breakpoint: 768,
    options: {
      chart: {
        width: '100%'
      }
    }
  }, {
    breakpoint: 480,
    options: {
      chart: {
        width: '100%'
      }
    }
  }]
})

const topOrganizersSeries = ref([{
  name: 'Sự kiện',
  data: [] as number[]
}])

const {
  getStats,
  getEventsByStatus,
  getEventsMonthly,
  getParticipantsOverTime,
  getTopOrganizers,
  getRecentEvents
} = useDashboard()

const getStatusSeverity = (status: EventStatus | number) => {
  const map: Record<number, string> = {
    [EventStatus.DRAFT]: 'secondary',
    [EventStatus.PUBLISHED]: 'success',
    [EventStatus.CLOSED]: 'info',
    [EventStatus.CANCELLED]: 'danger'
  }
  return map[Number(status)] || 'secondary'
}

const getStatusLabel = (status: EventStatus | number) => {
  return EventStatusLabels[status as EventStatus] || 'Không xác định'
}

const loadDashboardData = async () => {
  try {
    // Load stats
    const statsData = await getStats() as any
    if (statsData) {
      stats.value = {
        totalEvents: statsData.totalEvents || 0,
        totalParticipants: statsData.totalParticipants || 0,
        activeEvents: statsData.activeEvents || 0,
        organizerUnits: statsData.organizerUnits || 0
      }
    }

    // Load events by status
    const eventsByStatusData = await getEventsByStatus() as any
    if (eventsByStatusData) {
      eventsByStatusSeries.value = eventsByStatusData.series || [0, 0, 0, 0]
    }

    // Load events monthly
    const eventsMonthlyData = await getEventsMonthly() as any

    // Tạo mảng 12 tháng cố định từ tháng 1 đến tháng 12
    const monthLabels = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

    // Khởi tạo mảng data với 12 phần tử = 0
    const monthlyData = new Array(12).fill(0)

    if (eventsMonthlyData) {
      // Xử lý dữ liệu từ API
      let apiData: number[] = []
      let apiCategories: string[] = []

      // Kiểm tra format của series
      if (Array.isArray(eventsMonthlyData.series)) {
        if (eventsMonthlyData.series.length > 0 && Array.isArray(eventsMonthlyData.series[0]?.data)) {
          // Format: { series: [{ data: [1, 2, 3] }], categories: [...] }
          apiData = eventsMonthlyData.series[0].data
          apiCategories = eventsMonthlyData.categories || []
        } else if (typeof eventsMonthlyData.series[0] === 'number') {
          // Format: { series: [1, 2, 3], categories: [...] }
          apiData = eventsMonthlyData.series
          apiCategories = eventsMonthlyData.categories || []
        }
      }

      // Map dữ liệu từ API vào đúng tháng
      apiCategories.forEach((category: string, index: number) => {
        // Parse category để lấy số tháng
        // Hỗ trợ các format: "2024-01", "01", "Tháng 1", "1"
        let monthIndex = -1

        // Format: "2024-01" hoặc "2024-1"
        const yearMonthMatch = category.match(/-(\d{1,2})$/)?.[1]
        if (yearMonthMatch) {
          monthIndex = parseInt(yearMonthMatch, 10) - 1
        } else {
          // Format: "01", "1", "Tháng 1"
          const monthMatch = category.match(/(\d{1,2})/)?.[1]
          if (monthMatch) {
            monthIndex = parseInt(monthMatch, 10) - 1
          }
        }

        if (monthIndex >= 0 && monthIndex < 12 && apiData[index] !== undefined) {
          monthlyData[monthIndex] = apiData[index] || 0
        }
      })
    }

    // Set categories và series - luôn có 12 tháng
    eventsMonthlyOptions.value.xaxis.categories = monthLabels
    eventsMonthlySeries.value = [{
      name: 'Sự kiện',
      data: monthlyData
    }]

    // Load participants over time
    const participantsOverTimeData = await getParticipantsOverTime() as any
    if (participantsOverTimeData) {
      participantsOverTimeOptions.value.xaxis.categories = participantsOverTimeData.categories as any
      participantsOverTimeSeries.value = participantsOverTimeData.series || []
    }

    // Load top organizers
    const topOrganizersData = await getTopOrganizers() as any
    if (topOrganizersData) {
      topOrganizersOptions.value.xaxis.categories = topOrganizersData.categories as any
      topOrganizersSeries.value = topOrganizersData.series || []
    }

    // Load recent events with pageIndex=1, pageSize=20
    const recentEventsData = await (getRecentEvents as (pageIndex: number, pageSize: number) => Promise<any>)(1, 20)
    console.log('[INDEX] Recent events data:', recentEventsData)
    if (recentEventsData && recentEventsData.data) {
      // Sort events: upcoming events first, then past events
      const now = new Date().getTime()
      const sortedEvents = [...(recentEventsData.data as EventItem[])].sort((a: EventItem, b: EventItem) => {
        const endTimeA = new Date(a.end_time).getTime()
        const endTimeB = new Date(b.end_time).getTime()
        const startTimeA = new Date(a.start_time).getTime()
        const startTimeB = new Date(b.start_time).getTime()
        
        // Check if events are upcoming (not ended yet)
        const isAUpcoming = endTimeA > now
        const isBUpcoming = endTimeB > now
        
        // Upcoming events come first
        if (isAUpcoming && !isBUpcoming) return -1
        if (!isAUpcoming && isBUpcoming) return 1
        
        // If both are upcoming, sort by start_time ascending (earliest first)
        if (isAUpcoming && isBUpcoming) {
          return startTimeA - startTimeB
        }
        
        // If both are past, sort by end_time descending (most recent first)
        return endTimeB - endTimeA
      })
      recentEvents.value = sortedEvents
      console.log('[INDEX] Recent events set:', recentEvents.value.length, 'events')
      console.log('[INDEX] Recent events:', recentEvents.value)
    } else {
      console.warn('[INDEX] No recent events data found')
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
  loadDashboardData().then(() => {
    startAutoPlay()
  })
})

onUnmounted(() => {
  stopAutoPlay()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
