<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Thêm mới Mini Game</h1>
        <p class="text-gray-500 text-sm mt-1">Tạo mini game mới trong hệ thống</p>
      </div>
      <Button label="Quay lại" icon="pi pi-arrow-left" class="p-button-text" @click="navigateTo('/minigames')" />
    </div>

    <!-- Form -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

        <!-- Buttons -->
        <div class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
          <Button 
            label="Hủy" 
            icon="pi pi-times" 
            class="p-button-text" 
            @click="navigateTo('/minigames')" 
          />
          <Button 
            label="Tạo mới" 
            icon="pi pi-check" 
            type="submit"
            :loading="submitting"
            class="bg-sky-500 hover:bg-sky-600"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMinigames } from '~/composables/useMinigames'
import { useEvents } from '~/composables/useEvents'
import { useToastSafe } from '~/composables/useToastSafe'
import { MinigameStatus, MinigameStatusLabels } from '~/types/minigame'
import type { CreateMinigameDto } from '~/types/minigame'

useHead({
  title: 'Thêm mới Mini Game'
})

const toast = useToastSafe()
const { create } = useMinigames()
const { getPagination: getEvents } = useEvents()

const formData = ref<CreateMinigameDto>({
  event_id: '',
  name: '',
  type: 'quay số',
  description: '',
  start_time: undefined,
  end_time: undefined,
  status: MinigameStatus.PENDING
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const events = ref<any[]>([])
const loadingEvents = ref(false)

const statusOptions = [
  { label: MinigameStatusLabels[MinigameStatus.PENDING], value: MinigameStatus.PENDING },
  { label: MinigameStatusLabels[MinigameStatus.RUNNING], value: MinigameStatus.RUNNING },
  { label: MinigameStatusLabels[MinigameStatus.FINISHED], value: MinigameStatus.FINISHED },
]

const minigameTypeOptions = [
  { label: 'Quay số', value: 'quay số' },
]

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
    const payload: any = {
      ...formData.value,
      start_time: formData.value.start_time ? new Date(formData.value.start_time).toISOString() : undefined,
      end_time: formData.value.end_time ? new Date(formData.value.end_time).toISOString() : undefined,
    }
    
    await create(payload)
    
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo mini game thành công', life: 3000 })
    navigateTo('/minigames')
  } catch (error: any) {
    console.error('Error creating minigame:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Lỗi', 
      detail: error.data?.message || 'Không thể tạo mini game', 
      life: 3000 
    })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadEvents()
})
</script>
