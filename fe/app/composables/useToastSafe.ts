import { useToast } from 'primevue/usetoast'

export const useToastSafe = () => {
  if (process.server) {
    // Return a mock toast service for SSR
    return {
      add: () => {},
      remove: () => {},
      removeGroup: () => {},
      removeAllGroups: () => {}
    }
  }
  return useToast()
}
