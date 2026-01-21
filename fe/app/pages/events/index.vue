<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Danh sách sự kiện</h1>
        <p class="text-gray-500 text-sm mt-1">Quản lý và theo dõi các sự kiện</p>
      </div>
      <Button 
        label="Thêm mới" 
        icon="pi pi-plus" 
        @click="navigateTo('/events/new')"
        class="bg-sky-500 hover:bg-sky-600"
      />
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="w-full md:max-w-[250px]">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText 
            v-model="searchQuery" 
            placeholder="Tìm kiếm sự kiện..." 
            class="w-full"
            @input="handleSearch"
          />
        </IconField>
      </div>
      <div class="w-full md:w-[250px]">
        <Dropdown 
          v-model="selectedStatus" 
          :options="statusOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Chọn trạng thái"
          class="w-full"
          @change="loadEvents"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div class="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div class="h-6 bg-gray-200 rounded mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>

    <!-- Events Grid -->
    <div v-else-if="events.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="event in events"
          :key="event.id"
          class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
          @click="navigateTo(`/events/${event.id}`)"
        >
          <!-- Event Image/Avatar -->
          <div class="relative h-48 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 overflow-hidden">
            <div class="absolute inset-0">
              <img 
                :src="event.avatar ? getFullUrl(event.avatar) : '/imgs/ihanoi.png'" 
                :alt="event.name"
                class="w-full h-full object-cover"
              />
            </div>
            
            <!-- Status Badge -->
            <div class="absolute top-4 right-4">
              <Tag 
                :value="getStatusLabel(event.status)" 
                :severity="getStatusSeverity(event.status)"
                :rounded="true"
                class="shadow-md"
              />
            </div>

            <!-- Event Code -->
            <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <span class="text-sm font-semibold text-gray-800">#{{ event.code }}</span>
            </div>

            <!-- Participant Count -->
            <div v-if="event.participants_count !== undefined" class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              <i class="pi pi-users text-sm text-gray-700"></i>
              <span class="text-sm font-semibold text-gray-800">{{ event.participants_count || 0 }}</span>
            </div>
          </div>

          <!-- Event Content -->
          <div class="p-6">
            <!-- Event Name -->
            <h3 class="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-sky-600 transition-colors">
              {{ event.name }}
            </h3>

            <!-- Description -->
            <p v-if="event.description" class="text-sm text-gray-600 mb-4 line-clamp-2">
              {{ event.description }}
            </p>

            <!-- Event Details -->
            <div class="space-y-3 mb-4">
              <!-- Date Range -->
              <div class="flex items-start gap-2">
                <div class="mt-0.5">
                  <i class="pi pi-calendar text-sky-500 text-sm"></i>
                </div>
                <div class="flex-1">
                  <div class="text-sm text-gray-700">
                    <div class="font-medium">{{ formatDateShort(event.start_time) }}</div>
                    <div class="text-xs text-gray-500">{{ formatDateTime(event.start_time).split(' ')[1] }} - {{ formatDateTime(event.end_time).split(' ')[1] }}</div>
                  </div>
                </div>
              </div>

              <!-- Location -->
              <div v-if="event.location_name" class="flex items-start gap-2">
                <div class="mt-0.5">
                  <i class="pi pi-map-marker text-sky-500 text-sm"></i>
                </div>
                <div class="flex-1">
                  <span class="text-sm text-gray-700">{{ event.location_name }}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
              <Button 
                icon="pi pi-eye" 
                label="Xem chi tiết"
                class="p-button-text p-button-sm text-sky-600 hover:text-sky-700"
                @click.stop="navigateTo(`/events/${event.id}`)"
              />
              <div class="flex items-center gap-2">
                <Button 
                  icon="pi pi-pencil" 
                  class="p-button-text p-button-sm p-button-rounded text-gray-600 hover:text-sky-600"
                  @click.stop="navigateTo(`/events/${event.id}/edit`)"
                  v-tooltip.top="'Chỉnh sửa'"
                />
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-text p-button-sm p-button-rounded text-gray-600 hover:text-red-600"
                  @click.stop="confirmDelete(event)"
                  v-tooltip.top="'Xóa'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between pt-4">
        <div class="text-sm text-gray-600">
          Hiển thị {{ (page - 1) * pageSize + 1 }} - {{ Math.min(page * pageSize, totalRecords) }} của {{ totalRecords }} sự kiện
        </div>
        <Paginator
          :first="(page - 1) * pageSize"
          :rows="pageSize"
          :totalRecords="totalRecords"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          @page="onPageChange"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <div class="flex flex-col items-center justify-center">
        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <i class="pi pi-calendar-times text-4xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Không tìm thấy sự kiện</h3>
        <p class="text-gray-600 mb-6">Chưa có sự kiện nào được tạo hoặc không khớp với bộ lọc của bạn</p>
        <Button 
          label="Thêm sự kiện mới" 
          icon="pi pi-plus" 
          @click="navigateTo('/events/new')"
          class="bg-sky-500 hover:bg-sky-600"
        />
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="deleteDialogVisible" 
      modal 
      header="Xác nhận xóa" 
      :draggable="false"
      position="center"
      :style="{ width: '450px' }"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-red-500 text-3xl"></i>
        <div>
          <p class="text-gray-800 font-medium mb-2">Bạn có chắc chắn muốn xóa sự kiện này?</p>
          <p class="text-gray-600 text-sm">{{ selectedEvent?.name }}</p>
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" icon="pi pi-times" class="p-button-text" @click="deleteDialogVisible = false" />
        <Button label="Xóa" icon="pi pi-check" class="p-button-danger" @click="handleDelete" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEvents } from '~/composables/useEvents'
