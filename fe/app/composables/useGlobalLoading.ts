// Global state (singleton)
const globalLoadingState = ref(false)
const globalLoadingMessage = ref<string>('Đang tải dữ liệu...')

export const useGlobalLoading = () => {
  const show = (msg?: string) => {
    if (msg) globalLoadingMessage.value = msg
    globalLoadingState.value = true
  }

  const hide = () => {
    globalLoadingState.value = false
  }

  const setMessage = (msg: string) => {
    globalLoadingMessage.value = msg
  }

  return {
    loading: readonly(globalLoadingState),
    message: readonly(globalLoadingMessage),
    show,
    hide,
    setMessage
  }
}
