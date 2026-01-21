<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Header Bar -->
    <AppHeader />

    <div class="flex">
      <!-- Left Sidebar -->
      <AppSidebar />

      <!-- Main Content -->
      <main class="flex-1 p-6 pb-20 md:pb-6">
        <slot />
      </main>
    </div>

    <!-- Bottom Navigation (Mobile) -->
    <AppBottomNav />
  </div>
</template>

<script setup lang="ts">
// Layout with header and sidebar
</script>
