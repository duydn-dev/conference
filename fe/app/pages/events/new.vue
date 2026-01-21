<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Thêm mới sự kiện</h1>
        <p class="text-gray-500 text-sm mt-1">Tạo sự kiện mới trong hệ thống</p>
      </div>
      <Button label="Quay lại" icon="pi pi-arrow-left" class="p-button-text" @click="navigateTo('/events')" />
    </div>

    <!-- Form -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Mã sự kiện -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Mã sự kiện <span class="text-red-500">*</span>
            </label>
            <InputText v-model="formData.code" placeholder="Nhập mã sự kiện" class="w-full"
              :class="{ 'p-invalid': errors.code }" />
            <small v-if="errors.code" class="p-error">{{ errors.code }}</small>
          </div>

          <!-- Tên sự kiện -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tên sự kiện <span class="text-red-500">*</span>
            </label>
            <InputText v-model="formData.name" placeholder="Nhập tên sự kiện" class="w-full"
              :class="{ 'p-invalid': errors.name }" />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>

          <!-- Mô tả -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <Textarea v-model="formData.description" placeholder="Nhập mô tả sự kiện" rows="4" class="w-full" />
          </div>

          <!-- Avatar/Ảnh đại diện -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Ảnh đại diện
            </label>
            <VFileUpload 
              v-model="formData.avatar" 
              :isMultiple="false" 
              accept="image/*"
              :maxFileSize="5000000"
            />
          </div>

          <!-- Ngày bắt đầu -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Ngày bắt đầu <span class="text-red-500">*</span>
            </label>
            <VCalendar 
              v-model="formData.start_time" 
              showTime 
              hourFormat="24" 
              dateFormat="dd/mm/yy"
              placeholder="Chọn ngày bắt đầu"
              :class="{ 'p-invalid': errors.start_time }" 
            />
            <small v-if="errors.start_time" class="p-error">{{ errors.start_time }}</small>
          </div>

          <!-- Ngày kết thúc -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Ngày kết thúc <span class="text-red-500">*</span>
            </label>
            <VCalendar 
              v-model="formData.end_time" 
              showTime 
              hourFormat="24" 
              dateFormat="dd/mm/yy"
              placeholder="Chọn ngày kết thúc"
              :class="{ 'p-invalid': errors.end_time }" 
            />
            <small v-if="errors.end_time" class="p-error">{{ errors.end_time }}</small>
          </div>

          <!-- Tên địa điểm -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tên địa điểm
            </label>
            <InputGroup>
              <InputText v-model="formData.location_name" placeholder="Nhập tên địa điểm" class="w-full" />
              <InputGroupAddon>
                <Button 
                  icon="pi pi-map" 
                  class="p-button-text p-button-sm"
                  @click="openMapModal"
                  v-tooltip.top="'Chọn vị trí trên bản đồ'"
                />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <!-- Địa chỉ -->
          <div class="hidden">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <InputText v-model="formData.location" placeholder="Nhập địa chỉ chi tiết" class="w-full" />
          </div>

          <!-- Đơn vị tổ chức -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Đơn vị tổ chức
            </label>
            <Dropdown v-model="formData.organizer_unit_id" :options="organizerUnits" optionLabel="name" optionValue="id"
              placeholder="Chọn đơn vị tổ chức" class="w-full" :loading="loadingOrganizerUnits" filter />
          </div>

          <!-- Trạng thái -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <Dropdown v-model="formData.status" :options="statusOptions" optionLabel="label" optionValue="value"
              placeholder="Chọn trạng thái" class="w-full" />
          </div>

          <!-- Tên người đại diện -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tên người đại diện
            </label>
            <InputText v-model="formData.representative_name" placeholder="Nhập tên người đại diện" class="w-full" />
          </div>

          <!-- CMND/CCCD người đại diện -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              CMND/CCCD người đại diện
            </label>
            <InputText v-model="formData.representative_identity" placeholder="Nhập số CMND/CCCD" class="w-full" />
          </div>

          <!-- Tài liệu đính kèm -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tài liệu đính kèm
            </label>
            <VFileUpload 
              v-model="documents" 
              :isMultiple="true" 
              accept="image/*,application/pdf"
              :maxFileSize="10000000"
            />
          </div>

          <!-- Danh sách khách mời -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Danh sách khách mời
            </label>
            <div class="space-y-3">
              <div class="flex justify-end gap-2">
                <Button 
                  label="Thêm khách mời" 
                  icon="pi pi-plus" 
                  @click="showParticipantDialog = true"
                  size="small"
                />
              </div>
              
              <div class="overflow-x-auto">
                <DataTable 
                  :value="selectedParticipants" 
                  :rows="10"
                  class="border border-gray-200 rounded-lg mobile-table"
                  :emptyMessage="'Chưa có khách mời'"
                >
                <Column field="full_name" header="Họ tên" />
                <Column field="identity_number" header="CMND/CCCD" />
                <Column field="email" header="Email" />
                <Column field="phone" header="Số điện thoại" />
                <Column field="organization" header="Tổ chức" />
                <Column header="Thao tác" style="width: 100px">
                  <template #body="{ index }">
                    <Button 
                      icon="pi pi-trash" 
                      severity="danger" 
                      text 
                      rounded
                      @click="removeParticipant(index)"
                    />
                  </template>
                </Column>
              </DataTable>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button label="Hủy" icon="pi pi-times" class="p-button-text" @click="navigateTo('/events')" />
          <Button label="Lưu" icon="pi pi-check" type="submit" :loading="submitting"
            class="bg-sky-500 hover:bg-sky-600" />
        </div>
      </form>
    </div>

    <!-- Participant Dialog (componentized) -->
    <ParticipantManagerDialog
      v-model:modelValue="showParticipantDialog"
      v-model:participants="selectedParticipants"
    />

    <!-- Map Modal -->
    <MapPickerModal 
      v-model:visible="showMapModal"
      :center="mapCenter"
      :zoom="15"
      :initial-location="initialMapLocation"
      @location-selected="handleLocationSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEvents } from '~/composables/useEvents'
