<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center gap-2 mb-6">
        <i class="pi pi-bell text-sky-600 text-lg"></i>
        <h1 class="text-xl font-semibold text-gray-800">Thông báo</h1>
      </div>
      
      <div class="text-center py-12">
        <i class="pi pi-bell text-gray-300 text-6xl mb-4"></i>
        <p class="text-gray-500">Chưa có thông báo nào</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Thông báo'
})
</script>
