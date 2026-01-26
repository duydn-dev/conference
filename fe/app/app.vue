<template>
  <!-- <NuxtLoadingIndicator /> -->
  <NuxtLayout>
    <NuxtPage />
    <Toast position="top-right" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
</script>

<style>
/* Responsive Toast styles for mobile */
@media (max-width: 640px) {
  .p-toast {
    width: calc(100vw - 2rem) !important;
    max-width: 100% !important;
    left: 1rem !important;
    right: 1rem !important;
  }
  
  .p-toast-message {
    max-width: 100% !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }
  
  .p-toast-message-content {
    max-width: 100% !important;
  }
  
  .p-toast-summary,
  .p-toast-detail {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    max-width: 100% !important;
  }
}
</style>
