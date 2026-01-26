<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Danh sách đơn vị tổ chức</h1>
        <p class="text-gray-500 text-sm mt-1">Quản lý các đơn vị tổ chức sự kiện</p>
      </div>
      <Button 
        label="Thêm mới" 
        icon="pi pi-plus" 
        @click="navigateTo('/organizer-units/new')"
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
            placeholder="Tìm kiếm đơn vị..." 
            class="w-full"
            @input="handleSearch"
          />
        </IconField>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div class="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div class="h-6 bg-gray-200 rounded mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>

    <!-- Organizer Units Grid -->
    <div v-else-if="organizerUnits.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="unit in organizerUnits"
          :key="unit.id"
          class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
        >
          <!-- Header with Icon -->
          <div class="bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 p-6">
            <div class="flex items-center justify-between">
              <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span class="text-2xl font-bold text-white">{{ unit.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Button 
                  icon="pi pi-pencil" 
                  class="p-button-text p-button-sm p-button-rounded text-white hover:bg-white/20"
                  @click.stop="navigateTo(`/organizer-units/${unit.id}`)"
                  v-tooltip.top="'Chỉnh sửa'"
                />
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-text p-button-sm p-button-rounded text-white hover:bg-white/20"
                  @click.stop="confirmDelete(unit)"
                  v-tooltip.top="'Xóa'"
                />
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <!-- Name -->
            <h3 class="text-lg font-bold text-gray-800 mb-4 group-hover:text-sky-600 transition-colors cursor-pointer" 
                @click="navigateTo(`/organizer-units/${unit.id}`)">
              {{ unit.name }}
            </h3>

            <!-- Contact Details -->
            <div class="space-y-3">
              <!-- Contact Person -->
              <div v-if="unit.contact_person" class="flex items-start gap-2">
                <div class="mt-0.5">
                  <i class="pi pi-user text-sky-500 text-sm"></i>
                </div>
                <div class="flex-1">
                  <span class="text-sm text-gray-600">Người liên hệ:</span>
                  <span class="text-sm text-gray-800 font-medium ml-1">{{ unit.contact_person }}</span>
                </div>
              </div>

              <!-- Contact Email -->
              <div v-if="unit.contact_email" class="flex items-start gap-2">
                <div class="mt-0.5">
                  <i class="pi pi-envelope text-sky-500 text-sm"></i>
                </div>
                <div class="flex-1">
                  <a 
                    :href="`mailto:${unit.contact_email}`" 
                    class="text-sm text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    {{ unit.contact_email }}
                  </a>
                </div>
              </div>

              <!-- Contact Phone -->
              <div v-if="unit.contact_phone" class="flex items-start gap-2">
                <div class="mt-0.5">
                  <i class="pi pi-phone text-sky-500 text-sm"></i>
                </div>
                <div class="flex-1">
                  <a 
                    :href="`tel:${unit.contact_phone}`" 
                    class="text-sm text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    {{ unit.contact_phone }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
              <Button 
                icon="pi pi-eye" 
                label="Xem chi tiết"
                class="p-button-text p-button-sm text-sky-600 hover:text-sky-700"
                @click.stop="navigateTo(`/organizer-units/${unit.id}`)"
              />
              <div class="flex items-center gap-2">
                <Button 
                  icon="pi pi-pencil" 
                  class="p-button-text p-button-sm p-button-rounded text-gray-600 hover:text-sky-600"
                  @click.stop="navigateTo(`/organizer-units/${unit.id}`)"
                  v-tooltip.top="'Chỉnh sửa'"
                />
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-text p-button-sm p-button-rounded text-gray-600 hover:text-red-600"
                  @click.stop="confirmDelete(unit)"
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
          Hiển thị {{ (page - 1) * pageSize + 1 }} - {{ Math.min(page * pageSize, totalRecords) }} của {{ totalRecords }} đơn vị
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
          <i class="pi pi-building text-4xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Không tìm thấy đơn vị tổ chức</h3>
        <p class="text-gray-600 mb-6">Chưa có đơn vị tổ chức nào được tạo hoặc không khớp với tìm kiếm của bạn</p>
        <Button 
          label="Thêm đơn vị mới" 
          icon="pi pi-plus" 
          @click="navigateTo('/organizer-units/new')"
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
          <p class="text-gray-800 font-medium mb-2">Bạn có chắc chắn muốn xóa đơn vị tổ chức này?</p>
          <p class="text-gray-600 text-sm">{{ selectedUnit?.name }}</p>
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
import { useOrganizerUnits } from '~/composables/useOrganizerUnits'
import { useToastSafe } from '~/composables/useToastSafe'

useHead({
  title: 'Danh sách đơn vị tổ chức'
})
definePageMeta({
  middleware: ['auth']
})
const toast = useToastSafe()
const { getPagination, remove } = useOrganizerUnits()

const organizerUnits = ref([])
const loading = ref(false)
const searchQuery = ref('')
const page = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const deleteDialogVisible = ref(false)
const selectedUnit = ref<any>(null)

const loadOrganizerUnits = async () => {
  try {
    loading.value = true
    const response = await getPagination({
      page: page.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined
    })
    const result = (response as any)
    if (result) {
      organizerUnits.value = result.data || []
      totalRecords.value = result.pagination?.total || 0
    }
  } catch (error) {
    console.error('Error loading organizer units:', error)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách đơn vị tổ chức', life: 3000 })
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadOrganizerUnits()
}

const onPageChange = (event: any) => {
  page.value = Math.floor(event.first / event.rows) + 1
  pageSize.value = event.rows
  loadOrganizerUnits()
}

const confirmDelete = (unit: any) => {
  selectedUnit.value = unit
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (!selectedUnit.value) return
  
  try {
    await remove(selectedUnit.value.id)
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa đơn vị tổ chức thành công', life: 3000 })
    deleteDialogVisible.value = false
    selectedUnit.value = null
    loadOrganizerUnits()
  } catch (error) {
    console.error('Error deleting organizer unit:', error)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa đơn vị tổ chức', life: 3000 })
  }
}

onMounted(() => {
  loadOrganizerUnits()
})
</script>

<style scoped>
:deep(.p-paginator) {
  border: none;
  background: transparent;
  padding: 0;
}

:deep(.p-button-text) {
  padding: 0.5rem;
}
</style>