<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Chỉnh sửa Mini Game</h1>
        <p class="text-gray-500 text-sm mt-1">Cập nhật thông tin mini game</p>
      </div>
      <Button label="Quay lại" icon="pi pi-arrow-left" class="p-button-text" @click="navigateTo('/minigames')" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
      <div class="space-y-4">
        <div class="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div class="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
      </div>
    </div>

    <!-- Form -->
    <div v-else-if="minigame" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Tên mini game -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tên mini game <span class="text-red-500">*</span>
            </label>
            <InputText v-model="formData.name" placeholder="Nhập tên mini game" class="w-full"
              :class="{ 'p-invalid': errors.name }" />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>

          <!-- Sự kiện -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Sự kiện <span class="text-red-500">*</span>
            </label>
            <Dropdown 
              v-model="formData.event_id" 
              :options="events" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Chọn sự kiện" 
              class="w-full" 
              :loading="loadingEvents"
              filter
              :class="{ 'p-invalid': errors.event_id }"
            />
            <small v-if="errors.event_id" class="p-error">{{ errors.event_id }}</small>
          </div>

          <!-- Loại mini game -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Loại mini game <span class="text-red-500">*</span>
            </label>
            <Dropdown 
              v-model="formData.type" 
              :options="minigameTypeOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Chọn loại mini game" 
              class="w-full" 
              :class="{ 'p-invalid': errors.type }"
            />
            <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
          </div>

          <!-- Ngày bắt đầu -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Thời gian bắt đầu <span class="text-red-500">*</span>
            </label>
            <VCalendar 
              v-model="formData.start_time" 
              showTime 
              hourFormat="24" 
              dateFormat="dd/mm/yy"
              placeholder="Chọn thời gian bắt đầu"
              :class="{ 'p-invalid': errors.start_time }" 
            />
            <small v-if="errors.start_time" class="p-error">{{ errors.start_time }}</small>
          </div>

          <!-- Ngày kết thúc -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Thời gian kết thúc <span class="text-red-500">*</span>
            </label>
            <VCalendar 
              v-model="formData.end_time" 
              showTime 
              hourFormat="24" 
              dateFormat="dd/mm/yy"
              placeholder="Chọn thời gian kết thúc"
              :class="{ 'p-invalid': errors.end_time }" 
            />
            <small v-if="errors.end_time" class="p-error">{{ errors.end_time }}</small>
          </div>

          <!-- Trạng thái -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <Dropdown 
              v-model="formData.status" 
              :options="statusOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Chọn trạng thái" 
              class="w-full" 
            />
          </div>

          <!-- Mô tả -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <Textarea v-model="formData.description" placeholder="Nhập mô tả mini game" rows="4" class="w-full" />
          </div>
        </div>

        <!-- Prizes Section -->
        <div class="md:col-span-2 mt-6 pt-6 border-t border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Giải thưởng</h3>
              <p class="text-sm text-gray-500 mt-1">Quản lý các giải thưởng cho mini game này</p>
            </div>
            <Button 
              label="Thêm giải thưởng" 
              icon="pi pi-plus" 
              class="p-button-sm"
              @click="openPrizeDialog(undefined)"
            />
          </div>

          <div class="overflow-x-auto">
            <DataTable 
              :value="prizes" 
              stripedRows
              class="p-datatable-sm mobile-table"
              :loading="loadingPrizes"
            >
            <Column field="prize_name" header="Tên giải thưởng" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-3">
                  <div v-if="data.image" class="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    <img 
                      :src="getFullUrl(data.image)" 
                      :alt="data.prize_name"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span class="font-medium text-gray-800 block">{{ data.prize_name }}</span>
                    <span v-if="data.description" class="text-xs text-gray-500 line-clamp-1">{{ data.description }}</span>
                  </div>
                </div>
              </template>
            </Column>
            
            <Column field="quantity" header="Số lượng" sortable>
              <template #body="{ data }">
                <span class="text-gray-700">{{ data.quantity }}</span>
              </template>
            </Column>

            <Column field="order" header="Thứ tự quay" sortable>
              <template #body="{ data }">
                <span class="text-gray-700 font-medium">{{ data.order ?? '-' }}</span>
              </template>
            </Column>

            <Column header="Thao tác" :exportable="false" style="min-width: 120px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Button 
                    icon="pi pi-pencil" 
                    class="p-button-text p-button-sm p-button-rounded text-gray-600 hover:text-sky-600"
                    @click="openPrizeDialog(data)"
                    v-tooltip.top="'Chỉnh sửa'"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    class="p-button-text p-button-sm p-button-rounded text-gray-600 hover:text-red-600"
                    @click="confirmDeletePrize(data)"
                    v-tooltip.top="'Xóa'"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-trophy text-4xl mb-2"></i>
                <p>Chưa có giải thưởng nào</p>
              </div>
            </template>
          </DataTable>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
          <Button 
            label="Hủy" 
            icon="pi pi-times" 
            class="p-button-text" 
            @click="navigateTo('/minigames')" 
          />
          <Button 
            label="Cập nhật" 
            icon="pi pi-check" 
            type="submit"
            :loading="submitting"
            class="bg-sky-500 hover:bg-sky-600"
          />
        </div>
      </form>
    </div>

    <!-- Prize Dialog -->
    <Dialog 
      v-model:visible="prizeDialogVisible" 
      modal 
      :header="selectedPrize ? 'Chỉnh sửa giải thưởng' : 'Thêm giải thưởng'" 
      :draggable="false"
      position="center"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tên giải thưởng <span class="text-red-500">*</span>
          </label>
          <InputText 
            v-model="prizeFormData.prize_name" 
            placeholder="Ví dụ: Giải nhất, Giải nhì, Giải ba..." 
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Số lượng <span class="text-red-500">*</span>
          </label>
          <InputNumber 
            v-model="prizeFormData.quantity" 
            :min="1"
            class="w-full"
            showButtons
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Thứ tự quay <span class="text-red-500">*</span>
          </label>
          <InputNumber 
            v-model="prizeFormData.order" 
            :min="0"
            class="w-full"
            showButtons
            placeholder="Giải nào sẽ được quay trước (số nhỏ hơn = quay trước)"
          />
          <small class="text-gray-500 mt-1 block">Số nhỏ hơn sẽ được quay trước. Ví dụ: 1 = quay đầu tiên, 2 = quay thứ hai...</small>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Mô tả giải thưởng
          </label>
          <Textarea 
            v-model="prizeFormData.description" 
            placeholder="Nhập mô tả về giải thưởng..." 
            rows="4"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Ảnh giải thưởng
          </label>
          <VFileUpload
            v-model="prizeFormData.image"
            accept="image/*"
            :max-file-size="5242880"
            :multiple="false"
            mode="basic"
            choose-label="Chọn ảnh"
            class="w-full"
          />
          <small class="text-gray-500 mt-1 block">Chỉ chấp nhận file ảnh, tối đa 5MB</small>
          
          <!-- Hiển thị ảnh hiện tại nếu có -->
          <div v-if="prizeFormData.image && typeof prizeFormData.image === 'string'" class="mt-3">
            <img 
              :src="getFullUrl(prizeFormData.image)" 
              alt="Ảnh giải thưởng"
              class="w-full h-48 object-cover rounded-lg border border-gray-200"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          label="Hủy" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="prizeDialogVisible = false" 
        />
        <Button 
          :label="selectedPrize ? 'Cập nhật' : 'Thêm mới'" 
          icon="pi pi-check" 
          @click="handlePrizeSubmit"
          :loading="prizeDialogSubmitting"
        />
      </template>
    </Dialog>

    <!-- Delete Prize Dialog -->
    <Dialog 
      v-model:visible="deletePrizeDialogVisible" 
      modal 
      header="Xác nhận xóa" 
      :draggable="false"
      position="center"
      :style="{ width: '450px' }"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-red-500 text-3xl"></i>
        <div>
          <p class="text-gray-800 font-medium mb-2">Bạn có chắc chắn muốn xóa giải thưởng này?</p>
          <p class="text-gray-600 text-sm">{{ selectedPrize?.prize_name }}</p>
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" icon="pi pi-times" class="p-button-text" @click="deletePrizeDialogVisible = false" />
        <Button label="Xóa" icon="pi pi-check" class="p-button-danger" @click="handleDeletePrize" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMinigames } from '~/composables/useMinigames'
