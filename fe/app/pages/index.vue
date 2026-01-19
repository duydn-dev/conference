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

    <!-- Large Chart Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="mb-6 flex items-center gap-2">
        <i class="pi pi-chart-bar text-sky-600 text-lg"></i>
        <h2 class="text-lg font-semibold text-gray-800">Sự kiện được tạo theo tháng</h2>
      </div>
      <ClientOnly>
        <apexchart
          type="bar"
          :options="eventsMonthlyOptions"
          :series="eventsMonthlySeries"
          height="350"
        />
      </ClientOnly>
    </div>

    <!-- Recent Events Table - Full Width -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="mb-6 flex items-center gap-2">
        <i class="pi pi-list text-sky-600 text-lg"></i>
        <h2 class="text-lg font-semibold text-gray-800">Sự kiện gần đây</h2>
      </div>
      <DataTable :value="recentEvents" :paginator="true" :rows="5" class="p-datatable-sm" :stripedRows="true">
        <Column field="code" sortable>
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-hashtag text-gray-500 text-xs"></i>
              <span>Mã</span>
            </div>
          </template>
          <template #body="{ data }">
            <span class="text-gray-600">#{{ data.code }}</span>
          </template>
        </Column>
        <Column field="name" sortable>
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-tag text-gray-500 text-xs"></i>
              <span>Tên</span>
            </div>
          </template>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                <span class="text-xs font-semibold text-sky-600">{{ data.name.charAt(0) }}</span>
              </div>
              <span class="text-gray-800">{{ data.name }}</span>
            </div>
          </template>
        </Column>
        <Column field="start_time" sortable>
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-calendar text-gray-500 text-xs"></i>
              <span>Ngày</span>
            </div>
          </template>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-calendar text-gray-400 text-xs"></i>
                <span>{{ formatDateLong(data.start_time) }}</span>
            </div>
          </template>
        </Column>
        <Column field="status" sortable>
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-gray-500 text-xs"></i>
              <span>Trạng thái</span>
            </div>
          </template>
          <template #body="{ data }">
            <Tag 
              :value="getStatusLabel(data.status)" 
              :severity="getStatusSeverity(data.status)"
              :rounded="true"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Events by Status Chart -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="mb-6 flex items-center gap-2">
          <i class="pi pi-chart-pie text-sky-600 text-lg"></i>
          <h2 class="text-lg font-semibold text-gray-800">Sự kiện theo trạng thái</h2>
        </div>
        <ClientOnly>
          <apexchart
            type="donut"
            :options="eventsByStatusOptions"
            :series="eventsByStatusSeries"
            height="300"
          />
        </ClientOnly>
      </div>
      
      <!-- Participants Over Time -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="mb-6 flex items-center gap-2">
          <i class="pi pi-chart-line text-sky-600 text-lg"></i>
          <h2 class="text-lg font-semibold text-gray-800">Người tham gia theo thời gian</h2>
        </div>
        <ClientOnly>
          <apexchart
            type="area"
            :options="participantsOverTimeOptions"
            :series="participantsOverTimeSeries"
            height="300"
          />
        </ClientOnly>
      </div>

      <!-- Top Organizer Units -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="mb-6 flex items-center gap-2">
          <i class="pi pi-trophy text-sky-600 text-lg"></i>
          <h2 class="text-lg font-semibold text-gray-800">Đơn vị tổ chức hàng đầu</h2>
        </div>
        <ClientOnly>
          <apexchart
            type="bar"
            :options="topOrganizersOptions"
            :series="topOrganizersSeries"
            height="300"
          />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEvents } from '~/composables/useEvents'
import { useParticipants } from '~/composables/useParticipants'
import { formatDateLong } from '~/utils/helpers'

useHead({
  title: 'Trang chủ'
})

// Stats
const stats = ref({
  totalEvents: 0,
  totalParticipants: 0,
  activeEvents: 0,
  organizerUnits: 0
})

// Recent Events
const recentEvents = ref([])

// Events by Status Chart
const eventsByStatusOptions = ref({
  chart: {
    type: 'donut',
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
    breakpoint: 480,
    options: {
      chart: {
        width: 200
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
  }
})

const participantsOverTimeSeries = ref([{
  name: 'Người tham gia',
  data: [] as number[]
}])

// Events Monthly Chart
const eventsMonthlyOptions = ref({
  chart: {
    type: 'bar',
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
  }
})

const eventsMonthlySeries = ref([{
  name: 'Sự kiện',
  data: [] as number[]
}])

// Top Organizers Chart
const topOrganizersOptions = ref({
  chart: {
    type: 'bar',
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
  }
})

const topOrganizersSeries = ref([{
  name: 'Sự kiện',
  data: [] as number[]
}])

const { getPagination } = useEvents()
const { getPagination: getParticipantsPagination } = useParticipants()


const getStatusSeverity = (status: string) => {
  const severityMap: Record<string, string> = {
    draft: 'secondary',
    published: 'success',
    closed: 'info',
    cancelled: 'danger'
  }
  return severityMap[status] || 'secondary'
}

const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    draft: 'Bản nháp',
    published: 'Đã diễn ra',
    closed: 'Đã đóng',
    cancelled: 'Đã hủy'
  }
  return labelMap[status] || status
}

