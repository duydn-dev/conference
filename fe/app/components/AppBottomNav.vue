<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
    <div class="flex items-center justify-around h-16">
      <!-- Dashboard -->
      <NuxtLink 
        to="/" 
        :class="getLinkClass('/')"
        class="flex flex-col items-center justify-center flex-1 h-full"
      >
        <i :class="getIconClass('/', 'pi-home')"></i>
        <span :class="getLabelClass('/')" class="text-xs mt-1">Trang chủ</span>
      </NuxtLink>
      
      <!-- Sự kiện -->
      <NuxtLink 
        to="/events" 
        :class="getLinkClass('/events')"
        class="flex flex-col items-center justify-center flex-1 h-full"
      >
        <i :class="getIconClass('/events', 'pi-calendar')"></i>
        <span :class="getLabelClass('/events')" class="text-xs mt-1">Sự kiện</span>
      </NuxtLink>
      
      <!-- Đơn vị tổ chức -->
      <NuxtLink 
        to="/organizer-units" 
        :class="getLinkClass('/organizer-units')"
        class="flex flex-col items-center justify-center flex-1 h-full"
      >
        <i :class="getIconClass('/organizer-units', 'pi-building')"></i>
        <span :class="getLabelClass('/organizer-units')" class="text-xs mt-1">Đơn vị</span>
      </NuxtLink>
      
      <!-- Mini Game -->
      <NuxtLink 
        to="/minigames" 
        :class="getLinkClass('/minigames')"
        class="flex flex-col items-center justify-center flex-1 h-full"
      >
        <i :class="getIconClass('/minigames', 'pi-trophy')"></i>
        <span :class="getLabelClass('/minigames')" class="text-xs mt-1">Game</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Kiểm tra xem route hiện tại có khớp với path không
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// Lấy class cho link dựa trên active state
const getLinkClass = (path: string) => {
  const baseClass = 'transition-colors'
  const activeClass = 'text-sky-600'
  const inactiveClass = 'text-gray-600'
  
  return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`
}

// Lấy class cho icon dựa trên active state
const getIconClass = (path: string, iconName: string) => {
  const baseClass = `pi ${iconName} text-xl`
  return baseClass
}

// Lấy class cho label dựa trên active state
const getLabelClass = (path: string) => {
  const activeClass = 'font-medium'
  const inactiveClass = ''
  
  return isActive(path) ? activeClass : inactiveClass
}
</script>
