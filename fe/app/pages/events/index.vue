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
            placeholder="Tìm kiếm..." 
            class="w-full"
            @input="handleSearch"
          />
        </IconField>
      </div>
      <div class="w-full md:max-w-[250px]">
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

    <!-- Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <DataTable 
        :value="events" 
        :loading="loading"
        :paginator="true" 
        :rows="pageSize"
        :totalRecords="totalRecords"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        @page="onPageChange"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="code" sortable>
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-hashtag text-gray-500 text-xs"></i>
              <span>Mã</span>
            </div>
          </template>
          <template #body="{ data }">
            <span class="text-gray-600 font-medium">#{{ data.code }}</span>
          </template>
        </Column>

        <Column field="name" sortable>
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-tag text-gray-500 text-xs"></i>
              <span>Tên sự kiện</span>
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
              <span>Ngày bắt đầu</span>
            </div>
          </template>
          <template #body="{ data }">
            {{ formatDateTime(data.start_time) }}
          </template>
        </Column>

        <Column field="end_time" sortable>
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-calendar text-gray-500 text-xs"></i>
              <span>Ngày kết thúc</span>
            </div>
          </template>
          <template #body="{ data }">
            {{ formatDateTime(data.end_time) }}
          </template>
        </Column>

        <Column field="location_name">
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-map-marker text-gray-500 text-xs"></i>
              <span>Địa điểm</span>
            </div>
          </template>
          <template #body="{ data }">
            <span class="text-gray-600">{{ data.location_name || '-' }}</span>
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

        <Column :exportable="false" style="width: 120px">
          <template #header>
            <span>Thao tác</span>
          </template>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Button 
                icon="pi pi-pencil" 
                class="p-button-text p-button-sm p-button-rounded"
                @click="navigateTo(`/events/${data.id}`)"
                v-tooltip.top="'Chỉnh sửa'"
              />
              <Button 
                icon="pi pi-trash" 
                class="p-button-text p-button-sm p-button-rounded p-button-danger"
                @click="confirmDelete(data)"
                v-tooltip.top="'Xóa'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog 
      v-model:visible="deleteDialogVisible" 
      modal 
      header="Xác nhận xóa" 
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
import { ref, onMounted } from 'vue'
import { useEvents } from '~/composables/useEvents'
import { useToast } from 'primevue/usetoast'
import { formatDateTime } from '~/utils/helpers'

useHead({
  title: 'Danh sách sự kiện'
})

const toast = process.client ? useToast() : null
const { getPagination, remove } = useEvents()

const events = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedStatus = ref(null)
const page = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const deleteDialogVisible = ref(false)
const selectedEvent = ref<any>(null)

const statusOptions = [
  { label: 'Tất cả', value: null },
  { label: 'Bản nháp', value: 'draft' },
  { label: 'Đã xuất bản', value: 'published' },
  { label: 'Đã đóng', value: 'closed' },
  { label: 'Đã hủy', value: 'cancelled' }
]

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
    published: 'Đã xuất bản',
    closed: 'Đã đóng',
    cancelled: 'Đã hủy'
  }
  return labelMap[status] || status
}

const loadEvents = async () => {
  try {
    loading.value = true
    const response = await getPagination({
      page: page.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      status: selectedStatus.value || undefined
    })
    
    const result = (response.data.value as any)
    if (result) {
      events.value = result.data || []
      totalRecords.value = result.pagination?.total || 0
    }
  } catch (error) {
    console.error('Error loading events:', error)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách sự kiện', life: 3000 })
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadEvents()
}

const onPageChange = (event: any) => {
  page.value = event.page + 1
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
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa sự kiện thành công', life: 3000 })
    deleteDialogVisible.value = false
    selectedEvent.value = null
    loadEvents()
  } catch (error) {
    console.error('Error deleting event:', error)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa sự kiện', life: 3000 })
  }
}

onMounted(() => {
  loadEvents()
})
</script>
