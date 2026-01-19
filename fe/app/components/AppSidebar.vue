<template>
  <aside class="w-20 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] py-6 flex flex-col items-center gap-3">
    <!-- Dashboard -->
    <NuxtLink 
      to="/" 
      v-tooltip.right="'Dashboard'"
      :class="getLinkClass('/')"
    >
      <i :class="getIconClass('/', 'pi-home')"></i>
    </NuxtLink>
    
    <!-- Sự kiện -->
    <NuxtLink 
      to="/events" 
      v-tooltip.right="'Sự kiện'"
      :class="getLinkClass('/events')"
    >
      <i :class="getIconClass('/events', 'pi-calendar')"></i>
    </NuxtLink>
    
    <!-- Thông báo -->
    <NuxtLink 
      to="/notifications" 
      v-tooltip.right="'Thông báo'"
      :class="getLinkClass('/notifications')"
    >
      <i :class="getIconClass('/notifications', 'pi-bell')"></i>
    </NuxtLink>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Kiểm tra xem route hiện tại có khớp với path không
const isActive = (path: string) => {
  if (path === '/') {
    // Chỉ active khi đúng trang chủ
    return route.path === '/'
  }
  // Active khi path bắt đầu bằng menu path
  return route.path.startsWith(path)
}

// Lấy class cho link dựa trên active state
const getLinkClass = (path: string) => {
  const baseClass = 'w-12 h-12 rounded-lg flex items-center justify-center transition-colors'
  const activeClass = 'bg-sky-50 hover:bg-sky-100'
  const inactiveClass = 'hover:bg-gray-100'
  
  return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`
}

// Lấy class cho icon dựa trên active state
const getIconClass = (path: string, iconName: string) => {
  const baseClass = `pi ${iconName} text-lg`
  const activeClass = 'text-sky-600'
  const inactiveClass = 'text-gray-600 hover:text-sky-600'
  
  return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`
}
</script>
