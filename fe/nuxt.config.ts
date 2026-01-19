// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

// Define Sky theme preset based on Aura with sky color palette
const Sky = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{sky.50}',
      100: '{sky.100}',
      200: '{sky.200}',
      300: '{sky.300}',
      400: '{sky.400}',
      500: '{sky.500}',
      600: '{sky.600}',
      700: '{sky.700}',
      800: '{sky.800}',
      900: '{sky.900}',
      950: '{sky.950}'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{sky.500}',
          contrastColor: '#ffffff',
          hoverColor: '{sky.600}',
          activeColor: '{sky.700}'
        }
      }
    }
  }
});

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001'
    }
  },
  modules: [
    '@nuxt/image',
    '@primevue/nuxt-module'
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['vue3-apexcharts', 'apexcharts']
    }
  },
  primevue: {
    usePrimeVue: true,
    autoImport: true,
    options: {
      locale: {
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
      },
      theme: {
        preset: Sky,
        options: {
          // cssLayer: {
          //   name: 'primevue',
          //   order: 'app-styles, primevue, tailwindcss'
          // },
          // Toggle dark mode by adding 'd-' class to the document root
          darkModeSelector: '.d-'
        }
      },
      unstyled: false
    },
    components: {
      include: ['*']
    },
    composables: {
      include: ['useToast']
    },
    directives: {
      include: ['Tooltip']
    }
  },
  css: ['~/assets/css/main.css']
} as any)