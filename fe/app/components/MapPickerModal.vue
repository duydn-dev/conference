<template>
  <Dialog 
    :visible="visible" 
    @update:visible="handleVisibleChange"
    modal 
    header="Chọn vị trí trên bản đồ" 
    :draggable="false"
    position="center"
    :style="{ width: '90vw', maxWidth: '900px' }"
    :closable="true"
    @hide="handleClose"
  >
    <div class="mb-4">
      <VMap 
        ref="mapRef"
        :center="mapCenter"
        :zoom="zoom"
        height="500px"
        @map-loaded="onMapLoaded"
        @map-selected="handleMapSelected"
      />
    </div>
    <div class="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <i class="pi pi-info-circle"></i>
      <span>Click vào bản đồ để chọn vị trí</span>
    </div>
    <template #footer>
      <div class="mt-3">
        <Button label="Hủy" icon="pi pi-times" class="p-button-text" @click="handleClose" />
        <Button label="Xác nhận" icon="pi pi-check" @click="handleConfirm" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToastSafe } from '~/composables/useToastSafe'

interface Props {
  visible?: boolean
  center?: [number, number] // [lng, lat]
  zoom?: number
  initialLocation?: {
    address: string;
    lat: number;
    lng: number;
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  center: () => [108.2022, 16.0544] as [number, number],
  zoom: 15,
  initialLocation: null
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'location-selected': [location: { address: string; lat: number; lng: number }]
}>()

const toast = useToastSafe()
const mapRef = ref<any>(null)
const mapCenter = ref<[number, number]>(props.center)
const selectedLocation = ref<{ address: string; lat: number; lng: number } | null>(null)

// Watch for center prop changes
watch(() => props.center, (newCenter) => {
  if (newCenter) {
    mapCenter.value = newCenter
    if (mapRef.value?.getMap) {
      const map = mapRef.value.getMap()
      if (map) {
        map.setCenter(newCenter)
      }
    }
  }
}, { deep: true })

// Watch for visible prop changes
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    if (props.initialLocation) {
      // Nếu có vị trí khởi tạo, chọn sẵn vị trí đó
      selectedLocation.value = props.initialLocation
      mapCenter.value = [props.initialLocation.lng, props.initialLocation.lat]
      if (mapRef.value?.selectLocation) {
        mapRef.value.selectLocation(
          props.initialLocation.lng,
          props.initialLocation.lat,
          props.initialLocation.address
        )
      }
    } else {
      selectedLocation.value = null
      mapCenter.value = props.center
    }
  }
})

const onMapLoaded = (mapInstance: any) => {
  // Map is loaded, VMap will handle clicks via map-selected event
}

const handleMapSelected = (location: { address: string; lat: number; lng: number }) => {
  selectedLocation.value = location
}

const handleVisibleChange = (value: boolean) => {
  emit('update:visible', value)
}

const handleClose = () => {
  emit('update:visible', false)
  selectedLocation.value = null
}

const handleConfirm = () => {
  if (selectedLocation.value) {
    emit('location-selected', selectedLocation.value)
    toast.add({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: 'Đã chọn vị trí thành công', 
      life: 2000 
    })
    handleClose()
  } else {
    toast.add({ 
      severity: 'warn', 
      summary: 'Cảnh báo', 
      detail: 'Vui lòng chọn vị trí trên bản đồ', 
      life: 3000 
    })
  }
}

defineExpose({
  getSelectedLocation: () => selectedLocation.value
})
</script>
