<template>
  <div :id="mapId" :style="{ width: width, height: height }" class="v-map-container"></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

// Type definitions for VTMap
declare global {
  interface Window {
    vtmapgl?: any
  }
}

interface Props {
  accessToken?: string
  center?: [number, number] // [lng, lat]
  zoom?: number
  style?: string
  width?: string
  height?: string
  mapId?: string
  initialLocation?: {
    address: string
    lat: number
    lng: number
  } | null
  targetLocation?: {
    lat: number
    lng: number
  } | null
  distanceThreshold?: number // Khoảng cách tối thiểu (mét) để emit event, mặc định 100m
  enableDistanceCheck?: boolean // Bật/tắt kiểm tra khoảng cách
}

const props = withDefaults(defineProps<Props>(), {
  accessToken: '6ht5fdbc-1996-4f54-87gf-5664f304f3d2',
  center: () => [108.2022, 16.0544] as [number, number],
  zoom: 13,
  style: 'vtmapgl.STYLES.VTRANS',
  width: '100%',
  height: '400px',
  mapId: 'vtmap',
  initialLocation: null,
  targetLocation: null,
  distanceThreshold: 100,
  enableDistanceCheck: false
})

const map = ref<any>(null)
// Generate unique mapId if not provided (once per component instance)
const mapId = ref(props.mapId || `vtmap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
const mapLoaded = ref(false)

// State để theo dõi vị trí hiện tại và kiểm tra khoảng cách
const currentLocation = ref<{ lat: number; lng: number } | null>(null)
const distanceCheckInterval = ref<NodeJS.Timeout | null>(null)
const hasEmittedWithinRange = ref(false) // Để tránh emit nhiều lần

// Kiểm tra khoảng cách và emit event nếu trong phạm vi
const checkDistance = () => {
  if (!props.enableDistanceCheck || !props.targetLocation || !currentLocation.value) {
    return
  }

  const distance = getDistanceInMeters(
    currentLocation.value.lat,
    currentLocation.value.lng,
    props.targetLocation.lat,
    props.targetLocation.lng
  )

  if (distance <= props.distanceThreshold && !hasEmittedWithinRange.value) {
    hasEmittedWithinRange.value = true
    emit('within-range', {
      currentLocation: currentLocation.value,
      targetLocation: props.targetLocation,
      distance
    })
  } else if (distance > props.distanceThreshold) {
    // Reset flag nếu ra khỏi phạm vi (để có thể emit lại khi vào lại)
    hasEmittedWithinRange.value = false
  }
}

// Bắt đầu theo dõi khoảng cách
const startDistanceTracking = () => {
  if (!props.enableDistanceCheck || !props.targetLocation) {
    return
  }

  // Kiểm tra mỗi 5 giây
  if (distanceCheckInterval.value) {
    clearInterval(distanceCheckInterval.value)
  }

  distanceCheckInterval.value = setInterval(() => {
    checkDistance()
  }, 5000) // Check every 5 seconds
}

// Dừng theo dõi khoảng cách
const stopDistanceTracking = () => {
  if (distanceCheckInterval.value) {
    clearInterval(distanceCheckInterval.value)
    distanceCheckInterval.value = null
  }
}

const emit = defineEmits<{
  'map-created': [map: any]
  'map-loaded': [map: any]
  'map-error': [error: any]
  'map-selected': [location: { address: string; lat: number; lng: number }]
  'location-found': [location: { lat: number; lng: number }]
  'within-range': [data: { currentLocation: { lat: number; lng: number }; targetLocation: { lat: number; lng: number }; distance: number }]
}>()

const loadScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (window.vtmapgl) {
      resolve()
      return
    }

    // Load main CSS
    if (!document.querySelector('link[href*="vtmap-gl.css"]')) {
      const link = document.createElement('link')
      link.href = 'https://files-maps.viettel.vn/sdk/vtmap-gl-js/v4.0.0/vtmap-gl.css'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }

    // Load geocoder CSS
    if (!document.querySelector('link[href*="vtmap-gl-geocoder.css"]')) {
      const geocoderLink = document.createElement('link')
      geocoderLink.href = 'https://files-maps.viettel.vn/sdk/vtmap-gl-geocoder/v4.0.0/vtmap-gl-geocoder.css'
      geocoderLink.rel = 'stylesheet'
      document.head.appendChild(geocoderLink)
    }

    // Load main JS
    const existingMainScript = document.querySelector('script[src*="vtmap-gl.js"]')
    if (existingMainScript) {
      // Main script already exists, check for geocoder script
      const existingGeocoderScript = document.querySelector('script[src*="vtmap-gl-geocoder.js"]')
      if (existingGeocoderScript) {
        resolve()
        return
      }
      // Load geocoder script only
      const geocoderScript = document.createElement('script')
      geocoderScript.src = 'https://files-maps.viettel.vn/sdk/vtmap-gl-geocoder/v4.0.0/vtmap-gl-geocoder.js'
      geocoderScript.async = true
      geocoderScript.onload = () => resolve()
      geocoderScript.onerror = () => reject(new Error('Failed to load VTMap Geocoder script'))
      document.head.appendChild(geocoderScript)
      return
    }

    // Load main JS first
    const mainScript = document.createElement('script')
    mainScript.src = 'https://files-maps.viettel.vn/sdk/vtmap-gl-js/v4.0.0/vtmap-gl.js'
    mainScript.async = true
    mainScript.onload = () => {
      // After main script loads, load geocoder script
      const geocoderScript = document.createElement('script')
      geocoderScript.src = 'https://files-maps.viettel.vn/sdk/vtmap-gl-geocoder/v4.0.0/vtmap-gl-geocoder.js'
      geocoderScript.async = true
      geocoderScript.onload = () => resolve()
      geocoderScript.onerror = () => reject(new Error('Failed to load VTMap Geocoder script'))
      document.head.appendChild(geocoderScript)
    }
    mainScript.onerror = () => reject(new Error('Failed to load VTMap script'))
    document.head.appendChild(mainScript)
  })
}

// Tính khoảng cách giữa hai điểm trên bề mặt Trái Đất (đơn vị: mét)
const getDistanceInMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000 // bán kính Trái Đất (m)
  const toRad = (deg: number) => deg * Math.PI / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Xác định style cho map
const getMapStyle = () => {
  if (props.style === 'vtmapgl.STYLES.VSATELLITE') {
    return window.vtmapgl.STYLES.VSATELLITE
  } else if (props.style === 'vtmapgl.STYLES.VDARK') {
    return window.vtmapgl.STYLES.VDARK
  }
  return window.vtmapgl.STYLES.VTRANS
}

// Khởi tạo map instance
const createMapInstance = () => {
  // Verify container exists before creating map
  const container = document.getElementById(mapId.value)
  if (!container) {
    throw new Error(`Container '${mapId.value}' not found. Make sure the DOM element exists.`)
  }

  const mapStyle = getMapStyle()
  return new window.vtmapgl.Map({
    container: mapId.value,
    style: mapStyle,
    center: props.center,
    zoom: props.zoom
  })
}

// Thêm control định vị vị trí
const geolocateControlRef = ref<any>(null)
const geolocateCompleted = ref(false)
const addGeolocateControl = () => {
  const geolocateControl = new window.vtmapgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true
  })
  
  // Lắng nghe event khi geolocate hoàn tất
  geolocateControl.on('geolocate', (e: any) => {
    geolocateCompleted.value = true
    // Lấy tọa độ từ event nếu có
    if (e?.coords) {
      const lat = e.coords.latitude
      const lng = e.coords.longitude
      currentLocation.value = { lat, lng }
      emit('location-found', { lat, lng })
      checkDistance() // Kiểm tra ngay khi có location
    } else if (map.value) {
      // Nếu không có trong event, lấy từ map center (map đã tự động di chuyển đến vị trí)
      setTimeout(() => {
        const center = map.value.getCenter()
        if (center) {
          const lat = center.lat
          const lng = center.lng
          currentLocation.value = { lat, lng }
          console.log('location-found', { lat, lng })
          emit('location-found', { lat, lng })
          checkDistance() // Kiểm tra ngay khi có location
        }
      }, 100)
    }
    // Nếu có initialLocation, sau khi geolocate xong thì thêm marker (Step 2)
    if (props.initialLocation) {
      setTimeout(() => {
        applyInitialLocation()
      }, 500)
    }
  })
  
  // Lắng nghe event khi geolocate error hoặc user location updated
  geolocateControl.on('error', (e: any) => {
    geolocateCompleted.value = true
    console.error('Geolocate error:', e)
    // Nếu có initialLocation và geolocate lỗi, vẫn thêm marker (Step 2)
    if (props.initialLocation) {
      setTimeout(() => {
        applyInitialLocation()
      }, 500)
    }
  })

  // Event locationfound - khi VTMap tìm thấy vị trí (Mapbox/VTMap specific event)
  geolocateControl.on('locationfound', (e: any) => {
    geolocateCompleted.value = true
    // Lấy tọa độ từ event hoặc từ map center
    if (e?.lngLat) {
      const lat = e.lngLat.lat
      const lng = e.lngLat.lng
      currentLocation.value = { lat, lng }
      emit('location-found', { lat, lng })
      checkDistance() // Kiểm tra ngay khi có location
    } else if (map.value) {
      // Fallback: lấy từ map center sau khi geolocate
      setTimeout(() => {
        const center = map.value.getCenter()
        if (center) {
          const lat = center.lat
          const lng = center.lng
          currentLocation.value = { lat, lng }
          emit('location-found', { lat, lng })
          checkDistance() // Kiểm tra ngay khi có location
        }
      }, 100)
    }
    // Nếu có initialLocation, sau khi location found thì thêm marker (Step 2)
    if (props.initialLocation) {
      setTimeout(() => {
        applyInitialLocation()
      }, 500)
    }
  })
  
  map.value.addControl(geolocateControl)
  geolocateControlRef.value = geolocateControl

  // Lắng nghe sự thay đổi vị trí user (khi user di chuyển)
  geolocateControl.on('trackuserlocationstart', () => {
    // Bắt đầu theo dõi khoảng cách khi bắt đầu track user location
    if (props.enableDistanceCheck) {
      startDistanceTracking()
    }
  })

  geolocateControl.on('trackuserlocationend', () => {
    // Dừng theo dõi khi không track nữa
    stopDistanceTracking()
  })
}

// Thêm control tìm kiếm địa điểm
const addGeocoderControl = () => {
  const geocoder = new (window as any).Geocoder({
    flyTo: true,
    accessToken: window.vtmapgl.accessToken,
    zoom: 12,
    placeholder: 'Nhập địa điểm',
    autocomplete: true,
    vtmapgl: window.vtmapgl,
    marker: {
      color: 'red'
    },
    render: (e: any) => {
      return `<div class="vtmapgl-ctrl-geocoder--suggestion-title">
          ${e.text}
        </div>
        <div class="vtmapgl-ctrl-geocoder--suggestion-address">
          ${e.place_name}
        </div>`
    },
    getItemValue: (item: any) => item.text || item.place_name
  })
  map.value.addControl(geocoder)
}

// Khởi tạo geocoder service (dùng chung cho toàn component)
let geocoderService: any = null
const currentMarkers: any[] = []

// Xử lý chọn vị trí: geocoding và emit event
const handleLocationSelect = (lng: number, lat: number, existingMarker?: any) => {
  if (!geocoderService) {
    geocoderService = new window.vtmapgl.GeocoderAPIService({ 
      accessToken: window.vtmapgl.accessToken 
    })
  }
  
  geocoderService.fetchLatlngToAddress(
    `${lat}, ${lng}`, 
    (result: any, status: any) => {
      if (status == 0 && result.items.length > 0) {
        const address = result.items[0].address
        
        // Nếu có marker sẵn (khi drag), chỉ cập nhật popup
        if (existingMarker) {
          const popup = new window.vtmapgl.Popup().setHTML(`<div>${address}</div>`)
          existingMarker.setPopup(popup)
          // Mở popup sau khi cập nhật
          existingMarker.togglePopup()
        } else {
          // Tạo marker mới khi click vào map
          createLocationMarker(lng, lat, address)
        }
        
        // Emit map-selected event
        emit('map-selected', {
          address: address,
          lat: lat,
          lng: lng
        })
      }
    }
  )
}

// Tạo marker và popup cho vị trí được chọn
const createLocationMarker = (lng: number, lat: number, address: string) => {
  const marker = new window.vtmapgl.Marker({
    draggable: true
  }).setLngLat([lng, lat])
  
  const popup = new window.vtmapgl.Popup().setHTML(`<div>${address}</div>`)
  marker.setPopup(popup)
  marker.addTo(map.value)
  
  // Mở popup tự động khi marker được tạo
  marker.togglePopup()
  
  currentMarkers.push(marker)
  
  // Xóa marker cũ nếu có nhiều hơn 1 marker
  if (currentMarkers.length > 1) {
    const oldMarker: any = currentMarkers.shift()
    oldMarker.remove()
  }
  
  // Xử lý khi kéo thả marker
  marker.on('dragend', () => {
    const lngLat = marker.getLngLat()
    handleLocationSelect(lngLat.lng, lngLat.lat, marker)
  })
  
  return marker
}

// Setup event handler khi click vào map
const setupMapClickHandler = () => {
  map.value.on('click', (e: any) => {
    const { lng, lat } = e.lngLat
    handleLocationSelect(lng, lat)
  })
}

// Setup event handler khi map load xong
const setupMapLoadHandler = () => {
  map.value.on('load', () => {
    mapLoaded.value = true
    emit('map-loaded', map.value)
    
    // Reset geolocate completed flag
    geolocateCompleted.value = false
    
    // Luôn trigger nút "Find my location" trước (Step 1)
    setTimeout(() => {
      triggerGeolocateButton()
      
      // Nếu có initialLocation, đợi geolocate xong rồi mới thêm marker (Step 2)
      // Nếu không có geolocate event trong 3 giây, vẫn thêm marker
      if (props.initialLocation) {
        setTimeout(() => {
          if (!geolocateCompleted.value) {
            geolocateCompleted.value = true
            applyInitialLocation()
          }
        }, 3000)
      }
    }, 500)
  })
}

// Tự động click vào nút "Find my location"
const triggerGeolocateButton = () => {
  // Tìm button trong DOM
  const geolocateButton = document.querySelector('.vtmapgl-ctrl-geolocate') as HTMLButtonElement
  if (geolocateButton) {
    geolocateButton.click()
  } else {
    // Nếu chưa tìm thấy, thử lại sau một chút
    setTimeout(() => {
      triggerGeolocateButton()
    }, 200)
  }
}

// Hàm chính khởi tạo map
const initMap = () => {
  if (!window.vtmapgl || mapLoaded.value) {
    return
  }

  // Verify container exists
  const container = document.getElementById(mapId.value)
  if (!container) {
    console.warn(`Container '${mapId.value}' not found yet, retrying...`)
    // Retry after a short delay
    setTimeout(() => {
      initMap()
    }, 100)
    return
  }

  try {
    // Set access token
    window.vtmapgl.accessToken = props.accessToken

    // Khởi tạo map
    map.value = createMapInstance()

    // Thêm các controls
    addGeolocateControl()
    addGeocoderControl()

    // Setup event handlers
    setupMapClickHandler()
    setupMapLoadHandler()

    // Emit event map created
    emit('map-created', map.value)
  } catch (error) {
    console.error('Error initializing VTMap:', error)
    emit('map-error', error)
  }
}

// Áp dụng vị trí khởi tạo (nếu truyền vào)
const applyInitialLocation = () => {
  if (!props.initialLocation || !map.value) return
  const { lat, lng, address } = props.initialLocation
  const marker = createLocationMarker(lng, lat, address)
  map.value.setCenter([lng, lat])
  emit('map-selected', { address, lat, lng })
}

// Watch for center changes
watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    map.value.setCenter(newCenter)
  }
}, { deep: true })

// Watch for initialLocation changes (ví dụ khi parent truyền địa chỉ mới)
watch(() => props.initialLocation, (loc) => {
  if (!loc || !map.value) return
  applyInitialLocation()
}, { deep: true })

// Watch for targetLocation changes
watch(() => props.targetLocation, (newTarget) => {
  if (newTarget && props.enableDistanceCheck && currentLocation.value) {
    // Reset flag khi target location thay đổi
    hasEmittedWithinRange.value = false
    checkDistance()
  }
}, { deep: true })

// Watch for enableDistanceCheck changes
watch(() => props.enableDistanceCheck, (enabled) => {
  if (enabled && props.targetLocation) {
    startDistanceTracking()
  } else {
    stopDistanceTracking()
  }
})

// Watch for zoom changes
watch(() => props.zoom, (newZoom) => {
  if (map.value && newZoom) {
    map.value.setZoom(newZoom)
  }
})

onMounted(async () => {
  try {
    await loadScript()
    // Wait for DOM to be fully rendered and script to initialize
    // Use nextTick to ensure the template has rendered
    await nextTick()
    setTimeout(() => {
      initMap()
    }, 200)
  } catch (error) {
    console.error('Error loading VTMap SDK:', error)
    emit('map-error', error)
  }
})

onBeforeUnmount(() => {
  stopDistanceTracking()
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

defineExpose({
  getMap: () => map.value,
  setCenter: (center: [number, number]) => {
    if (map.value) {
      map.value.setCenter(center)
    }
  },
  setZoom: (zoom: number) => {
    if (map.value) {
      map.value.setZoom(zoom)
    }
  },
  // Cho phép parent chọn vị trí từ bên ngoài (ví dụ khi có sẵn địa chỉ & toạ độ)
  selectLocation: (lng: number, lat: number, address: string) => {
    if (!map.value) return
    createLocationMarker(lng, lat, address)
    map.value.setCenter([lng, lat])
    emit('map-selected', { address, lat, lng })
  },
  // Expose hàm tính khoảng cách để parent component có thể sử dụng
  getDistanceInMeters
})
</script>

<style scoped>
.v-map-container {
  border-radius: 8px;
  overflow: hidden;
}
</style>