import { useOrganizerUnits } from '~/composables/useOrganizerUnits'
import { useEventDocuments } from '~/composables/useEventDocuments'
import { useEventParticipants } from '~/composables/useEventParticipants'
import { useToastSafe } from '~/composables/useToastSafe'
import { EventStatus, EventStatusLabels } from '~/types/event'
import { ParticipantStatus, ImportSource } from '~/types/event-participant'
import type { Participant } from '~/types/participant'

useHead({
  title: 'Thêm mới sự kiện'
})

const toast = useToastSafe()
const { create } = useEvents()
const { getPagination: getOrganizerUnits } = useOrganizerUnits()
const { create: createDocument } = useEventDocuments()
const { create: createEventParticipant } = useEventParticipants()

const submitting = ref(false)
const loadingOrganizerUnits = ref(false)
const organizerUnits = ref([])
const errors = ref<Record<string, string>>({})

// Documents state
const documents = ref<string[] | null>(null)

// Participants state (dùng cho component ParticipantManagerDialog)
const showParticipantDialog = ref(false)
const selectedParticipants = ref<Participant[]>([])

// Map modal state
const showMapModal = ref(false)
const mapRef = ref<any>(null)
const mapCenter = ref<[number, number]>([108.2022, 16.0544] as [number, number])
const selectedLocation = ref<[number, number] | null>(null)

const formData = ref({
  code: '',
  name: '',
  description: '',
  avatar: null as string | null,
  start_time: null as Date | null,
  end_time: null as Date | null,
  location_name: '',
  location: '',
  organizer_unit_id: null as string | null,
  representative_name: '',
  representative_identity: '',
  status: EventStatus.DRAFT
})

const initialMapLocation = computed(() => {
  if (!formData.value.location || !formData.value.location_name) return null
  const parts = String(formData.value.location).split(',').map((p: string) => p.trim())
  if (parts.length !== 2) return null
  const lat = parseFloat(parts[0] || '0')
  const lng = parseFloat(parts[1] || '0')
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null
  return {
    address: formData.value.location_name,
    lat,
    lng
  }
})