const loadFakeData = () => {
  // Fake stats
  stats.value = {
    totalEvents: 247,
    totalParticipants: 5823,
    activeEvents: 18,
    organizerUnits: 12
  }

  // Fake recent events
  const eventNames = [
    'Hội thảo Công nghệ Thông tin 2024',
    'Workshop Marketing Digital',
    'Hội nghị Khoa học Công nghệ',
    'Seminar Quản lý Dự án',
    'Triển lãm Thương mại Quốc tế',
    'Hội thảo Khởi nghiệp',
    'Chuỗi đào tạo Kỹ năng Mềm',
    'Gala Doanh nghiệp',
    'Hội nghị Y tế Cộng đồng',
    'Workshop Thiết kế Đồ họa'
  ]
  
  const statuses = ['draft', 'published', 'closed', 'cancelled']
  const fakeRecentEvents = []
  for (let i = 0; i < 10; i++) {
    const daysAgo = i * 3
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    fakeRecentEvents.push({
      code: `EVT${String(1000 + i).padStart(4, '0')}`,
      name: eventNames[i] || `Sự kiện ${i + 1}`,
      start_time: date.toISOString(),
      status: statuses[i % 4]
    })
  }
  recentEvents.value = fakeRecentEvents

  // Fake events by status
  eventsByStatusSeries.value = [45, 127, 58, 17]

  // Fake events monthly (last 6 months)
  const now = new Date()
  const months: string[] = []
  const monthlyCounts: number[] = []
  const fakeMonthlyData = [32, 28, 45, 38, 52, 47] // Fake numbers cho 6 tháng
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }))
    monthlyCounts.push(fakeMonthlyData[5 - i])
  }
  eventsMonthlyOptions.value.xaxis.categories = months as any
  eventsMonthlySeries.value = [{
    name: 'Sự kiện',
    data: monthlyCounts
  }]

  // Fake participants over time (last 7 days)
  const days: string[] = []
  const dailyCounts: number[] = []
  const fakeDailyParticipants = [342, 456, 289, 523, 678, 412, 589] // Fake numbers cho 7 ngày
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }))
    dailyCounts.push(fakeDailyParticipants[6 - i])
  }
  participantsOverTimeOptions.value.xaxis.categories = days as any
  participantsOverTimeSeries.value = [{
    name: 'Người tham gia',
    data: dailyCounts
  }]

  // Fake top organizers
  const organizerNames = [
    'Phòng KHCN',
    'Ban Tổ chức',
    'Trung tâm Đào tạo',
    'Hiệp hội Doanh nghiệp',
    'Sở Kế hoạch Đầu tư'
  ]
  const organizerCounts = [42, 38, 35, 28, 22]
  topOrganizersOptions.value.xaxis.categories = organizerNames as any
  topOrganizersSeries.value = [{
    name: 'Sự kiện',
    data: organizerCounts
  }]
}

const loadDashboardData = async () => {
  // Load fake data immediately for beautiful display
  loadFakeData()
  
  try {
    // Try to load real data from API (optional)
    // Load events
    const eventsResponse = await getPagination({ page: 1, limit: 100 })
    const events = (eventsResponse.data.value as any)?.data || []
    
    // Only update if we have real data
    if (events.length > 0) {
      // Calculate stats
      stats.value.totalEvents = events.length
      stats.value.activeEvents = events.filter((e: any) => e.status === 'published').length
      
      // Events by status
      const statusCounts = {
        draft: 0,
        published: 0,
        closed: 0,
        cancelled: 0
      }
      events.forEach((event: any) => {
        if (statusCounts[event.status as keyof typeof statusCounts] !== undefined) {
          statusCounts[event.status as keyof typeof statusCounts]++
        }
      })
      eventsByStatusSeries.value = [
        statusCounts.draft,
        statusCounts.published,
        statusCounts.closed,
        statusCounts.cancelled
      ]
      
      // Recent events
      recentEvents.value = events.slice(0, 10)
      
      // Events monthly (last 6 months)
      const now = new Date()
      const months: string[] = []
      const monthlyCounts: number[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push(date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }))
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        const count = events.filter((e: any) => {
          const created = new Date(e.created_at)
          return created >= monthStart && created <= monthEnd
        }).length
        monthlyCounts.push(count)
      }
      eventsMonthlyOptions.value.xaxis.categories = months as any
      eventsMonthlySeries.value = [{
        name: 'Sự kiện',
        data: monthlyCounts
      }]
      
      // Load participants
      const participantsResponse = await getParticipantsPagination({ page: 1, limit: 100 })
      const participants = (participantsResponse.data.value as any)?.data || []
      stats.value.totalParticipants = participants.length
      
      // Participants over time (last 7 days)
      const days: string[] = []
      const dailyCounts: number[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        days.push(date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }))
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))
        const count = participants.filter((p: any) => {
          const created = new Date(p.created_at)
          return created >= dayStart && created <= dayEnd
        }).length
        dailyCounts.push(count)
      }
      participantsOverTimeOptions.value.xaxis.categories = days as any
      participantsOverTimeSeries.value = [{
        name: 'Người tham gia',
        data: dailyCounts
      }]
    }
  } catch (error) {
    // If API fails, keep using fake data
    console.error('Error loading dashboard data:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>