import { useEvents } from '~/composables/useEvents'
import { useMinigamePrizes } from '~/composables/useMinigamePrizes'
import { useToastSafe } from '~/composables/useToastSafe'
import { MinigameStatus, MinigameStatusLabels } from '~/types/minigame'
import type { UpdateMinigameDto } from '~/types/minigame'
import type { MinigamePrize, CreateMinigamePrizeDto } from '~/types/minigame-prize'

useHead({
  title: 'Chỉnh sửa Mini Game'
})
definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const toast = useToastSafe()
const { getFullUrl } = useFileUrl()
const { getById, update } = useMinigames()
const { getPagination: getEvents } = useEvents()
const { getPagination: getPrizes, create: createPrize, update: updatePrize, remove: removePrize } = useMinigamePrizes()

const minigame = ref<any>(null)
const loading = ref(true)
const formData = ref<UpdateMinigameDto>({
  id: '',
  event_id: '',
  name: '',
  type: '',
  description: '',
  start_time: undefined,
  end_time: undefined,
  status: MinigameStatus.PENDING
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const events = ref<any[]>([])
const loadingEvents = ref(false)

// Prizes
const prizes = ref<MinigamePrize[]>([])
const loadingPrizes = ref(false)
const prizeDialogVisible = ref(false)
const selectedPrize = ref<MinigamePrize | null>(null)
const prizeFormData = ref<CreateMinigamePrizeDto>({
  id: '',
  minigame_id: '',
  prize_name: '',
  quantity: 1,
  description: '',
  image: undefined,
  order: 0
})
const prizeDialogSubmitting = ref(false)
const deletePrizeDialogVisible = ref(false)

const statusOptions = [
  { label: MinigameStatusLabels[MinigameStatus.PENDING], value: MinigameStatus.PENDING },
  { label: MinigameStatusLabels[MinigameStatus.RUNNING], value: MinigameStatus.RUNNING },
  { label: MinigameStatusLabels[MinigameStatus.FINISHED], value: MinigameStatus.FINISHED },
]

const minigameTypeOptions = [
  { label: 'Quay số', value: 'quay số' },
]

const loadMinigame = async () => {
  try {
    loading.value = true
    const id = route.params.id as string
    const data = await getById(id, { relations: true })
    
    if (data) {
      minigame.value = data as any
      formData.value = {
        id: (data as any).id,
        event_id: (data as any).event_id,
        name: (data as any).name || '',
        type: (data as any).type || 'quay số',
        description: (data as any).description || '',
        start_time: (data as any).start_time ? new Date((data as any).start_time) : undefined,
        end_time: (data as any).end_time ? new Date((data as any).end_time) : undefined,
        status: (data as any).status !== undefined ? (data as any).status : MinigameStatus.PENDING
      }
      
      // Load prizes
      await loadPrizes()
    }
  } catch (error) {
    console.error('Error loading minigame:', error)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải thông tin mini game', life: 3000 })
    navigateTo('/minigames')
  } finally {
    loading.value = false
  }
}

const loadPrizes = async () => {
  try {
    loadingPrizes.value = true
    const id = route.params.id as string
    const result = await getPrizes({ minigame_id: id, limit: 1000 })
    if (result) {
      const loadedPrizes = (result as any).data || []
      // Sắp xếp theo order (số nhỏ hơn = quay trước)
      prizes.value = loadedPrizes.sort((a: MinigamePrize, b: MinigamePrize) => {
        const orderA = a.order ?? 999999
        const orderB = b.order ?? 999999
        return orderA - orderB
      })
    }
  } catch (error) {
    console.error('Error loading prizes:', error)
  } finally {
    loadingPrizes.value = false
  }
}

const loadEvents = async () => {
  try {
    loadingEvents.value = true
    const result = await getEvents({ limit: 1000, relations: true })
    if (result) {
      events.value = (result as any).data || []
    }
  } catch (error) {
    console.error('Error loading events:', error)
  } finally {
    loadingEvents.value = false
  }
}

const validate = () => {
  errors.value = {}
  
  if (!formData.value.name || formData.value.name.trim() === '') {
    errors.value.name = 'Vui lòng nhập tên mini game'
  }
  
  if (!formData.value.event_id) {
    errors.value.event_id = 'Vui lòng chọn sự kiện'
  }
  
  if (!formData.value.type || formData.value.type.trim() === '') {
    errors.value.type = 'Vui lòng chọn loại mini game'
  }
  
  if (!formData.value.start_time) {
    errors.value.start_time = 'Vui lòng chọn thời gian bắt đầu'
  }
  
  if (!formData.value.end_time) {
    errors.value.end_time = 'Vui lòng chọn thời gian kết thúc'
  }
  
  if (formData.value.start_time && formData.value.end_time) {
    const start = new Date(formData.value.start_time)
    const end = new Date(formData.value.end_time)
    if (end <= start) {
      errors.value.end_time = 'Thời gian kết thúc phải sau thời gian bắt đầu'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng điền đầy đủ thông tin bắt buộc', life: 3000 })
    return
  }

  try {
    submitting.value = true
    const id = route.params.id as string
    const payload: any = {
      event_id: formData.value.event_id,
      name: formData.value.name,
      type: formData.value.type,
      description: formData.value.description,
      start_time: formData.value.start_time ? new Date(formData.value.start_time).toISOString() : undefined,
      end_time: formData.value.end_time ? new Date(formData.value.end_time).toISOString() : undefined,
      status: formData.value.status
    }
    await update(id, payload)
    
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật mini game thành công', life: 3000 })
    navigateTo('/minigames')
  } catch (error: any) {
    console.error('Error updating minigame:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Lỗi', 
      detail: error.data?.message || 'Không thể cập nhật mini game', 
      life: 3000 
    })
  } finally {
    submitting.value = false
  }
}

const openPrizeDialog = (prize?: MinigamePrize) => {
  if (prize) {
    selectedPrize.value = prize
    prizeFormData.value = {
      id: prize.id,
      minigame_id: route.params.id as string,
      prize_name: prize.prize_name,
      quantity: prize.quantity,
      description: prize.description || '',
      image: prize.image || undefined,
      order: prize.order || 0
    }
  } else {
    selectedPrize.value = null;
    // Tự động set order = số lượng prizes hiện tại + 1
    const nextOrder = prizes.value.length > 0 
      ? Math.max(...prizes.value.map(p => p.order || 0)) + 1 
      : 1
    prizeFormData.value = {
      id: '',
      minigame_id: route.params.id as string,
      prize_name: '',
      quantity: 0,
      order: nextOrder
    }
  }
  prizeDialogVisible.value = true
}

const handlePrizeSubmit = async () => {
  if (!prizeFormData.value.prize_name || prizeFormData.value.prize_name.trim() === '') {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng nhập tên giải thưởng', life: 3000 })
    return
  }
  
  if (!prizeFormData.value.quantity || prizeFormData.value.quantity <= 0) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Số lượng phải lớn hơn 0', life: 3000 })
    return
  }
  
  if (prizeFormData.value.order === undefined || prizeFormData.value.order === null || prizeFormData.value.order < 0) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Thứ tự phải là số lớn hơn hoặc bằng 0', life: 3000 })
    return
  }

  try {
    prizeDialogSubmitting.value = true
    
    if (selectedPrize.value) {
      // Update
      if(selectedPrize.value.id) {
        await updatePrize(selectedPrize.value.id, prizeFormData.value)
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật giải thưởng', life: 3000 })
      }
      else{
        await createPrize(prizeFormData.value)
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã thêm giải thưởng', life: 3000 })
      }
    } else {
      // Create
      await createPrize(prizeFormData.value)
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã thêm giải thưởng', life: 3000 })
    }
    
    prizeDialogVisible.value = false
    await loadPrizes()
  } catch (error: any) {
    console.error('Error saving prize:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Lỗi', 
      detail: error.data?.message || 'Không thể lưu giải thưởng', 
      life: 3000 
    })
  } finally {
    prizeDialogSubmitting.value = false
  }
}

const confirmDeletePrize = (prize: MinigamePrize) => {
  selectedPrize.value = prize
  deletePrizeDialogVisible.value = true
}

const handleDeletePrize = async () => {
  if (!selectedPrize.value) return
  
  try {
    await removePrize(selectedPrize.value.id)
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa giải thưởng', life: 3000 })
    deletePrizeDialogVisible.value = false
    selectedPrize.value = null
    await loadPrizes()
  } catch (error: any) {
    console.error('Error deleting prize:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Lỗi', 
      detail: error.data?.message || 'Không thể xóa giải thưởng', 
      life: 3000 
    })
  }
}

onMounted(async () => {
  await Promise.all([loadMinigame(), loadEvents()])
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
