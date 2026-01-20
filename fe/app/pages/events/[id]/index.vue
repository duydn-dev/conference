<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Chi tiết sự kiện</h1>
        <p class="text-gray-500 text-sm mt-1">Xem thông tin chi tiết sự kiện</p>
      </div>
      <Button 
        label="Quay lại danh sách" 
        icon="pi pi-arrow-left" 
        class="p-button-text"
        @click="navigateTo('/events')"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
      <p class="text-gray-500 mt-4">Đang tải dữ liệu...</p>
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
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Ngày tạo</span>
            <span class="font-medium">{{ event.created_at ? formatDateTime(event.created_at) : '-' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Cập nhật lần cuối</span>
            <span class="font-medium">{{ event.updated_at ? formatDateTime(event.updated_at) : '-' }}</span>
          </div>
          <div class="pt-3 mt-2 border-t border-gray-100 flex justify-end">
            <Button 
              label="Chỉnh sửa sự kiện" 
              icon="pi pi-pencil" 
              class="p-button-outlined p-button-sm text-sky-600 border-sky-200"
              @click="navigateTo(`/events/${route.params.id}/edit`)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEvents } from '~/composables/useEvents'
import { useEventDocuments } from '~/composables/useEventDocuments'
import { useToastSafe } from '~/composables/useToastSafe'
import { useRoute } from 'vue-router'
import { EventStatus, EventStatusLabels } from '~/types/event'
import type { EventDocument } from '~/types/event-document'
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
const { getFullUrl } = useFileUrl()

const event = ref<any | null>(null)
const loading = ref(true)

// Documents state
const documents = ref<EventDocument[]>([])

const loadEvent = async () => {
  try {
    loading.value = true
    const eventId = route.params.id as string
    const response = await getById(eventId)
    const data = (response.data.value as any)
    
    if (data) {
      event.value = data
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
    const response = await getDocuments({ event_id: eventId, limit: 100 } as any)
    const result = (response.data.value as any)
    if (result) {
      documents.value = result.data || []
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

onMounted(async () => {
  await Promise.all([loadEvent(), loadDocuments()])
})
</script>