import { useToast } from 'primevue/usetoast'
import { formatDateTime, formatDateShort } from '~/utils/helpers'
import { useFileUrl } from '~/composables/useFileUrl'
import { EventStatus, EventStatusLabels } from '~/types/event'

useHead({
  title: 'Danh sách sự kiện'
})

const toast = process.client ? useToast() : null
const { getPagination, remove } = useEvents()
const { getFullUrl } = useFileUrl()
const route = useRoute()

const events = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedStatus = ref<number | null>(null)
const page = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const deleteDialogVisible = ref(false)
const selectedEvent = ref<any>(null)

// Initialize search query and status from URL
onMounted(() => {
  if (route.query.search && typeof route.query.search === 'string') {
    searchQuery.value = route.query.search
  }
  if (route.query.status) {
    const statusNum = parseInt(String(route.query.status), 10)
    if (!isNaN(statusNum)) {
      selectedStatus.value = statusNum
    }
  }
  loadEvents()
})

// Watch route query changes
watch(() => route.query.search, (newSearch) => {
  if (typeof newSearch === 'string') {
    searchQuery.value = newSearch
    loadEvents()
  } else if (newSearch === undefined && searchQuery.value) {
    // If search query is removed from URL, clear local search
    searchQuery.value = ''
    loadEvents()
  }
})

watch(() => route.query.status, (newStatus) => {
  if (newStatus) {
    const statusNum = parseInt(String(newStatus), 10)
    if (!isNaN(statusNum)) {
      selectedStatus.value = statusNum
      loadEvents()
    }
  } else if (newStatus === undefined) {
    selectedStatus.value = null
    loadEvents()
  }
})

const statusOptions = [
  { label: 'Tất cả', value: null },
  { label: EventStatusLabels[EventStatus.DRAFT], value: EventStatus.DRAFT },
  { label: EventStatusLabels[EventStatus.PUBLISHED], value: EventStatus.PUBLISHED },
  { label: EventStatusLabels[EventStatus.CLOSED], value: EventStatus.CLOSED },
  { label: EventStatusLabels[EventStatus.CANCELLED], value: EventStatus.CANCELLED }
]

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

const loadEvents = async () => {
  try {
    loading.value = true
    const result = await getPagination({
      page: page.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      status: selectedStatus.value || undefined
    })
    
    if (result) {
      events.value = (result as any).data || []
      totalRecords.value = (result as any).pagination?.total || 0
    }
  } catch (error) {
    console.error('Error loading events:', error)
    if (toast) {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách sự kiện', life: 3000 })
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadEvents()
}

const onPageChange = (event: any) => {
  page.value = Math.floor(event.first / event.rows) + 1
  pageSize.value = event.rows
  loadEvents()
}

const confirmDelete = (event: any) => {
  selectedEvent.value = event
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (!selectedEvent.value) return
  
  try {
    await remove(selectedEvent.value.id)
    if (toast) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa sự kiện thành công', life: 3000 })
    }
    deleteDialogVisible.value = false
    selectedEvent.value = null
    loadEvents()
  } catch (error) {
    console.error('Error deleting event:', error)
    if (toast) {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa sự kiện', life: 3000 })
    }
  }
}

// onMounted is already handled above with URL query initialization
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.p-paginator) {
  border: none;
  background: transparent;
  padding: 0;
}

:deep(.p-button-text) {
  padding: 0.5rem;
}
</style>