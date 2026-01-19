<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="flex items-center justify-between px-6 py-4">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <img src="/imgs/ihanoi.png" alt="Logo" class="h-10 w-auto" />
        <span class="text-xl font-bold text-gray-800">Conference</span>
      </div>

      <!-- Right side actions -->
      <div class="flex items-center gap-4">
        <!-- Search -->
        <div class="relative hidden md:block">
          <input
            type="text"
            placeholder="Tìm kiếm"
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>

        <!-- Icons -->
        <div class="flex items-center gap-3">
          <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <i class="pi pi-bell text-gray-600"></i>
          </button>
          <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <i class="pi pi-cog text-gray-600"></i>
          </button>
          <div class="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
            <i class="pi pi-user text-sky-600 text-sm"></i>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// App Header Component
</script>
