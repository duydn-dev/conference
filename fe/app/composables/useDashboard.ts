export const useDashboard = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getStats = async () => {
    return await $fetch('/dashboard/stats', { baseURL })
  }

  const getEventsByStatus = async () => {
    return await $fetch('/dashboard/events-by-status', { baseURL })
  }

  const getEventsMonthly = async () => {
    return await $fetch('/dashboard/events-monthly', { baseURL })
  }

  const getParticipantsOverTime = async () => {
    return await $fetch('/dashboard/participants-over-time', { baseURL })
  }

  const getTopOrganizers = async () => {
    return await $fetch('/dashboard/top-organizers', { baseURL })
  }

  const getRecentEvents = async () => {
    return await $fetch('/dashboard/recent-events', { baseURL })
  }

  return {
    getStats,
    getEventsByStatus,
    getEventsMonthly,
    getParticipantsOverTime,
    getTopOrganizers,
    getRecentEvents,
  }
}
