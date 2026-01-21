<template>
  <div v-if="loading" class="fixed top-0 left-0 right-0 z-[9999]">
    <div class="h-1 bg-gray-200 overflow-hidden">
      <div 
        class="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 transition-all duration-300 ease-out"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const nuxtApp = useNuxtApp()
const loading = ref(false)
const progress = ref(0)

// Listen to page transitions
nuxtApp.hook('page:start', () => {
  loading.value = true
  progress.value = 0
  // Simulate progress
  const interval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += 10
    }
  }, 100)
  
  // Store interval to clear later
  ;(nuxtApp as any).__loadingInterval = interval
})

nuxtApp.hook('page:finish', () => {
  progress.value = 100
  setTimeout(() => {
    loading.value = false
    if ((nuxtApp as any).__loadingInterval) {
      clearInterval((nuxtApp as any).__loadingInterval)
    }
  }, 300)
})
</script>
