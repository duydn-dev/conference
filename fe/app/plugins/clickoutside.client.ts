// ~/plugins/click-outside.ts
import type { App, Directive } from 'vue';

const clickOutsideDirective: Directive = {
  mounted(el, binding) {
    el._clickOutsideHandler = function (event: MouseEvent) {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event);
      }
    };
    
    // Sử dụng setTimeout để tránh kích hoạt ngay lập tức
    setTimeout(() => {
      document.addEventListener('click', el._clickOutsideHandler);
      document.addEventListener('touchstart', el._clickOutsideHandler);
    }, 0);
  },
  
  unmounted(el) {
    document.removeEventListener('click', el._clickOutsideHandler);
    document.removeEventListener('touchstart', el._clickOutsideHandler);
  }
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('click-outside', clickOutsideDirective);
});