import { usePrimeVue } from 'primevue/config'
import ToastService from 'primevue/toastservice'

export default defineNuxtPlugin((nuxtApp) => {
  // PrimeVue theme is configured in nuxt.config.ts
  // Provide ToastService for useToast composable
  nuxtApp.vueApp.use(ToastService)
  
  // Set locale after app is mounted
  if (process.client) {
    const primevue = usePrimeVue()
    primevue.config.locale = {
      firstDayOfWeek: 1,
      dayNames: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
      dayNamesShort: ['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'],
      dayNamesMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      monthNames: [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ],
      monthNamesShort: [
        'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6',
        'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'
      ],
      today: 'Hôm nay',
      clear: 'Xóa',
      weekHeader: 'Tuần'
    }
  }
})
