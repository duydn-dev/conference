<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Header Bar -->
    <AppHeader />

    <div class="flex">
      <!-- Left Sidebar -->
      <AppSidebar />

      <!-- Main Content -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Layout with header and sidebar
</script>
