<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Chi tiết sự kiện</h1>
        <p class="text-gray-500 text-sm mt-1">Xem thông tin chi tiết sự kiện</p>
      </div>
      <Button 
        label="Quay lại" 
        icon="pi pi-arrow-left" 
        class="p-button-text"
        @click="navigateTo('/events')"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
      <div class="space-y-6">
        <!-- Image skeleton -->
        <div class="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        <!-- Content skeleton -->
        <div class="space-y-4">
          <div class="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div class="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div class="grid grid-cols-2 gap-4 mt-6">
            <div class="h-20 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Content -->
    <div v-else-if="event" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main info -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <!-- Cover / Avatar -->
          <div class="relative h-64 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500">
            <div v-if="event.avatar" class="absolute inset-0">
              <img 
                :src="getFullUrl(event.avatar)" 
                :alt="event.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="absolute inset-0 flex items-center justify-center">
              <div class="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span class="text-5xl font-bold text-white">{{ event.name?.charAt(0)?.toUpperCase() }}</span>
              </div>
            </div>
            <div class="absolute top-4 left-4 flex flex-col gap-2">
              <Tag 
                :value="getStatusLabel(event.status)" 
                :severity="getStatusSeverity(event.status)"
                :rounded="true"
                class="shadow-md"
              />
              <span class="inline-flex items-center px-3 py-1 rounded-full bg-white/90 text-xs font-medium text-gray-800">
                <i class="pi pi-hashtag mr-1" /> {{ event.code }}
              </span>
            </div>
            <div class="absolute top-4 right-4">
              <Button 
                label="Chỉnh sửa sự kiện" 
                icon="pi pi-pencil" 
                severity="secondary"
                raised
                @click="navigateTo(`/events/${route.params.id}/edit`)"
              />
            </div>
            <div class="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
              <h2 class="text-2xl font-bold text-white mb-1">
                {{ event.name }}
              </h2>
              <p v-if="event.description" class="text-sm text-gray-100 line-clamp-2">
                {{ event.description }}
              </p>
            </div>
          </div>

          <!-- Event details -->
          <div class="p-6 space-y-6">
            <!-- Time & Location -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-start gap-3">
                <div class="mt-1">
                  <i class="pi pi-calendar text-sky-500 text-xl"></i>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-500">Thời gian</div>
                  <div class="mt-1 text-sm text-gray-900">
                    <div>{{ formatDateTime(event.start_time) }} - {{ formatDateTime(event.end_time) }}</div>
                  </div>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="mt-1">
                  <i class="pi pi-map-marker text-red-500 text-xl"></i>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-500">Địa điểm</div>
                  <div class="mt-1 text-sm text-gray-900">
                    <div v-if="event.location_name">{{ event.location_name }}</div>
                    <div v-if="event.location" class="text-gray-500 text-xs mt-1">
                      {{ event.location }}
                    </div>
                    <div v-else class="text-gray-400 text-xs">
                      Chưa cập nhật vị trí chi tiết
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Organizer -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-start gap-3">
                <div class="mt-1">
                  <i class="pi pi-building text-emerald-500 text-xl"></i>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-500">Đơn vị tổ chức</div>
                  <div class="mt-1 text-sm text-gray-900">
                    {{ event.organizerUnit?.name || 'Chưa cập nhật' }}
                  </div>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="mt-1">
                  <i class="pi pi-user text-indigo-500 text-xl"></i>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-500">Người đại diện</div>
                  <div class="mt-1 text-sm text-gray-900">
                    <div v-if="event.representative_name">
                      {{ event.representative_name }}
                    </div>
                    <div v-if="event.representative_identity" class="text-gray-500 text-xs">
                      CMND/CCCD: {{ event.representative_identity }}
                    </div>
                    <div v-else-if="!event.representative_name" class="text-gray-400 text-xs">
                      Chưa cập nhật
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="event.description" class="border-t border-gray-100 pt-4">
              <h3 class="text-sm font-semibold text-gray-800 mb-3">Mô tả chi tiết</h3>
              <p class="text-sm text-gray-700 whitespace-pre-line">
                {{ event.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Documents -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200" v-if="documents.length > 0">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-paperclip text-sky-600"></i>
              <h3 class="font-semibold text-gray-800 text-sm">Tài liệu đính kèm</h3>
            </div>
            <span class="text-xs text-gray-500">Tổng: {{ documents.length }} tài liệu</span>
          </div>
          <div class="divide-y divide-gray-100">
            <div
              v-for="doc in documents"
              :key="doc.id"
              class="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div class="flex items-center gap-3">
                <i class="pi pi-file text-2xl text-gray-400"></i>
                <div>
                  <p class="font-medium text-sm text-gray-800">{{ doc.file_name }}</p>
                  <p class="text-xs text-gray-500">
                    {{ doc.file_type?.toUpperCase() }}
                    <span v-if="doc.uploaded_at"> • {{ formatDateTime(doc.uploaded_at) }}</span>
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  as="a"
                  :href="getFullUrl(doc.file_path)"
                  icon="pi pi-download"
                  label="Tải về"
                  class="p-button-text p-button-sm"
                  target="_blank"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Side column -->
      <div class="space-y-6">
        <!-- Map -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" v-if="mapCenter">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <i class="pi pi-map text-sky-600"></i>
            <h3 class="font-semibold text-gray-800 text-sm">Bản đồ địa điểm</h3>
          </div>
          <div class="h-72">
            <VMap
              :center="mapCenter"
              :zoom="15"
              height="100%"
              :marker="mapMarker"
              :initial-location="initialMapLocation"
            />
          </div>
        </div>

        <!-- Meta info -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-sm text-gray-600 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Trạng thái</span>
            <Tag 
              :value="getStatusLabel(event.status)" 
              :severity="getStatusSeverity(event.status)"
              :rounded="true"
            />
          </div>
          <div v-if="event.created_at" class="flex items-center justify-between">
            <span class="text-gray-500">Ngày tạo</span>
            <span class="font-medium">{{ formatDateTime(event.created_at) }}</span>
          </div>
          <div v-if="event.updated_at" class="flex items-center justify-between">
            <span class="text-gray-500">Cập nhật lần cuối</span>
            <span class="font-medium">{{ formatDateTime(event.updated_at) }}</span>
          </div>
          
          <!-- Action buttons -->
          <div v-if="shouldShowButtons" class="pt-3 mt-2 border-t border-gray-100 space-y-2">
            <!-- Hiển thị 2 nút khi chưa xác nhận -->
            <template v-if="!isConfirmed">
              <Button 
                label="Từ chối tham dự" 
                icon="pi pi-times" 
                class="w-full p-button-outlined p-button-sm border-red-300 hover:bg-red-50"
                style="color: #dc2626;"
                @click="handleRejectAttendance"
              />
              <Button 
                label="Xác nhận tham dự" 
                icon="pi pi-check" 
                class="w-full p-button-outlined p-button-sm text-green-600 border-green-200"
                @click="handleConfirmAttendance"
              />
            </template>
            
            <!-- Hiển thị nút "Đã tới" khi đã xác nhận nhưng chưa tới -->
            <Button 
              v-else-if="isConfirmed && !hasCheckedIn"
              label="Đã tới" 
              icon="pi pi-check-circle" 
              class="w-full p-button-outlined p-button-sm border-green-200"
              style="color: #10b981;"
              @click="handleMarkAttended"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Attendance Dialog -->
    <Dialog 
      v-model:visible="rejectDialogVisible" 
      modal 
      header="Từ chối tham dự sự kiện" 
      :draggable="false"
      position="center"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-orange-500 text-2xl mt-1"></i>
          <div class="flex-1">
            <p class="text-gray-800 mb-4">Vui lòng nhập lý do từ chối tham dự sự kiện này:</p>
            <Textarea
              v-model="rejectReason"
              placeholder="Nhập lý do từ chối..."
              rows="4"
              class="w-full"
              :autoResize="false"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <Button 
          label="Hủy" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="rejectDialogVisible = false" 
        />
        <Button 
          label="Xác nhận từ chối" 
          icon="pi pi-check" 
          class="p-button-danger" 
          :disabled="!rejectReason || rejectReason.trim() === ''"
          @click="submitRejectAttendance" 
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEvents } from '~/composables/useEvents'
import { useEventDocuments } from '~/composables/useEventDocuments'
import { useEventParticipants } from '~/composables/useEventParticipants'
import { useToastSafe } from '~/composables/useToastSafe'
import { useRoute } from 'vue-router'
import { EventStatus, EventStatusLabels } from '~/types/event'
import type { EventDocument } from '~/types/event-document'
import { ParticipantStatus } from '~/types/event-participant'
import { formatDateTime } from '~/utils/helpers'
import { useFileUrl } from '~/composables/useFileUrl'
import VMap from '~/components/VMap.vue'

useHead({
  title: 'Chi tiết sự kiện'
})

const route = useRoute()
const toast = useToastSafe()
const { getById } = useEvents()
const { getPagination: getDocuments } = useEventDocuments()
const { getPagination: getEventParticipants, update: updateEventParticipant, create: createEventParticipant, checkIn } = useEventParticipants()
const { getFullUrl } = useFileUrl()

const event = ref<any | null>(null)
const loading = ref(true)

// Documents state
const documents = ref<EventDocument[]>([])

// Current user's event participant
const currentEventParticipant = ref<any | null>(null)
const participantLoading = ref(false)

// Track confirmation state in session
const isConfirmed = ref(false)

// Reject dialog state
const rejectDialogVisible = ref(false)
const rejectReason = ref('')

const loadEvent = async () => {
  try {
    loading.value = true
    const eventId = route.params.id as string
    const data = await getById(eventId)
    
    if (data) {
      event.value = data as any
    }
  } catch (error) {
    console.error('Error loading event:', error)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải thông tin sự kiện', life: 3000 })
    navigateTo('/events')
  } finally {
    loading.value = false
  }
}

const loadDocuments = async () => {
  try {
    const eventId = route.params.id as string
    const result = await getDocuments({ event_id: eventId, limit: 100 } as any)
    if (result) {
      documents.value = (result as any).data || []
    }
  } catch (error) {
    console.error('Error loading documents:', error)
  }
}

const mapCenter = computed<[number, number] | null>(() => {
  if (!event.value?.location) return null
  const parts = String(event.value.location).split(',').map((p: string) => parseFloat(p.trim()))
  if (parts.length !== 2 || parts.some(isNaN)) return null
  // stored as "lat,lng" but VMap expects [lng, lat]
  return [parts[1], parts[0]] as [number, number]
})

const mapMarker = computed(() => {
  if (!mapCenter.value) return null
  return {
    position: {
      lng: mapCenter.value[0],
      lat: mapCenter.value[1]
    },
    title: event.value?.location_name || event.value?.name || 'Vị trí sự kiện'
  }
})

const initialMapLocation = computed(() => {
  // Nếu có location hoặc location_name thì truyền vào initialLocation để không tự động geolocate
  if (event.value?.location || event.value?.location_name) {
    if (mapCenter.value) {
      return {
        address: event.value?.location_name || event.value?.name || 'Vị trí sự kiện',
        lat: mapCenter.value[1],
        lng: mapCenter.value[0]
      }
    }
  }
  return null
})

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

// Computed properties for button visibility
const hasRejected = computed(() => {
  if (!currentEventParticipant.value) return false
  return currentEventParticipant.value.status === ParticipantStatus.ABSENT
})

const hasCheckedIn = computed(() => {
  if (!currentEventParticipant.value) return false
  return currentEventParticipant.value.status === ParticipantStatus.CHECKED_IN
})

const shouldShowButtons = computed(() => {
  // Không hiển thị nút nếu đã từ chối hoặc đã check-in
  if (hasRejected.value || hasCheckedIn.value) return false
  // Hiển thị nút nếu có participant (đã đăng ký)
  return !!currentEventParticipant.value
})

const loadCurrentParticipant = async () => {
  try {
    participantLoading.value = true
    const eventId = route.params.id as string
    // TODO: Replace with actual current user participant_id
    // For now, we'll try to find the first participant or handle based on actual implementation
    const result = await getEventParticipants({ 
      event_id: eventId, 
      limit: 1,
      relations: true
    } as any)
    if ((result as any)?.data && (result as any).data.length > 0) {
      const participant = (result as any).data[0]
      currentEventParticipant.value = participant
      
      // Nếu participant đã có status REGISTERED, coi như đã confirm rồi
      // Hiển thị nút "Đã tới" thay vì 2 nút ban đầu
      // Trường hợp mới vào trang lần đầu: sẽ có participant với status REGISTERED
      // nhưng theo logic, sẽ hiển thị 2 nút để user có thể xác nhận lại
      // Chỉ sau khi nhấn "Xác nhận" trong session này mới hiển thị nút "Đã tới"
      isConfirmed.value = false
    } else {
      currentEventParticipant.value = null
      isConfirmed.value = false
    }
  } catch (error) {
    console.error('Error loading current participant:', error)
  } finally {
    participantLoading.value = false
  }
}

const handleRejectAttendance = async () => {
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const submitRejectAttendance = async () => {
  if (!rejectReason.value || rejectReason.value.trim() === '') {
    toast.add({ 
      severity: 'warn', 
      summary: 'Cảnh báo', 
      detail: 'Vui lòng nhập lý do từ chối', 
      life: 3000 
    })
    return
  }

  try {
    const eventId = route.params.id as string
    if (!currentEventParticipant.value) {
      toast.add({ 
        severity: 'warn', 
        summary: 'Cảnh báo', 
        detail: 'Bạn chưa đăng ký tham dự sự kiện này', 
        life: 3000 
      })
      rejectDialogVisible.value = false
      return
    }

    await updateEventParticipant(currentEventParticipant.value.id, {
      status: ParticipantStatus.ABSENT
    } as any)

    // TODO: Save reject reason if needed (might need to add a field to EventParticipant entity)
    console.log('Reject reason:', rejectReason.value)

    toast.add({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: 'Đã từ chối tham dự sự kiện', 
      life: 3000 
    })
    
    rejectDialogVisible.value = false
    rejectReason.value = ''
    await loadCurrentParticipant()
  } catch (error: any) {
    console.error('Error rejecting attendance:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Lỗi', 
      detail: error.data?.message || 'Không thể từ chối tham dự', 
      life: 3000 
    })
  }
}

const handleConfirmAttendance = async () => {
  try {
    const eventId = route.params.id as string
    if (!currentEventParticipant.value) {
      toast.add({ 
        severity: 'warn', 
        summary: 'Cảnh báo', 
        detail: 'Bạn chưa đăng ký tham dự sự kiện này', 
        life: 3000 
      })
      return
    }

    await updateEventParticipant(currentEventParticipant.value.id, {
      status: ParticipantStatus.REGISTERED
    } as any)

    // Đánh dấu đã confirm để hiển thị nút "Đã tới"
    isConfirmed.value = true

    toast.add({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: 'Đã xác nhận tham dự sự kiện', 
      life: 3000 
    })
    
    await loadCurrentParticipant()
  } catch (error: any) {
    console.error('Error confirming attendance:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Lỗi', 
      detail: error.data?.message || 'Không thể xác nhận tham dự', 
      life: 3000 
    })
  }
}

const handleMarkAttended = async () => {
  try {
    const eventId = route.params.id as string
    if (!currentEventParticipant.value) {
      toast.add({ 
        severity: 'warn', 
        summary: 'Cảnh báo', 
        detail: 'Bạn chưa đăng ký tham dự sự kiện này', 
        life: 3000 
      })
      return
    }

    // Gọi API check-in để cấp số và gửi thông báo nếu cần
    const result = await checkIn(currentEventParticipant.value.id)
    
    const serialNumber = (result as any)?.serial_number
    const message = serialNumber 
      ? `Đã đánh dấu đã tới sự kiện. Số thứ tự của bạn: ${serialNumber}` 
      : 'Đã đánh dấu đã tới sự kiện'

    toast.add({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: message, 
      life: 3000 
    })
    
    await loadCurrentParticipant()
  } catch (error: any) {
    console.error('Error marking attended:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Lỗi', 
      detail: error.data?.message || 'Không thể đánh dấu đã tới', 
      life: 3000 
    })
  }
}

onMounted(async () => {
  await Promise.all([loadEvent(), loadDocuments(), loadCurrentParticipant()])
})
</script>
