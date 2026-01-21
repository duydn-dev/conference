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
    <Card class="w-full">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-chart-bar text-sky-600 text-lg"></i>
          <span>Sự kiện được tạo theo tháng</span>
        </div>
      </template>
      <template #content>
        <div class="w-full">
          <ClientOnly>
            <apexchart
              type="bar"
              :options="eventsMonthlyOptions"
              :series="eventsMonthlySeries"
              height="350"
              width="100%"
            />
          </ClientOnly>
        </div>
      </template>
    </Card>

    <!-- Recent Events Table - Full Width -->
    <!-- <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="mb-6 flex items-center gap-2">
        <i class="pi pi-list text-sky-600 text-lg"></i>
        <h2 class="text-lg font-semibold text-gray-800">Sự kiện gần đây</h2>
      </div>
      <div>
        <DataTable :value="recentEvents" :paginator="true" :rows="5" class="p-datatable-sm mobile-table" :stripedRows="true">
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
    </div> -->

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Events by Status Chart -->
      <Card class="w-full">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-pie text-sky-600 text-lg"></i>
            <span>Sự kiện theo trạng thái</span>
          </div>
        </template>
        <template #content>
          <ClientOnly>
            <apexchart
              type="donut"
              :options="eventsByStatusOptions"
              :series="eventsByStatusSeries"
              height="350"
              width="100%"
            />
          </ClientOnly>
        </template>
      </Card>
      
      <!-- Participants Over Time -->
      <Card class="w-full">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-line text-sky-600 text-lg"></i>
            <span>Người tham gia theo thời gian</span>
          </div>
        </template>
        <template #content>
          <ClientOnly>
            <apexchart
              type="area"
              :options="participantsOverTimeOptions"
              :series="participantsOverTimeSeries"
              width="100%"
            />
          </ClientOnly>
        </template>
      </Card>

      <!-- Top Organizer Units -->
      <Card class="w-full">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-trophy text-sky-600 text-lg"></i>
            <span>Đơn vị tổ chức hàng đầu</span>
          </div>
        </template>
        <template #content>
          <ClientOnly>
            <apexchart
              type="bar"
              :options="topOrganizersOptions"
              :series="topOrganizersSeries"
              height="350"
              width="100%"
            />
          </ClientOnly>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDashboard } from '~/composables/useDashboard'
import { formatDateLong } from '~/utils/helpers'
import { EventStatus, EventStatusLabels } from '~/types/event'

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
    if (eventsMonthlyData) {
      eventsMonthlyOptions.value.xaxis.categories = eventsMonthlyData.categories as any
      eventsMonthlySeries.value = eventsMonthlyData.series || []
    }

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

    // Load recent events
    const recentEventsData = await getRecentEvents() as any
    if (recentEventsData && recentEventsData.data) {
      recentEvents.value = recentEventsData.data
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* Mobile table styles */
@media (max-width: 768px) {
  :deep(.mobile-table .p-datatable-tbody > tr > td),
  :deep(.mobile-table .p-datatable-thead > tr > th) {
    white-space: nowrap;
  }
}
</style>
