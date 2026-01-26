<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Danh sách Mini Game</h1>
        <p class="text-gray-500 text-sm mt-1">Quản lý và theo dõi các mini game</p>
      </div>
      <Button 
        label="Thêm mới" 
        icon="pi pi-plus" 
        @click="navigateTo('/minigames/new')"
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
            placeholder="Tìm kiếm mini game..." 
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
          @change="loadMinigames"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div class="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Minigames List -->
    <div v-else-if="minigames.length > 0" class="space-y-4">
      <div class="w-full overflow-x-auto" style="max-width: 100%;">
        <div style="min-width: 800px;">
          <DataTable 
            :value="minigames" 
            stripedRows
            responsiveLayout="scroll"
            class="p-datatable-sm"
          >
        <Column field="name" header="Tên mini game" sortable>
          <template #body="{ data }">
            <div class="font-semibold text-gray-800">{{ data.name }}</div>
          </template>
        </Column>
        
        <Column field="event.name" header="Sự kiện" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.event?.name || '-' }}</span>
          </template>
        </Column>

        <Column field="type" header="Loại" sortable>
          <template #body="{ data }">
            <Tag :value="data.type || '-'" severity="info" :rounded="true" />
          </template>
        </Column>

        <Column field="start_time" header="Thời gian bắt đầu" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.start_time ? formatDateTime(data.start_time) : '-' }}</span>
          </template>
        </Column>

        <Column field="end_time" header="Thời gian kết thúc" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.end_time ? formatDateTime(data.end_time) : '-' }}</span>
          </template>
        </Column>

        <Column field="status" header="Trạng thái" sortable>
          <template #body="{ data }">
            <Tag 
              :value="getStatusLabel(data.status)" 
              :severity="getStatusSeverity(data.status)"
              :rounded="true"
            />
          </template>
        </Column>

        <Column header="Thao tác" :exportable="false" field="actions">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Button 
                icon="pi pi-pencil" 
                class="p-button-text p-button-sm p-button-rounded text-gray-600 hover:text-sky-600"
                @click="navigateTo(`/minigames/${data.id}/edit`)"
                v-tooltip.top="'Chỉnh sửa'"
              />
              <Button 
                icon="pi pi-trash" 
                class="p-button-text p-button-sm p-button-rounded text-gray-600 hover:text-red-600"
                @click="confirmDelete(data)"
                v-tooltip.top="'Xóa'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between pt-4">
        <div class="text-sm text-gray-600">
          Hiển thị {{ (page - 1) * pageSize + 1 }} - {{ Math.min(page * pageSize, totalRecords) }} của {{ totalRecords }} mini game
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
          <i class="pi pi-gamepad text-4xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Không tìm thấy mini game</h3>
        <p class="text-gray-600 mb-6">Chưa có mini game nào được tạo hoặc không khớp với bộ lọc của bạn</p>
        <Button 
          label="Thêm mini game mới" 
          icon="pi pi-plus" 
          @click="navigateTo('/minigames/new')"
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
          <p class="text-gray-800 font-medium mb-2">Bạn có chắc chắn muốn xóa mini game này?</p>
          <p class="text-gray-600 text-sm">{{ selectedMinigame?.name }}</p>
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
import { useMinigames } from '~/composables/useMinigames'
import { useToast } from 'primevue/usetoast'
import { formatDateTime } from '~/utils/helpers'
import { MinigameStatus, MinigameStatusLabels } from '~/types/minigame'

useHead({
  title: 'Danh sách Mini Game'
})
definePageMeta({
  middleware: ['auth']
})

const toast = process.client ? useToast() : null
const { getPagination, remove } = useMinigames()
const route = useRoute()

const minigames = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedStatus = ref<number | null>(null)
const page = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const deleteDialogVisible = ref(false)
const selectedMinigame = ref<any>(null)

onMounted(() => {
  loadMinigames()
})

const statusOptions = [
  { label: 'Tất cả', value: null },
  { label: MinigameStatusLabels[MinigameStatus.PENDING], value: MinigameStatus.PENDING },
  { label: MinigameStatusLabels[MinigameStatus.RUNNING], value: MinigameStatus.RUNNING },
  { label: MinigameStatusLabels[MinigameStatus.FINISHED], value: MinigameStatus.FINISHED },
]

const getStatusSeverity = (status: MinigameStatus | number) => {
  const map: Record<number, string> = {
    [MinigameStatus.PENDING]: 'warning',
    [MinigameStatus.RUNNING]: 'success',
    [MinigameStatus.FINISHED]: 'info',
  }
  return map[Number(status)] || 'secondary'
}

const getStatusLabel = (status: MinigameStatus | number) => {
  return MinigameStatusLabels[status as MinigameStatus] || 'Không xác định'
}

const loadMinigames = async () => {
  try {
    loading.value = true
    const result = await getPagination({
      page: page.value,
      limit: pageSize.value,
      status: selectedStatus.value || undefined,
      search: searchQuery.value || undefined,
      relations: true
    })
    
    if (result) {
      minigames.value = (result as any).data || []
      totalRecords.value = (result as any).pagination?.total || 0
    }
  } catch (error) {
    console.error('Error loading minigames:', error)
    if (toast) {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách mini game', life: 3000 })
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadMinigames()
}

const onPageChange = (event: any) => {
  page.value = Math.floor(event.first / event.rows) + 1
  pageSize.value = event.rows
  loadMinigames()
}

const confirmDelete = (minigame: any) => {
  selectedMinigame.value = minigame
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (!selectedMinigame.value) return
  
  try {
    await remove(selectedMinigame.value.id)
    if (toast) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa mini game thành công', life: 3000 })
    }
    deleteDialogVisible.value = false
    selectedMinigame.value = null
    loadMinigames()
  } catch (error) {
    console.error('Error deleting minigame:', error)
    if (toast) {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa mini game', life: 3000 })
    }
  }
}
</script>

<style scoped>
:deep(.p-paginator) {
  border: none;
  background: transparent;
  padding: 0;
}

/* Đảm bảo table không tràn ra ngoài trên mobile */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

/* Đảm bảo container không vượt quá viewport */
.w-full {
  max-width: 100vw;
  box-sizing: border-box;
}
</style>