const statusOptions = [
  { label: EventStatusLabels[EventStatus.DRAFT], value: EventStatus.DRAFT },
  { label: EventStatusLabels[EventStatus.PUBLISHED], value: EventStatus.PUBLISHED },
  { label: EventStatusLabels[EventStatus.CLOSED], value: EventStatus.CLOSED },
  { label: EventStatusLabels[EventStatus.CANCELLED], value: EventStatus.CANCELLED }
]

const loadOrganizerUnits = async () => {
  try {
    loadingOrganizerUnits.value = true
    const response = await getOrganizerUnits({ page: 1, limit: 100 })
    
    console.log('Organizer units response:', response)
    
    if (response.error.value) {
      console.error('Error loading organizer units:', response.error.value)
      toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách đơn vị tổ chức', life: 3000 })
      organizerUnits.value = []
      return
    }
    
    const result = (response.data.value as any)
    console.log('Organizer units result:', result)
    
    if (result && result.data) {
      organizerUnits.value = Array.isArray(result.data) ? result.data : []
      console.log('Loaded organizer units:', organizerUnits.value.length)
    } else {
      console.warn('No data in response, setting empty array')
      organizerUnits.value = []
    }
  } catch (error) {
    console.error('Error loading organizer units:', error)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách đơn vị tổ chức', life: 3000 })
    organizerUnits.value = []
  } finally {
    loadingOrganizerUnits.value = false
  }
}

const removeParticipant = (index: number) => {
  selectedParticipants.value.splice(index, 1)
}

const validate = () => {
  errors.value = {}

  if (!formData.value.code?.trim()) {
    errors.value.code = 'Mã sự kiện là bắt buộc'
  }

  if (!formData.value.name?.trim()) {
    errors.value.name = 'Tên sự kiện là bắt buộc'
  }

  if (!formData.value.start_time) {
    errors.value.start_time = 'Ngày bắt đầu là bắt buộc'
  }

  if (!formData.value.end_time) {
    errors.value.end_time = 'Ngày kết thúc là bắt buộc'
  }

  if (formData.value.start_time && formData.value.end_time) {
    if (new Date(formData.value.start_time) >= new Date(formData.value.end_time)) {
      errors.value.end_time = 'Ngày kết thúc phải sau ngày bắt đầu'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) {
    return
  }

  try {
    submitting.value = true
    const { start_time, end_time, ...rest } = formData.value
    const data = {
      ...rest,
      start_time: start_time?.toISOString() || '',
      end_time: end_time?.toISOString() || '',
      organizer_unit_id: rest.organizer_unit_id || undefined
    }

    // Step 1: Create event
    const response = await create(data)
    const createdEvent = (response.data.value as any)
    
    if (!createdEvent?.id) {
      throw new Error('Failed to create event')
    }

    const eventId = createdEvent.id

    // Step 2: Create documents if any
    if (documents.value && documents.value.length > 0) {
      for (const filePath of documents.value) {
        try {
          const fileName = filePath.split('/').pop() || 'unknown'
          await createDocument({
            event_id: eventId,
            file_name: fileName,
            file_path: filePath,
            file_type: fileName.split('.').pop() || 'unknown'
          })
        } catch (docError) {
          console.error('Error creating document:', docError)
          // Continue with other documents
        }
      }
    }

    // Step 3: Create event participants if any
    if (selectedParticipants.value.length > 0) {
      for (const participant of selectedParticipants.value) {
        try {
          await createEventParticipant({
            event_id: eventId,
            participant_id: participant.id,
            status: ParticipantStatus.REGISTERED,
            source: ImportSource.MANUAL
          })
        } catch (partError) {
          console.error('Error creating event participant:', partError)
          // Continue with other participants
        }
      }
    }

    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo sự kiện thành công', life: 3000 })
    navigateTo('/events')
  } catch (error: any) {
    console.error('Error creating event:', error)
    const errorMessage = error.data?.message || 'Không thể tạo sự kiện'
    toast.add({ severity: 'error', summary: 'Lỗi', detail: errorMessage, life: 3000 })
  } finally {
    submitting.value = false
  }
}

const openMapModal = () => {
  showMapModal.value = true
}

const handleLocationSelected = (location: { address: string; lat: number; lng: number }) => {
  formData.value.location_name = location.address
  formData.value.location = `${location.lat},${location.lng}`
}

onMounted(() => {
  loadOrganizerUnits()
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
